import express, { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import blobStorageService from '../services/blobStorage';

const router = express.Router();

// Configure multer for memory storage (no local filesystem)
const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory buffer
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop() || '');
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload photo for a task
router.post('/:taskId', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { photoType = 'completion', description = '' } = req.body;
    // Get user ID from auth middleware, or get the first available user
    let uploadedBy = (req as any).user?.id;
    
    if (!uploadedBy) {
      // If no authenticated user, get the first available user from the database
      const { rows: users } = await pool.query('SELECT id FROM users LIMIT 1');
      if (users.length > 0) {
        uploadedBy = users[0].id;
      } else {
        return res.status(400).json({ error: 'No users available in the system' });
      }
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }
    
    // Verify task exists
    const { rows: [task] } = await pool.query(
      'SELECT id FROM tasks WHERE id = $1',
      [taskId]
    );
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Ensure Azure Blob Storage container exists
    await blobStorageService.ensureContainerExists();
    
    // Upload photo to Azure Blob Storage
    const uploadResult = await blobStorageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'task-photos'
    );
    
    if (!uploadResult.success) {
      return res.status(500).json({ error: 'Failed to upload photo to storage', details: uploadResult.error });
    }
    
    // Save photo record to database with Azure Blob Storage URL
    const photoUrl = uploadResult.url;
    const { rows: [photo] } = await pool.query(`
      INSERT INTO task_photos (task_id, photo_url, photo_type, uploaded_by, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [taskId, photoUrl, photoType, uploadedBy, description]);
    
    return res.status(201).json({
      message: 'Photo uploaded successfully',
      photo: {
        ...photo,
        photo_url: photoUrl
      }
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get photos for a task
router.get('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    const { rows: photos } = await pool.query(`
      SELECT tp.*, u.name as uploaded_by_name
      FROM task_photos tp
      LEFT JOIN users u ON tp.uploaded_by = u.id
      WHERE tp.task_id = $1
      ORDER BY tp.uploaded_at DESC
    `, [taskId]);
    
    res.json({ photos });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Failed to get photos' });
  }
});

// Delete a photo
router.delete('/:photoId', async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;
    
    // Get photo info
    const { rows: [photo] } = await pool.query(
      'SELECT * FROM task_photos WHERE id = $1',
      [photoId]
    );
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Delete file from Azure Blob Storage
    if (photo.photo_url && photo.photo_url.includes('blob.core.windows.net')) {
      // Extract blob name from URL
      const urlParts = photo.photo_url.split('/');
      const blobName = urlParts.slice(-2).join('/'); // Get folder/filename
      await blobStorageService.deleteFile(blobName);
    }
    
    // Delete from database
    await pool.query('DELETE FROM task_photos WHERE id = $1', [photoId]);
    
    return res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    return res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router; 