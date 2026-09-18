export type UserRole = 'member' | 'qa_lead';

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  token: string;
}

export interface CommentHistoryEntry {
  id: string;
  body: string;
  changeType: 'edit' | 'delete';
  changedAt: string;
}

export interface Comment {
  id: string;
  defectId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  isEdited: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  history: CommentHistoryEntry[];
}
