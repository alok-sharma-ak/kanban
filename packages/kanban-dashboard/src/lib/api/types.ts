export type SystemRole = 'USER' | 'ADMIN';
export type BoardRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface User { id: string; name: string; email: string; systemRole: SystemRole; createdAt: string; updatedAt: string }
export interface Task { id: string; title: string; description: string | null; position: number; columnId: string; assigneeId: string | null; createdAt: string; updatedAt: string }
export interface Column { id: string; name: string; position: number; boardId: string; createdAt: string; updatedAt: string; tasks: Task[] }
export interface Board { id: string; name: string; description: string | null; userId: string; role: BoardRole; createdAt: string; updatedAt: string }
export interface BoardDetail extends Board { columns: Column[] }
export interface Member { userId: string; name: string; email: string; role: BoardRole; joinedAt: string }
export interface Attachment { id: string; originalName: string; mimeType: string; size: number; taskId: string; uploaderId: string; createdAt: string; updatedAt: string }
export interface PaginatedUsers { items: User[]; page: number; limit: number; total: number; totalPages: number }
export interface HealthChecks { api: 'up'; postgres?: 'up' | 'down'; redis?: 'up' | 'down'; minio?: 'up' | 'down'; outbox?: 'up' | 'down' }
export interface Health { status: 'ok'; checks: HealthChecks }
export interface ActionState { status: 'idle' | 'success' | 'error'; message?: string; fieldErrors?: Record<string, string[]> }
export const initialActionState: ActionState = { status: 'idle' };

export const canEditBoard = (role: BoardRole) => role === 'OWNER' || role === 'ADMIN';
export const canEditTasks = (role: BoardRole) => role !== 'VIEWER';
export const canManageMembers = (role: BoardRole) => role === 'OWNER' || role === 'ADMIN';
