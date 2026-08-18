import axios from 'axios';

describe('authentication sessions', () => {
  const email = `auth-${Date.now()}@example.com`;
  const password = 'Industry12345';
  it('registers, rotates refresh tokens, detects replay, and protects routes', async () => {
    const registered = await axios.post('/api/auth/register', { name: 'Auth Test', email, password });
    expect(registered.status).toBe(201);
    expect(registered.data.accessToken).toEqual(expect.any(String));
    expect(registered.data.refreshToken).toEqual(expect.any(String));
    const oldRefresh = registered.data.refreshToken;
    const refreshed = await axios.post('/api/auth/refresh', { refreshToken: oldRefresh });
    expect(refreshed.status).toBe(200);
    expect(refreshed.data.refreshToken).not.toBe(oldRefresh);
    await expect(axios.post('/api/auth/refresh', { refreshToken: oldRefresh })).rejects.toMatchObject({ response: { status: 401 } });
    await expect(axios.post('/api/auth/refresh', { refreshToken: refreshed.data.refreshToken })).rejects.toMatchObject({ response: { status: 401 } });
    await expect(axios.get('/api/boards')).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('supports single-session and all-session logout', async () => {
    const first = await axios.post('/api/auth/login', { email, password });
    expect((await axios.post('/api/auth/logout', { refreshToken: first.data.refreshToken })).status).toBe(204);
    await expect(axios.post('/api/auth/refresh', { refreshToken: first.data.refreshToken })).rejects.toMatchObject({ response: { status: 401 } });
    const second = await axios.post('/api/auth/login', { email, password });
    expect((await axios.post('/api/auth/logout-all', {}, { headers: { Authorization: `Bearer ${second.data.accessToken}` } })).status).toBe(204);
    await expect(axios.post('/api/auth/refresh', { refreshToken: second.data.refreshToken })).rejects.toMatchObject({ response: { status: 401 } });
  });
});
