import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface DBUser {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return secret;
}

export async function findUserByEmail(email: string): Promise<DBUser | null> {
  const { rows } = await pool.query<DBUser>(
    'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(id: string): Promise<DBUser | null> {
  const { rows } = await pool.query<DBUser>(
    'SELECT id, email, name, role, password_hash FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return null;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '24h' }
  );

  const { password_hash, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

export async function getUserFromToken(token: string) {
  const decoded = jwt.verify(token, getJwtSecret()) as any;
  const user = await findUserById(decoded.userId);
  if (!user) {
    return null;
  }
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
