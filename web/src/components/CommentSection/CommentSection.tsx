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

  const refresh = useCallback(() => {
    if (!currentUser) {
      return;
    }
    commentsApi.list(defectId, currentUser).then(setComments);
  }, [defectId, currentUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSubmit(body: string) {
    if (!currentUser) {
      return;
    }
    await commentsApi.add(defectId, currentUser, body);
    refresh();
  }

  async function handleEdit(commentId: string, body: string) {
    if (!currentUser) {
      return;
    }
    await commentsApi.edit(commentId, currentUser, body);
    refresh();
  }

  async function handleDelete(commentId: string) {
    if (!currentUser) {
      return;
    }
    await commentsApi.remove(commentId, currentUser);
    refresh();
  }

  return (
    <section>
      <h2>Comments</h2>
      {currentUser && <CommentList comments={comments} currentUser={currentUser} onEdit={handleEdit} onDelete={handleDelete} />}
      <CommentForm currentUser={currentUser} onSubmit={handleSubmit} />
    </section>
  );
}
