import { useState } from 'react';
import type { Comment, CurrentUser } from '../../types.js';

interface CommentItemProps {
  comment: Comment;
  currentUser: CurrentUser | null;
  onEdit: (commentId: string, body: string) => void;
  onDelete: (commentId: string) => void;
}

function canModify(comment: Comment, currentUser: CurrentUser | null): boolean {
  return !!currentUser && (currentUser.id === comment.authorId || currentUser.role === 'qa_lead');
}

export function CommentItem({ comment, currentUser, onEdit, onDelete }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const allowedToModify = canModify(comment, currentUser);

  function handleSave() {
    if (!draft.trim()) {
      return;
    }
    onEdit(comment.id, draft);
    setIsEditing(false);
  }

  return (
    <li>
      <div>{comment.authorName}</div>
      <time dateTime={comment.createdAt}>{comment.createdAt}</time>
      {comment.isEdited && <span>(edited)</span>}
      {isEditing ? (
        <div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button type="button" onClick={handleSave}>
            Save
          </button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <p data-testid="comment-body">{comment.body}</p>
      )}
      {allowedToModify && !isEditing && (
        <div>
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <button type="button" onClick={() => onDelete(comment.id)}>
            Delete
          </button>
        </div>
      )}
    </li>
  );
}
