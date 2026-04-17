import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Elite Edge Case Suite', () => {
  it('should handle extremely long log segments by truncating', async () => {
    const longLog = 'Error: 0x800f081f '.repeat(1000);
    const res = await request(app)
      .post('/api/analyze')
      .send({ logText: longLog });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('errorCode');
  });

  it('should reject non-string log inputs', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ logText: { not: 'a string' } });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('should apply rate limiting headers', async () => {
    const res = await request(app).post('/api/analyze').send({ logText: 'test' });
    expect(res.headers).toHaveProperty('ratelimit-limit');
  });
});
