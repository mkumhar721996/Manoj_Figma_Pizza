import { useCallback, useEffect, useState } from 'react';
import { commentsApi } from '../../api/commentsApi.js';
import { CommentForm } from './CommentForm.js';
import { CommentList } from './CommentList.js';
import type { Comment, CurrentUser } from '../../types.js';

interface CommentSectionProps {
  defectId: string;
  currentUser: CurrentUser | null;
}

export function CommentSection({ defectId, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    commentsApi
      .list(defectId, currentUser)
      .then((result) => {
        setComments(result);
        setError(null);
      })
      .catch(() => setError("Couldn't load comments. Please try again."));
  }, [defectId, currentUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSubmit(body: string) {
    if (!currentUser) {
      return;
    }
    try {
      await commentsApi.add(defectId, currentUser, body);
      refresh();
    } catch {
      setError("Couldn't submit your comment. Please try again.");
    }
  }

  async function handleEdit(commentId: string, body: string) {
    if (!currentUser) {
      return;
    }
    try {
      await commentsApi.edit(commentId, currentUser, body);
      refresh();
    } catch {
      setError("Couldn't save your edit. Please try again.");
    }
  }

  async function handleDelete(commentId: string) {
    if (!currentUser) {
      return;
    }
    try {
      await commentsApi.remove(commentId, currentUser);
      refresh();
    } catch {
      setError("Couldn't delete the comment. Please try again.");
    }
  }

  return (
    <section>
      <h2>Comments</h2>
      {error && <p role="alert">{error}</p>}
      <CommentList comments={comments} currentUser={currentUser} onEdit={handleEdit} onDelete={handleDelete} />
      <CommentForm currentUser={currentUser} onSubmit={handleSubmit} />
    </section>
  );
}
