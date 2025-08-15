import request from 'supertest';
import express from 'express';
import authRouter from '../src/routes/auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth routes', () => {
  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inspector@example.com', password: 'password' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inspector@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
