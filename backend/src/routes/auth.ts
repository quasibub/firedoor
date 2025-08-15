import express from 'express';
import Joi from 'joi';
import { authenticateUser, getUserFromToken } from '../services/authService';

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
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

    const result = await authenticateUser(email, password);
    if (!result) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    return res.json({
      success: true,
      token: result.token,
      user: result.user,
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
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token, authorization denied',
      });
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid',
      });
    }

    return res.json({
      success: true,
      user,
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