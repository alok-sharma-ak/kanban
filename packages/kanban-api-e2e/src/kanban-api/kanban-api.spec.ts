import axios from 'axios';

describe('GET /api/health', () => {
  it('reports all infrastructure dependencies as healthy', async () => {
    const res = await axios.get(`/api/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      status: 'ok',
      checks: { api: 'up', redis: 'up', postgres: 'up', minio: 'up' },
    });
  });
});
