"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const database_1 = __importDefault(require("../config/database"));
const blobStorage_1 = __importDefault(require("../services/blobStorage"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop() || '');
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
router.post('/:taskId', upload.single('photo'), async (req, res) => {
    try {
        const { taskId } = req.params;
        const { photoType = 'completion', description = '' } = req.body;
        let uploadedBy = req.user?.id;
        if (!uploadedBy) {
            const { rows: users } = await database_1.default.query('SELECT id FROM users LIMIT 1');
            if (users.length > 0) {
                uploadedBy = users[0].id;
            }
            else {
                return res.status(400).json({ error: 'No users available in the system' });
            }
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No photo uploaded' });
        }
        const { rows: [task] } = await database_1.default.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const { rows: existingPhotos } = await database_1.default.query('SELECT COUNT(*) as photo_count FROM task_photos WHERE task_id = $1', [taskId]);
        if (parseInt(existingPhotos[0].photo_count) >= 5) {
            return res.status(400).json({
                error: 'Maximum of 5 photos allowed per task. Please delete some existing photos first.'
            });
        }
        await blobStorage_1.default.ensureContainerExists();
        const uploadResult = await blobStorage_1.default.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'task-photos');
        if (!uploadResult.success) {
            return res.status(500).json({ error: 'Failed to upload photo to storage', details: uploadResult.error });
        }
        const photoUrl = uploadResult.url;
        const { rows: [photo] } = await database_1.default.query(`
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
    }
    catch (error) {
        console.error('Photo upload error:', error);
        return res.status(500).json({ error: 'Failed to upload photo' });
    }
});
router.get('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { rows: photos } = await database_1.default.query(`
      SELECT tp.*, u.name as uploaded_by_name
      FROM task_photos tp
      LEFT JOIN users u ON tp.uploaded_by = u.id
      WHERE tp.task_id = $1
      ORDER BY tp.uploaded_at DESC
    `, [taskId]);
        res.json({ photos });
    }
    catch (error) {
        console.error('Get photos error:', error);
        res.status(500).json({ error: 'Failed to get photos' });
    }
});
router.delete('/:photoId', async (req, res) => {
    try {
        const { photoId } = req.params;
        const { rows: [photo] } = await database_1.default.query('SELECT * FROM task_photos WHERE id = $1', [photoId]);
        if (!photo) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        if (photo.photo_url && photo.photo_url.includes('blob.core.windows.net')) {
            const urlParts = photo.photo_url.split('/');
            const blobName = urlParts.slice(-2).join('/');
            await blobStorage_1.default.deleteFile(blobName);
        }
        await database_1.default.query('DELETE FROM task_photos WHERE id = $1', [photoId]);
        return res.json({ message: 'Photo deleted successfully' });
    }
    catch (error) {
        console.error('Delete photo error:', error);
        return res.status(500).json({ error: 'Failed to delete photo' });
    }
});
exports.default = router;
//# sourceMappingURL=task-photos.js.map