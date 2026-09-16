import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommentItem } from './CommentItem.js';
import type { Comment, CurrentUser } from '../../types.js';

const author: CurrentUser = { id: 'u1', name: 'Alice', role: 'member', token: 'token-author' };
const qaLead: CurrentUser = { id: 'u2', name: 'Quinn', role: 'qa_lead', token: 'token-qa-lead' };
const otherMember: CurrentUser = { id: 'u3', name: 'Sam', role: 'member', token: 'token-other' };

const comment: Comment = {
  id: 'c1',
  defectId: 'd1',
  authorId: 'u1',
  authorName: 'Alice',
  body: 'Original comment',
  createdAt: '2026-01-01T00:00:00.000Z',
  isEdited: false,
  editedAt: null,
  deletedAt: null,
  history: [],
};

describe('CommentItem', () => {
  it('renders the author name, body, and timestamp', () => {
    render(<CommentItem comment={comment} currentUser={author} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Original comment')).toBeInTheDocument();
  });

  it('renders edit/delete controls for the comment author', () => {
    render(<CommentItem comment={comment} currentUser={author} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('renders edit/delete controls for a QA/Lead viewer', () => {
    render(<CommentItem comment={comment} currentUser={qaLead} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('does not render edit/delete controls for a non-author, non QA/Lead viewer', () => {
    render(<CommentItem comment={comment} currentUser={otherMember} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('calls onEdit with the new body when the author saves an edit', () => {
    const onEdit = vi.fn();
    render(<CommentItem comment={comment} currentUser={author} onEdit={onEdit} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'updated text' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onEdit).toHaveBeenCalledWith('c1', 'updated text');
  });

  it('calls onDelete when the author deletes a comment', () => {
    const onDelete = vi.fn();
    render(<CommentItem comment={comment} currentUser={author} onEdit={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledWith('c1');
  });

  it('shows an edited indicator when the comment has been edited', () => {
    render(
      <CommentItem
        comment={{ ...comment, isEdited: true, editedAt: '2026-01-02T00:00:00.000Z' }}
        currentUser={author}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(/edited/i)).toBeInTheDocument();
  });
});
