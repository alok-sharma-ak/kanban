import axios from 'axios';

describe('users profile', () => {
  const password = 'Industry12345';
  const email = `users-${Date.now()}@example.com`;
  let accessToken: string;

  beforeAll(async () => {
    const response = await axios.post('/api/auth/register', { name: 'Profile User', email, password });
    accessToken = response.data.accessToken;
  });

  it('returns and updates only the authenticated sanitized profile', async () => {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const current = await axios.get('/api/users/me', { headers });
    expect(current.status).toBe(200);
    expect(current.data).toMatchObject({ name: 'Profile User', email });
    expect(current.data).not.toHaveProperty('passwordHash');

    const updated = await axios.patch('/api/users/me', { name: '  Updated User  ', email: email.toUpperCase() }, { headers });
    expect(updated.status).toBe(200);
    expect(updated.data).toMatchObject({ name: 'Updated User', email });
    expect(updated.data).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid profile data and duplicate email addresses', async () => {
    const headers = { Authorization: `Bearer ${accessToken}` };
    await expect(axios.patch('/api/users/me', { name: '   ' }, { headers })).rejects.toMatchObject({ response: { status: 400 } });

    const otherEmail = `users-other-${Date.now()}@example.com`;
    await axios.post('/api/auth/register', { name: 'Other User', email: otherEmail, password });
    await expect(axios.patch('/api/users/me', { email: otherEmail }, { headers })).rejects.toMatchObject({ response: { status: 409 } });
  });
});
