import axios from 'axios';

describe('boards CRUD', () => {
  const password = 'Industry12345';
  const unique = Date.now();
  let token: string;
  let otherToken: string;
  let boardId: string;

  beforeAll(async () => {
    const owner = await axios.post('/api/auth/register', { name: 'Board Owner', email: `board-owner-${unique}@example.com`, password });
    const other = await axios.post('/api/auth/register', { name: 'Other Owner', email: `board-other-${unique}@example.com`, password });
    token = owner.data.accessToken;
    otherToken = other.data.accessToken;
  });

  it('creates, lists, reads, and updates a nested owned board', async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const created = await axios.post('/api/boards', { name: '  Initial Board  ', description: '  Initial description  ' }, { headers });
    expect(created.status).toBe(201);
    expect(created.data).toMatchObject({ name: 'Initial Board', description: 'Initial description' });
    expect(created.data.columns.map(({ name }: { name: string }) => name)).toEqual(['Todo', 'In Progress', 'Done']);
    boardId = created.data.id;

    const listed = await axios.get('/api/boards', { headers });
    expect(listed.data.find(({ id }: { id: string }) => id === boardId)).toMatchObject({ name: 'Initial Board' });

    const updated = await axios.patch(`/api/boards/${boardId}`, { name: 'Updated Board', description: '' }, { headers });
    expect(updated.data).toMatchObject({ name: 'Updated Board', description: null });
    const detail = await axios.get(`/api/boards/${boardId}`, { headers });
    expect(detail.data).toMatchObject({ name: 'Updated Board', description: null });
  });

  it('hides the board from another user and deletes it for its owner', async () => {
    await expect(axios.get(`/api/boards/${boardId}`, { headers: { Authorization: `Bearer ${otherToken}` } })).rejects.toMatchObject({ response: { status: 404 } });
    const removed = await axios.delete(`/api/boards/${boardId}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(removed.status).toBe(204);
    await expect(axios.get(`/api/boards/${boardId}`, { headers: { Authorization: `Bearer ${token}` } })).rejects.toMatchObject({ response: { status: 404 } });
  });
});
