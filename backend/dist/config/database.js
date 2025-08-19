"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const buildPool = () => {
    const databaseUrl = process.env.DATABASE_URL;
    const shouldUseSsl = true;
    const sslConfig = shouldUseSsl ? { rejectUnauthorized: false } : false;
    if (databaseUrl) {
        return new pg_1.Pool({
            connectionString: databaseUrl,
            ssl: sslConfig,
        });
    }
    return new pg_1.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'fire_door_inspection',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        ssl: process.env.NODE_ENV === 'production' ? sslConfig : false,
    });
};
const pool = buildPool();
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});
pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
});
exports.default = pool;
//# sourceMappingURL=database.js.map