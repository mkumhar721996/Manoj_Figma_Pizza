export type CommentHistoryChangeType = 'edit' | 'delete';

export interface CommentHistoryEntry {
  id: string;
  body: string;
  changeType: CommentHistoryChangeType;
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
