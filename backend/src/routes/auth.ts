import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import pool from '../config/database';

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req: Request, res: Response) => {
  console.error('DEBUG: Login route hit - testing deployment');
  
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { email, password } = value;

    // Find user in database
    console.error('DEBUG: Looking for user with email: ' + email);
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
      [email]
    );
    
    console.error('DEBUG: Query returned ' + rows.length + ' rows');
    if (rows.length > 0) {
      console.error('DEBUG: User found - email: ' + rows[0].email + ', role: ' + rows[0].role);
    }
    
    if (rows.length === 0) {
      console.error('DEBUG: No user found with email: ' + email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const user = rows[0];

    // Check password
    console.error('DEBUG: Comparing password for user: ' + user.email);
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.error('DEBUG: Password match result: ' + isMatch);
    
    if (!isMatch) {
      console.error('DEBUG: Password mismatch for user: ' + user.email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token, authorization denied',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // Get user from database
    const { rows } = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid',
      });
    }

    const user = rows[0];

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      error: 'Token is not valid',
    });
  }
});

export default router; 