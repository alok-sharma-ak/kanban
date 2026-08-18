export enum SystemRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum BoardRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export type StoredBoardRole = Exclude<BoardRole, BoardRole.OWNER>;

export const BOARD_EDIT_ROLES = new Set([BoardRole.OWNER, BoardRole.ADMIN]);
export const TASK_EDIT_ROLES = new Set([BoardRole.OWNER, BoardRole.ADMIN, BoardRole.MEMBER]);
