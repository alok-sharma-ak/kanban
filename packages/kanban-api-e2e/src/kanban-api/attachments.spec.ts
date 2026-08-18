import axios from 'axios';

describe('private attachments', () => {
  const password = 'Industry12345';
  const unique = Date.now();
  let token: string;
  let otherToken: string;
  let taskId: string;
  let attachmentId: string;

  beforeAll(async () => {
    const owner = await axios.post('/api/auth/register', { name: 'Attachment Owner', email: `attachment-owner-${unique}@example.com`, password });
    const other = await axios.post('/api/auth/register', { name: 'Attachment Other', email: `attachment-other-${unique}@example.com`, password });
    token = owner.data.accessToken; otherToken = other.data.accessToken;
    const board = await axios.post('/api/boards', { name: 'Attachment Board' }, { headers: { Authorization: `Bearer ${token}` } });
    const task = await axios.post(`/api/columns/${board.data.columns[0].id}/tasks`, { title: 'Attachment Task' }, { headers: { Authorization: `Bearer ${token}` } });
    taskId = task.data.id;
  });

  it('uploads, lists, reads, and downloads an authenticated private file', async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const form = new FormData();
    form.append('file', new Blob(['private text'], { type: 'text/plain' }), 'résumé.txt');
    const uploaded = await axios.post(`/api/tasks/${taskId}/attachments`, form, { headers });
    expect(uploaded.status).toBe(201);
    expect(uploaded.data).toMatchObject({ originalName: 'résumé.txt', mimeType: 'text/plain', size: 12, taskId });
    expect(uploaded.data).not.toHaveProperty('storageKey');
    attachmentId = uploaded.data.id;

    expect((await axios.get(`/api/tasks/${taskId}/attachments`, { headers })).data).toEqual([uploaded.data]);
    expect((await axios.get(`/api/attachments/${attachmentId}`, { headers })).data).toEqual(uploaded.data);
    const download = await axios.get(`/api/attachments/${attachmentId}/download`, { headers, responseType: 'text' });
    expect(download.data).toBe('private text');
    expect(download.headers['content-disposition']).toContain("filename*=UTF-8''r%C3%A9sum%C3%A9.txt");
  });

  it('hides all attachment operations from another user', async () => {
    const headers = { Authorization: `Bearer ${otherToken}` };
    await expect(axios.get(`/api/attachments/${attachmentId}`, { headers })).rejects.toMatchObject({ response: { status: 404 } });
    await expect(axios.get(`/api/attachments/${attachmentId}/download`, { headers })).rejects.toMatchObject({ response: { status: 404 } });
    await expect(axios.delete(`/api/attachments/${attachmentId}`, { headers })).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('rejects missing, unsupported, and oversized uploads with documented statuses', async () => {
    const headers = { Authorization: `Bearer ${token}` };
    await expect(axios.post(`/api/tasks/${taskId}/attachments`, new FormData(), { headers })).rejects.toMatchObject({ response: { status: 400 } });
    const unsupported = new FormData(); unsupported.append('file', new Blob(['bad'], { type: 'application/javascript' }), 'bad.js');
    await expect(axios.post(`/api/tasks/${taskId}/attachments`, unsupported, { headers })).rejects.toMatchObject({ response: { status: 415 } });
    const oversized = new FormData(); oversized.append('file', new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: 'text/plain' }), 'large.txt');
    await expect(axios.post(`/api/tasks/${taskId}/attachments`, oversized, { headers })).rejects.toMatchObject({ response: { status: 413 } });
  });

  it('deletes metadata transactionally and makes it inaccessible', async () => {
    const headers = { Authorization: `Bearer ${token}` };
    expect((await axios.delete(`/api/attachments/${attachmentId}`, { headers })).status).toBe(204);
    await expect(axios.get(`/api/attachments/${attachmentId}`, { headers })).rejects.toMatchObject({ response: { status: 404 } });
  });
});
