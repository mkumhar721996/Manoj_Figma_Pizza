import { CommentItem } from './CommentItem.js';
import type { Comment, CurrentUser } from '../../types.js';

interface CommentListProps {
  comments: Comment[];
  currentUser: CurrentUser | null;
  onEdit: (commentId: string, body: string) => void;
  onDelete: (commentId: string) => void;
}

export function CommentList({ comments, currentUser, onEdit, onDelete }: CommentListProps) {
  if (comments.length === 0) {
    return <p>No comments yet.</p>;
  }

  return (
    <ul>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} currentUser={currentUser} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}
