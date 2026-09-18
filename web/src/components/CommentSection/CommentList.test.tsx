import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommentList } from './CommentList.js';
import type { Comment, CurrentUser } from '../../types.js';

const member: CurrentUser = { id: 'u1', name: 'Alice', role: 'member', token: 'token-member' };

function makeComment(id: string, body: string, createdAt: string): Comment {
  return {
    id,
    defectId: 'd1',
    authorId: 'u1',
    authorName: 'Alice',
    body,
    createdAt,
    isEdited: false,
    editedAt: null,
    deletedAt: null,
    history: [],
  };
}

describe('CommentList', () => {
  it('shows an empty-state message when there are no comments', () => {
    render(<CommentList comments={[]} currentUser={member} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('renders the full comment history in chronological order', () => {
    const comments = [
      makeComment('c1', 'first', '2026-01-01T00:00:00.000Z'),
      makeComment('c2', 'second', '2026-01-02T00:00:00.000Z'),
    ];
    render(<CommentList comments={comments} currentUser={member} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const rendered = screen.getAllByTestId('comment-body').map((el) => el.textContent);
    expect(rendered).toEqual(['first', 'second']);
  });

  it('shows an empty-state message to an unauthenticated viewer', () => {
    render(<CommentList comments={[]} currentUser={null} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('shows the comment history to an unauthenticated viewer without edit/delete controls', () => {
    const comments = [makeComment('c1', 'first', '2026-01-01T00:00:00.000Z')];
    render(<CommentList comments={comments} currentUser={null} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByTestId('comment-body')).toHaveTextContent('first');
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});
