import { useState, type FormEvent } from 'react';
import type { CurrentUser } from '../../types.js';

interface CommentFormProps {
  currentUser: CurrentUser | null;
  onSubmit: (body: string) => void;
}

export function CommentForm({ currentUser, onSubmit }: CommentFormProps) {
  const [body, setBody] = useState('');

  if (!currentUser) {
    return null;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) {
      return;
    }
    onSubmit(body);
    setBody('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="comment-body">Add a comment</label>
      <textarea id="comment-body" value={body} onChange={(e) => setBody(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  );
}
