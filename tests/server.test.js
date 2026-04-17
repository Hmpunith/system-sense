import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Backend API Integration', () => {
  it('GET / should serve index.html or 404 in test env', async () => {
    // Basic test to see if express is responding
    const res = await request(app).get('/');
    // Depending on if dist exists in test env, it might be 200 or 404
    expect([200, 404]).toContain(res.status);
  });

  it('POST /api/analyze without body should return 400', async () => {
    const res = await request(app).post('/api/analyze').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });
});
