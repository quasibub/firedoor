import request from 'supertest';
import express from 'express';

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

import pool from '../src/config/database';
import tasksRouter from '../src/routes/tasks';

const app = express();
app.use(express.json());
app.use('/api/tasks', tasksRouter);

describe('Tasks routes', () => {
  afterEach(() => {
    (pool.query as jest.Mock).mockReset();
  });

  it('returns a task by id', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: '1', description: 'Test' }] });
    const res = await request(app).get('/api/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ id: '1', description: 'Test' });
  });

  it('returns 404 when task not found', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/tasks/2');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
