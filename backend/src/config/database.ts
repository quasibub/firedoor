import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const buildPool = () => {
	const databaseUrl = process.env.DATABASE_URL;
	const shouldUseSsl = true; // Ensure SSL on Azure
	const sslConfig = shouldUseSsl ? { rejectUnauthorized: false } : false;

	if (databaseUrl) {
		// Prefer DATABASE_URL (include sslmode=require in the URL as well)
		return new Pool({
			connectionString: databaseUrl,
			ssl: sslConfig,
		});
	}

	// Fallback to discrete config (local/dev)
	return new Pool({
		host: process.env.DB_HOST || 'localhost',
		port: parseInt(process.env.DB_PORT || '5432'),
		database: process.env.DB_NAME || 'fire_door_inspection',
		user: process.env.DB_USER || 'postgres',
		password: process.env.DB_PASSWORD || 'password',
		ssl: process.env.NODE_ENV === 'production' ? sslConfig : false,
	});
};

const pool = buildPool();

// Test database connection
pool.on('connect', () => {
	console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
	console.error('❌ Database connection error:', err);
});

export default pool; 