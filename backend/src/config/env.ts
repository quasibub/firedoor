import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(5000),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  DATABASE_URL: Joi.string().uri().required(),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().default('fire_door_inspection'),
  DB_USER: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  DEBUG_PDF: Joi.boolean().optional(),
}).unknown();

const { value: envVars, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default envVars as {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  DEBUG_PDF?: boolean;
};
