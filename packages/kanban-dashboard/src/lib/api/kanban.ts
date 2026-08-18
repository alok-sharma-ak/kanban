import 'server-only';
import { apiRequest } from './client';
import { authenticatedActionRequest } from '../auth/session';
import type { Attachment, Board, BoardDetail, Health, Member, PaginatedUsers, Task, User } from './types';

export const getProfile = () => authenticatedActionRequest<User>('/users/me');
export const getBoards = () => authenticatedActionRequest<Board[]>('/boards');
export const getBoard = (id: string) => authenticatedActionRequest<BoardDetail>(`/boards/${id}`);
export const getMembers = (id: string) => authenticatedActionRequest<Member[]>(`/boards/${id}/members`);
export const getTask = (id: string) => authenticatedActionRequest<Task>(`/tasks/${id}`);
export const getAttachments = (id: string) => authenticatedActionRequest<Attachment[]>(`/tasks/${id}/attachments`);
export const getAttachment = (id: string) => authenticatedActionRequest<Attachment>(`/attachments/${id}`);
export const getAdminUsers = (page: number, search: string) => authenticatedActionRequest<PaginatedUsers>(`/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
export const getLiveness = () => apiRequest<Health>('/health/live');
export const getReadiness = () => apiRequest<Health>('/health/ready');
export const getLegacyHealth = () => apiRequest<Health>('/health');
