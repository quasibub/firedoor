"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const auth_1 = __importDefault(require("./routes/auth"));
const inspections_1 = __importDefault(require("./routes/inspections"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const reports_1 = __importDefault(require("./routes/reports"));
const pdf_upload_1 = __importDefault(require("./routes/pdf-upload"));
const task_photos_1 = __importDefault(require("./routes/task-photos"));
const task_rejections_1 = __importDefault(require("./routes/task-rejections"));
const users_1 = __importDefault(require("./routes/users"));
const remediation_reports_1 = __importDefault(require("./routes/remediation-reports"));
const homes_1 = __importDefault(require("./routes/homes"));
const init_db_1 = __importDefault(require("./config/init-db"));
console.error('🚨 DEBUG: SERVER STARTING WITH NEW CODE - COMMIT 5f7c77bca3 🚨');
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : []), process.env.FRONTEND_URL || ""].filter(Boolean),
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : []),
        process.env.FRONTEND_URL,
        'https://fire-door-frontend.azurestaticapps.net'
    ].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            console.warn(`🚫 CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const forwardedFor = req.headers['x-forwarded-for'];
        const ip = req.ip;
        const remoteAddr = req.connection.remoteAddress;
        if (typeof forwardedFor === 'string')
            return forwardedFor;
        if (typeof ip === 'string')
            return ip;
        if (typeof remoteAddr === 'string')
            return remoteAddr;
        return 'unknown';
    },
    skip: (req) => req.path === '/health'
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, compression_1.default)());
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined'));
}
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
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
app.use('/api/auth', auth_1.default);
app.use('/api/inspections', inspections_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/pdf-upload', pdf_upload_1.default);
app.use('/api/task-photos', task_photos_1.default);
app.use('/api/task-rejections', task_rejections_1.default);
app.use('/api/users', users_1.default);
app.use('/api/remediation-reports', remediation_reports_1.default);
app.use('/api/homes', homes_1.default);
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`�� Health check: http://localhost:${PORT}/health`);
    console.log(`�� API Base URL: http://localhost:${PORT}/api`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️ Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    try {
        console.log('🔄 Initializing database...');
        await (0, init_db_1.default)();
        console.log('✅ Database initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize database:', error);
        console.log('⚠️ Continuing without database initialization...');
    }
});
process.on('uncaughtException', (error) => {
    console.error('�� Uncaught Exception:', error);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
exports.default = app;
//# sourceMappingURL=index.js.map