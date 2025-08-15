import express from 'express';
import Joi from 'joi';
import pool from '../config/database';

const router = express.Router();

// Validation schema
const rejectTaskSchema = Joi.object({
  rejection_reason: Joi.string().required().min(10).max(1000),
  alternative_suggestion: Joi.string().optional().allow('').max(1000)
});

// Reject a task
router.post('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log('Reject task request:', { taskId, body: req.body });
    
    const { error, value } = rejectTaskSchema.validate(req.body);
    
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Get user ID from auth middleware, or get the first available user
    let rejectedBy = (req as any).user?.id;
    
    if (!rejectedBy) {
      // If no authenticated user, get the first available user from the database
      const { rows: users } = await pool.query('SELECT id FROM users LIMIT 1');
      if (users.length > 0) {
        rejectedBy = users[0].id;
      } else {
        return res.status(400).json({ error: 'No users available in the system' });
      }
    }
    
    // Verify task exists and is not already completed/rejected
    const { rows: [task] } = await pool.query(`
      SELECT id, status FROM tasks WHERE id = $1
    `, [taskId]);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (task.status === 'completed') {
      return res.status(400).json({ error: 'Cannot reject a completed task' });
    }
    
    if (task.status === 'rejected') {
      return res.status(400).json({ error: 'Task is already rejected' });
    }
    
    // Start transaction
    await pool.query('BEGIN');
    
    try {
      // Create rejection record
      const { rows: [rejection] } = await pool.query(`
        INSERT INTO task_rejections (task_id, rejected_by, rejection_reason, alternative_suggestion)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [taskId, rejectedBy, value.rejection_reason, value.alternative_suggestion]);
      
      // Update task status to rejected
      await pool.query(`
        UPDATE tasks SET status = 'rejected' WHERE id = $1
      `, [taskId]);
      
      await pool.query('COMMIT');
      
      return res.status(201).json({
        message: 'Task rejected successfully',
        rejection
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Reject task error:', error);
    return res.status(500).json({ error: 'Failed to reject task' });
  }
});

// Get rejection for a task
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const { rows: [rejection] } = await pool.query(`
      SELECT tr.*, u.name as rejected_by_name
      FROM task_rejections tr
      LEFT JOIN users u ON tr.rejected_by = u.id
      WHERE tr.task_id = $1
      ORDER BY tr.rejected_at DESC
      LIMIT 1
    `, [taskId]);
    
    if (!rejection) {
      return res.status(404).json({ error: 'No rejection found for this task' });
    }
    
    return res.json({ rejection });
  } catch (error) {
    console.error('Get rejection error:', error);
    return res.status(500).json({ error: 'Failed to get rejection' });
  }
});

// Resolve a rejection (admin only)
router.put('/:taskId/resolve', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { new_status = 'pending' } = req.body;
    
    // Verify user is admin
    if ((req as any).user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can resolve rejections' });
    }
    
    // Verify task exists and is rejected
    const { rows: [task] } = await pool.query(`
      SELECT id, status FROM tasks WHERE id = $1
    `, [taskId]);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (task.status !== 'rejected') {
      return res.status(400).json({ error: 'Task is not rejected' });
    }
    
    // Update task status
    await pool.query(`
      UPDATE tasks SET status = $1 WHERE id = $2
    `, [new_status, taskId]);
    
    return res.json({
      message: 'Rejection resolved successfully',
      task_id: taskId,
      new_status
    });
  } catch (error) {
    console.error('Resolve rejection error:', error);
    return res.status(500).json({ error: 'Failed to resolve rejection' });
  }
});

export default router; 