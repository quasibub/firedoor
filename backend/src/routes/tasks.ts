import express from 'express';
import Joi from 'joi';
import pool from '../config/database';
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

// Validation schemas
const createTaskSchema = Joi.object({
  inspection_id: Joi.string().required(),
  door_id: Joi.string().required(),
  location: Joi.string().required(),
  description: Joi.string().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  assigned_to: Joi.string().required(),
  notes: Joi.string().optional(),
});

const updateTaskSchema = Joi.object({
  status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled').optional(),
  assigned_to: Joi.string().optional(),
  completed_at: Joi.date().iso().optional(),
  notes: Joi.string().optional(),
});

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
    const { status, priority, inspectionId, home_id, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT t.*, h.name as home_name 
      FROM tasks t
      LEFT JOIN homes h ON t.home_id = h.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Apply filters
    if (status) {
      conditions.push('t.status = $' + (params.length + 1));
      params.push(status);
    }

    if (priority) {
      conditions.push('t.priority = $' + (params.length + 1));
      params.push(priority);
    }

    if (inspectionId) {
      conditions.push('t.inspection_id = $' + (params.length + 1));
      params.push(inspectionId);
    }

    // Add home filter
    if (home_id) {
      conditions.push('t.home_id = $' + (params.length + 1));
      params.push(home_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Get total count for pagination (without ORDER BY)
    const countQuery = query.replace('SELECT t.*, h.name as home_name', 'SELECT COUNT(*)');
    const { rows: countResult } = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult[0].count);

    // Sort by priority and creation date
    query += ' ORDER BY CASE t.priority WHEN \'critical\' THEN 0 WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 WHEN \'low\' THEN 3 END, t.created_at DESC';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(Number(limit), offset);

    const { rows: tasks } = await pool.query(query, params);

    return res.json({
      success: true,
      data: tasks,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalItems: totalCount,
        itemsPerPage: Number(limit),
      },
    });
}));

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
}));

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', asyncHandler(async (req, res) => {
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { rows: [newTask] } = await pool.query(`
      INSERT INTO tasks (inspection_id, door_id, location, title, description, status, priority, category, assigned_to, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      value.inspection_id,
      value.door_id,
      value.location,
      value.description,
      value.description,
      'pending',
      value.priority,
      'General',
      value.assigned_to,
      value.notes || ''
    ]);

    return res.status(201).json({
      success: true,
      data: newTask,
    });
}));

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', asyncHandler(async (req, res) => {
    const { error, value } = updateTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (value.status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      params.push(value.status);
    }
    if (value.assigned_to !== undefined) {
      updateFields.push(`assigned_to = $${paramCount++}`);
      params.push(value.assigned_to);
    }
    if (value.completed_at !== undefined) {
      updateFields.push(`completed_at = $${paramCount++}`);
      params.push(value.completed_at);
    }
    if (value.notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      params.push(value.notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    params.push(req.params.id);
    const { rows } = await pool.query(`
      UPDATE tasks
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
}));

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    return res.json({
      success: true,
      message: 'Task deleted successfully',
    });
}));

export default router; 