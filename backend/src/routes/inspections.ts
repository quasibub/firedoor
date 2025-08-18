import express, { Request, Response } from 'express';
import Joi from 'joi';
import pool from '../config/database';

const router = express.Router();

// Validation schemas
const createInspectionSchema = Joi.object({
  location: Joi.string().required(),
  totalDoors: Joi.number().integer().min(1).required(),
  notes: Joi.string().optional(),
});

const updateInspectionSchema = Joi.object({
  status: Joi.string().valid('pending', 'in-progress', 'completed').optional(),
  compliantDoors: Joi.number().integer().min(0).optional(),
  nonCompliantDoors: Joi.number().integer().min(0).optional(),
  criticalIssues: Joi.number().integer().min(0).optional(),
  notes: Joi.string().optional(),
});

// @route   GET /api/inspections
// @desc    Get all inspections
// @access  Private
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, location, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT i.*, h.name as home_name 
      FROM inspections i
      LEFT JOIN homes h ON i.home_id = h.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Apply filters
    if (status) {
      conditions.push('i.status = $' + (params.length + 1));
      params.push(status);
    }

    if (location) {
      conditions.push('i.location ILIKE $' + (params.length + 1));
      params.push(`%${location}%`);
    }

    // Add home filter
    if (req.query.home_id) {
      conditions.push('i.home_id = $' + (params.length + 1));
      params.push(req.query.home_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Get total count for pagination (without ORDER BY)
    const countQuery = query.replace('SELECT i.*, h.name as home_name', 'SELECT COUNT(*)');
    const { rows: countResult } = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult[0].count);

    // Sort by created_at DESC
    query += ' ORDER BY i.created_at DESC';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(Number(limit), offset);

    const { rows: inspections } = await pool.query(query, params);

    return res.json({
      success: true,
      data: inspections,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalItems: totalCount,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    console.error('Get inspections error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @route   GET /api/inspections/:id
// @desc    Get inspection by ID
// @access  Private
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM inspections WHERE id = $1', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inspection not found',
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('Get inspection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @route   POST /api/inspections
// @desc    Create new inspection
// @access  Private
router.post('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = createInspectionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { rows: [newInspection] } = await pool.query(`
      INSERT INTO inspections (location, inspector_name, date, status, total_doors, compliant_doors, non_compliant_doors, critical_issues, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      value.location,
      'John Inspector', // TODO: Get from auth token
      new Date().toISOString().split('T')[0],
      'pending',
      value.totalDoors,
      0,
      0,
      0,
      value.notes || ''
    ]);

    return res.status(201).json({
      success: true,
      data: newInspection,
    });
  } catch (error) {
    console.error('Create inspection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @route   PUT /api/inspections/:id
// @desc    Update inspection
// @access  Private
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { error, value } = updateInspectionSchema.validate(req.body);
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
    if (value.compliantDoors !== undefined) {
      updateFields.push(`compliant_doors = $${paramCount++}`);
      params.push(value.compliantDoors);
    }
    if (value.nonCompliantDoors !== undefined) {
      updateFields.push(`non_compliant_doors = $${paramCount++}`);
      params.push(value.nonCompliantDoors);
    }
    if (value.criticalIssues !== undefined) {
      updateFields.push(`critical_issues = $${paramCount++}`);
      params.push(value.criticalIssues);
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
      UPDATE inspections 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inspection not found',
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('Update inspection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @route   DELETE /api/inspections/:id
// @desc    Delete inspection
// @access  Private
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM inspections WHERE id = $1', [req.params.id]);
    
    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inspection not found',
      });
    }

    return res.json({
      success: true,
      message: 'Inspection deleted successfully',
    });
  } catch (error) {
    console.error('Delete inspection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

export default router; 