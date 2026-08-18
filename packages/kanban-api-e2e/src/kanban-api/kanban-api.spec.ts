import axios from 'axios';

describe('GET /api/health', () => {
  it('reports process liveness without authentication', async () => {
    const response = await axios.get('/api/health/live');
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ status: 'ok', checks: { api: 'up' } });
  });

  it('reports all infrastructure dependencies as healthy', async () => {
    const res = await axios.get(`/api/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      status: 'ok',
      checks: { api: 'up', redis: 'up', postgres: 'up', minio: 'up', outbox: 'up' },
    });
  });

  it('exposes the same dependency checks from the readiness endpoint', async () => {
    const response = await axios.get('/api/health/ready');
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      status: 'ok',
      checks: { api: 'up', postgres: 'up', redis: 'up', minio: 'up', outbox: 'up' },
    });
  });
});
