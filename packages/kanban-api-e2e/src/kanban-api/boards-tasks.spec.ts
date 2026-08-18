import axios from 'axios';

describe('board, task, ordering, ownership, and attachments', () => {
  const password = 'Industry12345';
  const unique = Date.now();
  let token: string;
  let otherToken: string;
  let boardId: string;
  let todoId: string;
  let progressId: string;
  let doneId: string;
  let taskId: string;

  beforeAll(async () => {
    const owner = await axios.post('/api/auth/register', { name: 'Owner', email: `owner-${unique}@example.com`, password });
    const other = await axios.post('/api/auth/register', { name: 'Other', email: `other-${unique}@example.com`, password });
    token = owner.data.accessToken; otherToken = other.data.accessToken;
  });

  it('creates a board with ordered default columns', async () => {
    const result = await axios.post('/api/boards', { name: 'Production Board', description: 'E2E' }, { headers: { Authorization: `Bearer ${token}` } });
    expect(result.status).toBe(201); expect(result.data.columns.map((c: { name: string }) => c.name)).toEqual(['Todo', 'In Progress', 'Done']);
    boardId = result.data.id; todoId = result.data.columns[0].id; progressId = result.data.columns[1].id; doneId = result.data.columns[2].id;
  });

  it('serializes concurrent task creation without duplicate positions', async () => {
    const created = await Promise.all(Array.from({ length: 6 }, (_, index) => axios.post(`/api/columns/${doneId}/tasks`, { title: `Concurrent ${index}` }, { headers: { Authorization: `Bearer ${token}` } })));
    expect(created.map((response) => response.data.position).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
    await expect(axios.delete(`/api/columns/${doneId}`, { headers: { Authorization: `Bearer ${token}` } })).rejects.toMatchObject({ response: { status: 409 } });
  });

  it('hides another user’s board', async () => {
    await expect(axios.get(`/api/boards/${boardId}`, { headers: { Authorization: `Bearer ${otherToken}` } })).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('creates, reorders, and moves tasks transactionally', async () => {
    const first = await axios.post(`/api/columns/${todoId}/tasks`, { title: 'First' }, { headers: { Authorization: `Bearer ${token}` } });
    const second = await axios.post(`/api/columns/${todoId}/tasks`, { title: 'Second' }, { headers: { Authorization: `Bearer ${token}` } });
    taskId = first.data.id;
    const reordered = await axios.patch('/api/tasks/reorder', { columnId: todoId, taskIds: [second.data.id, first.data.id] }, { headers: { Authorization: `Bearer ${token}` } });
    expect(reordered.data.map((t: { id: string; position: number }) => [t.id, t.position])).toEqual([[second.data.id, 1], [first.data.id, 2]]);
    const moved = await axios.patch(`/api/tasks/${taskId}/move`, { columnId: progressId, position: 1 }, { headers: { Authorization: `Bearer ${token}` } });
    expect(moved.data).toMatchObject({ id: taskId, columnId: progressId, position: 1 });
  });

  it('uploads and deletes a private attachment through the outbox', async () => {
    const form = new FormData(); form.append('file', new Blob(['hello'], { type: 'text/plain' }), 'hello.txt');
    const uploaded = await axios.post(`/api/tasks/${taskId}/attachments`, form, { headers: { Authorization: `Bearer ${token}` } });
    expect(uploaded.data).toMatchObject({ originalName: 'hello.txt', mimeType: 'text/plain', size: 5 });
    await expect(axios.get(`/api/attachments/${uploaded.data.id}`, { headers: { Authorization: `Bearer ${otherToken}` } })).rejects.toMatchObject({ response: { status: 404 } });
    expect((await axios.delete(`/api/attachments/${uploaded.data.id}`, { headers: { Authorization: `Bearer ${token}` } })).status).toBe(204);
    const rejected = new FormData(); rejected.append('file', new Blob(['bad'], { type: 'application/javascript' }), 'bad.js');
    await expect(axios.post(`/api/tasks/${taskId}/attachments`, rejected, { headers: { Authorization: `Bearer ${token}` } })).rejects.toMatchObject({ response: { status: 415 } });
  });
});
