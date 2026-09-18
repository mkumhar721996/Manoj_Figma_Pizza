import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommentForm } from './CommentForm.js';
import type { CurrentUser } from '../../types.js';

const member: CurrentUser = { id: 'u1', name: 'Alice', role: 'member', token: 'token-member' };

describe('CommentForm', () => {
  it('hides the comment form for a non-member viewer', () => {
    render(<CommentForm currentUser={null} onSubmit={vi.fn()} />);
    expect(screen.queryByRole('textbox', { name: /add a comment/i })).not.toBeInTheDocument();
  });

  it('renders the comment form for an authenticated project member', () => {
    render(<CommentForm currentUser={member} onSubmit={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: /add a comment/i })).toBeInTheDocument();
  });

  it('submits the entered comment body and clears the field', () => {
    const onSubmit = vi.fn();
    render(<CommentForm currentUser={member} onSubmit={onSubmit} />);

    const textbox = screen.getByRole('textbox', { name: /add a comment/i });
    fireEvent.change(textbox, { target: { value: 'A new comment' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith('A new comment');
    expect((textbox as HTMLTextAreaElement).value).toBe('');
  });
});
