import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import authRoutes from './routes/auth';
import inspectionRoutes from './routes/inspections';
import taskRoutes from './routes/tasks';
import reportRoutes from './routes/reports';
import pdfUploadRoutes from './routes/pdf-upload';
import taskPhotoRoutes from './routes/task-photos';
import taskRejectionRoutes from './routes/task-rejections';
import userRoutes from './routes/users';
import remediationReportRoutes from './routes/remediation-reports';
import homeRoutes from './routes/homes';
import initializeDatabase from './config/init-db';

// DEBUG: Test if Azure is running new code - CODEX FIX TEST
console.log('🎯🎯🎯 CODEX DEPLOYMENT FIX - TESTING! 🎯🎯🎯');
console.log('🎯🎯🎯 CODEX DEPLOYMENT FIX - TESTING! 🎯🎯🎯');
console.log('🎯🎯🎯 CODEX DEPLOYMENT FIX - TESTING! 🎯🎯🎯');
console.log('Timestamp:', new Date().toISOString());
console.log('Commit:', '2fddf7b');
console.log('Deployment Method: Codex Fix');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Azure's reverse proxy
app.set('trust proxy', 1);

// Security middleware - Production optimized
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : []), process.env.FRONTEND_URL || ""].filter(Boolean) as string[],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : []
    }
  },
  crossOriginEmbedderPolicy: false, // Relaxed for Azure compatibility
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow Azure resources
}));

// CORS configuration - Production ready with domain locking
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      // Parse comma-separated FRONTEND_URLS or fall back to single FRONTEND_URL
      ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : []),
      process.env.FRONTEND_URL, // Fallback for backward compatibility
      'https://fire-door-frontend.azurestaticapps.net' // Default Azure domain
    ].filter(Boolean) // Remove undefined values
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// Rate limiting - Azure reverse proxy compatible
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Trust Azure's reverse proxy headers
  // Note: trustProxy is set on the app level above
  // Use X-Forwarded-For header for IP detection
  keyGenerator: (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = req.ip;
    const remoteAddr = req.connection.remoteAddress;
    
    if (typeof forwardedFor === 'string') return forwardedFor;
    if (typeof ip === 'string') return ip;
    if (typeof remoteAddr === 'string') return remoteAddr;
    
    return 'unknown';
  },
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root route for Azure health checks
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Fire Door Inspection API is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/pdf-upload', pdfUploadRoutes);
app.use('/api/task-photos', taskPhotoRoutes);
app.use('/api/task-rejections', taskRejectionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/remediation-reports', remediationReportRoutes);
app.use('/api/homes', homeRoutes);

// Note: Files are now served from Azure Blob Storage, not local filesystem

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`�� Health check: http://localhost:${PORT}/health`);
  console.log(`�� API Base URL: http://localhost:${PORT}/api`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️ Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);

  // Initialize database with better error handling
  try {
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    // Don't crash the app, just log the error
    console.log('⚠️ Continuing without database initialization...');
  }
});

// Add process error handlers
process.on('uncaughtException', (error) => {
  console.error('�� Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;