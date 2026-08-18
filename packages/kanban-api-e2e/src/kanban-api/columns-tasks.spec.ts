import axios from 'axios';

describe('columns and tasks CRUD and ordering', () => {
  const password = 'Industry12345';
  const unique = Date.now();
  let token: string;
  let boardId: string;
  let otherBoardColumnId: string;
  let todoId: string;
  let progressId: string;
  let taskId: string;

  beforeAll(async () => {
    const owner = await axios.post('/api/auth/register', { name: 'Ordering Owner', email: `ordering-${unique}@example.com`, password });
    token = owner.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    const board = await axios.post('/api/boards', { name: 'Ordering Board' }, { headers });
    boardId = board.data.id; todoId = board.data.columns[0].id; progressId = board.data.columns[1].id;
    const otherBoard = await axios.post('/api/boards', { name: 'Other Board' }, { headers });
    otherBoardColumnId = otherBoard.data.columns[0].id;
  });

  it('creates, renames, completely reorders, and deletes an empty column', async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const created = await axios.post(`/api/boards/${boardId}/columns`, { name: '  Review  ' }, { headers });
    expect(created.status).toBe(201);
    expect(created.data).toMatchObject({ name: 'Review', position: 4, boardId });
    const updated = await axios.patch(`/api/columns/${created.data.id}`, { name: 'QA' }, { headers });
    expect(updated.data.name).toBe('QA');

    const detail = await axios.get(`/api/boards/${boardId}`, { headers });
    const ids = detail.data.columns.map(({ id }: { id: string }) => id).reverse();
    const reordered = await axios.patch('/api/columns/reorder', { boardId, columnIds: ids }, { headers });
    expect(reordered.data.map(({ id, position }: { id: string; position: number }) => [id, position]))
      .toEqual(ids.map((id: string, index: number) => [id, index + 1]));

    expect((await axios.delete(`/api/columns/${created.data.id}`, { headers })).status).toBe(204);
    const compacted = await axios.get(`/api/boards/${boardId}`, { headers });
    expect(compacted.data.columns.map(({ position }: { position: number }) => position)).toEqual([1, 2, 3]);
  });

  it('creates, reads, updates, clamps moves, and deletes tasks', async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const first = await axios.post(`/api/columns/${todoId}/tasks`, { title: '  First task  ', description: '  Initial  ' }, { headers });
    const second = await axios.post(`/api/columns/${todoId}/tasks`, { title: 'Second task' }, { headers });
    taskId = first.data.id;
    expect((await axios.get(`/api/tasks/${taskId}`, { headers })).data).toMatchObject({ title: 'First task', description: 'Initial' });
    expect((await axios.patch(`/api/tasks/${taskId}`, { title: 'Updated task', description: '' }, { headers })).data)
      .toMatchObject({ title: 'Updated task', description: null });

    const moved = await axios.patch(`/api/tasks/${taskId}/move`, { columnId: progressId, position: 999 }, { headers });
    expect(moved.data).toMatchObject({ columnId: progressId, position: 1 });
    await expect(axios.patch(`/api/tasks/${taskId}/move`, { columnId: otherBoardColumnId, position: 1 }, { headers }))
      .rejects.toMatchObject({ response: { status: 400 } });

    expect((await axios.delete(`/api/tasks/${taskId}`, { headers })).status).toBe(204);
    await expect(axios.get(`/api/tasks/${taskId}`, { headers })).rejects.toMatchObject({ response: { status: 404 } });
    expect((await axios.get(`/api/tasks/${second.data.id}`, { headers })).data).toMatchObject({ position: 1, columnId: todoId });
  });
});
