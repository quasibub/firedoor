import express from 'express';
import pool from '../config/database';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createHomeSchema = Joi.object({
  name: Joi.string().required().min(2).max(255),
  address: Joi.string().optional(),
  contact_person: Joi.string().optional(),
  contact_email: Joi.string().email().optional(),
  contact_phone: Joi.string().optional(),
});

const updateHomeSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  address: Joi.string().optional(),
  contact_person: Joi.string().optional(),
  contact_email: Joi.string().email().optional(),
  contact_phone: Joi.string().optional(),
});

// GET /api/homes - Get all homes
router.get('/', async (req, res) => {
  try {
    const { rows: homes } = await pool.query(`
      SELECT * FROM homes 
      ORDER BY name ASC
    `);
    
    return res.json({ success: true, data: homes });
  } catch (error) {
    console.error('Get homes error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get homes' });
  }
});

// GET /api/homes/:id - Get home by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows: [home] } = await pool.query(
      'SELECT * FROM homes WHERE id = $1',
      [id]
    );
    
    if (!home) {
      return res.status(404).json({ success: false, error: 'Home not found' });
    }
    
    return res.json({ success: true, data: home });
  } catch (error) {
    console.error('Get home error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get home' });
  }
});

// POST /api/homes - Create new home
router.post('/', async (req, res) => {
  try {
    const { error, value } = createHomeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    
    const { rows: [home] } = await pool.query(`
      INSERT INTO homes (name, address, contact_person, contact_email, contact_phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      value.name,
      value.address || null,
      value.contact_person || null,
      value.contact_email || null,
      value.contact_phone || null
    ]);
    
    return res.status(201).json({ success: true, data: home });
  } catch (error) {
    console.error('Create home error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ success: false, error: 'Home name already exists' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create home' });
  }
});

// PUT /api/homes/:id - Update home
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateHomeSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    
    // Check if home exists
    const { rows: [existingHome] } = await pool.query(
      'SELECT * FROM homes WHERE id = $1',
      [id]
    );
    
    if (!existingHome) {
      return res.status(404).json({ success: false, error: 'Home not found' });
    }
    
    const { rows: [home] } = await pool.query(`
      UPDATE homes 
      SET name = COALESCE($1, name),
          address = COALESCE($2, address),
          contact_person = COALESCE($3, contact_person),
          contact_email = COALESCE($4, contact_email),
          contact_phone = COALESCE($5, contact_phone),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [
      value.name || null,
      value.address || null,
      value.contact_person || null,
      value.contact_email || null,
      value.contact_phone || null,
      id
    ]);
    
    return res.json({ success: true, data: home });
  } catch (error) {
    console.error('Update home error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ success: false, error: 'Failed to update home' });
    }
    return res.status(500).json({ success: false, error: 'Failed to update home' });
  }
});

// DELETE /api/homes/:id - Delete home
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if home exists
    const { rows: [home] } = await pool.query(
      'SELECT * FROM homes WHERE id = $1',
      [id]
    );
    
    if (!home) {
      return res.status(404).json({ success: false, error: 'Home not found' });
    }
    
    // Check if home has associated data
    const { rows: [inspectionCount] } = await pool.query(
      'SELECT COUNT(*) as count FROM inspections WHERE home_id = $1',
      [id]
    );
    
    const { rows: [taskCount] } = await pool.query(
      'SELECT COUNT(*) as count FROM tasks WHERE home_id = $1',
      [id]
    );
    
    const { rows: [userCount] } = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE home_id = $1',
      [id]
    );
    
    if (parseInt(inspectionCount.count) > 0 || parseInt(taskCount.count) > 0 || parseInt(userCount.count) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete home with associated data. Please remove all inspections, tasks, and users first.' 
      });
    }
    
    await pool.query('DELETE FROM homes WHERE id = $1', [id]);
    
    return res.json({ success: true, message: 'Home deleted successfully' });
  } catch (error) {
    console.error('Delete home error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete home' });
  }
});

export default router; 