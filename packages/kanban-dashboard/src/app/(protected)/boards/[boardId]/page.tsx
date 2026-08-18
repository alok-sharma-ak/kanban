import { notFound } from 'next/navigation';
import { BoardWorkspace } from '../../../../features/boards/board-workspace';
import { getAttachments, getBoard, getMembers } from '../../../../lib/api/kanban';
import { ApiError } from '../../../../lib/api/error';
import { getCurrentUser } from '../../../../lib/auth/session';
export default async function BoardPage({params}:{params:Promise<{boardId:string}>}){const {boardId}=await params;try{const [board,members,user]=await Promise.all([getBoard(boardId),getMembers(boardId),getCurrentUser()]);const pairs=await Promise.all(board.columns.flatMap(c=>c.tasks).map(async t=>[t.id,await getAttachments(t.id)] as const));const version=[board.updatedAt,...board.columns.map(c=>`${c.id}:${c.updatedAt}:${c.tasks.length}`),members.length].join('|');return <BoardWorkspace key={version} initial={board} members={members} currentUser={user} attachments={Object.fromEntries(pairs)}/>;}catch(e){if(e instanceof ApiError&&e.status===404)notFound();throw e;}}
