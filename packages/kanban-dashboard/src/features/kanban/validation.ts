import { z } from 'zod';
export const profileSchema = z.object({ name: z.string().trim().min(1).max(120), email: z.email().max(320) });
export const boardSchema = z.object({ name: z.string().trim().min(1).max(160), description: z.string().trim().max(5000).optional() });
export const columnSchema = z.object({ name: z.string().trim().min(1).max(120) });
export const taskSchema = z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().max(10000).optional(), assigneeId: z.union([z.uuid(), z.literal('')]).optional() });
export const memberSchema = z.object({ email: z.email(), role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']) });
export const uuidSchema = z.uuid();
export const allowedAttachmentTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain']);
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
