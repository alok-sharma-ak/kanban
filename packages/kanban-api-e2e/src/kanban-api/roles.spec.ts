import { execFileSync } from 'child_process';
import axios from 'axios';

describe('system and board roles', () => {
  const password = 'Industry12345';
  const unique = Date.now();
  const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });
  const accounts = ['owner', 'admin', 'member', 'viewer', 'outsider', 'system-admin'] as const;
  const users = {} as Record<typeof accounts[number], { id: string; email: string; token: string }>;
  let boardId: string;
  let todoId: string;

  beforeAll(async () => {
    for (const account of accounts) {
      const email = `roles-${account}-${unique}@example.com`;
      const response = await axios.post('/api/auth/register', { name: account, email, password });
      users[account] = { id: response.data.user.id, email, token: response.data.accessToken };
    }
    execFileSync('pnpm', ['admin:promote', '--', '--email', users['system-admin'].email], {
      cwd: process.cwd(), stdio: 'pipe', env: process.env,
    });
    const board = await axios.post('/api/boards', { name: 'Collaborative board' }, auth(users.owner.token));
    boardId = board.data.id;
    todoId = board.data.columns[0].id;
  });

  it('uses the database role for global administration without board bypass', async () => {
    await expect(axios.get('/api/admin/users', auth(users.owner.token))).rejects.toMatchObject({ response: { status: 403 } });
    const listed = await axios.get('/api/admin/users?page=1&limit=10&search=roles-', auth(users['system-admin'].token));
    expect(listed.status).toBe(200);
    expect(listed.data.items.every((user: Record<string, unknown>) => !('passwordHash' in user))).toBe(true);
    await expect(axios.patch(`/api/admin/users/${users['system-admin'].id}/role`, { role: 'USER' }, auth(users['system-admin'].token)))
      .rejects.toMatchObject({ response: { status: 400 } });
    await expect(axios.get(`/api/boards/${boardId}`, auth(users['system-admin'].token)))
      .rejects.toMatchObject({ response: { status: 404 } });
  });

  it('adds members, exposes effective roles, and rejects duplicates', async () => {
    for (const [account, role] of [['admin', 'ADMIN'], ['member', 'MEMBER'], ['viewer', 'VIEWER']] as const) {
      const added = await axios.post(`/api/boards/${boardId}/members`, { email: users[account].email, role }, auth(users.owner.token));
      expect(added.data).toMatchObject({ userId: users[account].id, role });
    }
    await expect(axios.post(`/api/boards/${boardId}/members`, { email: users.member.email, role: 'MEMBER' }, auth(users.owner.token)))
      .rejects.toMatchObject({ response: { status: 409 } });
    await expect(axios.post(`/api/boards/${boardId}/members`, { email: users.owner.email, role: 'MEMBER' }, auth(users.owner.token)))
      .rejects.toMatchObject({ response: { status: 409 } });

    const viewerList = await axios.get('/api/boards', auth(users.viewer.token));
    expect(viewerList.data.find(({ id }: { id: string }) => id === boardId)).toMatchObject({ role: 'VIEWER' });
    expect((await axios.get(`/api/boards/${boardId}`, auth(users.member.token))).data.role).toBe('MEMBER');
    expect((await axios.get(`/api/boards/${boardId}/members`, auth(users.viewer.token))).data[0].role).toBe('OWNER');
  });

  it('enforces the complete board mutation boundaries and assignment eligibility', async () => {
    await expect(axios.patch(`/api/boards/${boardId}`, { name: 'No' }, auth(users.member.token)))
      .rejects.toMatchObject({ response: { status: 403 } });
    await expect(axios.post(`/api/boards/${boardId}/columns`, { name: 'No' }, auth(users.member.token)))
      .rejects.toMatchObject({ response: { status: 403 } });
    await expect(axios.post(`/api/columns/${todoId}/tasks`, { title: 'No' }, auth(users.viewer.token)))
      .rejects.toMatchObject({ response: { status: 403 } });
    await expect(axios.post(`/api/columns/${todoId}/tasks`, { title: 'Invalid', assigneeId: users.viewer.id }, auth(users.member.token)))
      .rejects.toMatchObject({ response: { status: 400 } });

    const task = await axios.post(`/api/columns/${todoId}/tasks`, {
      title: 'Assigned task', assigneeId: users.member.id,
    }, auth(users.member.token));
    expect(task.data.assigneeId).toBe(users.member.id);
    expect((await axios.patch(`/api/boards/${boardId}`, { name: 'Admin updated' }, auth(users.admin.token))).status).toBe(200);
    await expect(axios.post(`/api/boards/${boardId}/members`, { email: users.outsider.email, role: 'ADMIN' }, auth(users.admin.token)))
      .rejects.toMatchObject({ response: { status: 403 } });
    await expect(axios.delete(`/api/boards/${boardId}`, auth(users.admin.token)))
      .rejects.toMatchObject({ response: { status: 403 } });

    expect((await axios.delete(`/api/boards/${boardId}/members/${users.member.id}`, auth(users.admin.token))).status).toBe(204);
    expect((await axios.get(`/api/tasks/${task.data.id}`, auth(users.owner.token))).data.assigneeId).toBeNull();
    await expect(axios.get(`/api/boards/${boardId}`, auth(users.member.token)))
      .rejects.toMatchObject({ response: { status: 404 } });
  });

  it('transfers ownership atomically and retains the previous owner as ADMIN', async () => {
    expect((await axios.patch(`/api/boards/${boardId}/owner`, { userId: users.admin.id }, auth(users.owner.token))).status).toBe(204);
    expect((await axios.get(`/api/boards/${boardId}`, auth(users.admin.token))).data.role).toBe('OWNER');
    expect((await axios.get(`/api/boards/${boardId}`, auth(users.owner.token))).data.role).toBe('ADMIN');
    await expect(axios.delete(`/api/boards/${boardId}`, auth(users.owner.token)))
      .rejects.toMatchObject({ response: { status: 403 } });
    expect((await axios.delete(`/api/boards/${boardId}`, auth(users.admin.token))).status).toBe(204);
  });
});
