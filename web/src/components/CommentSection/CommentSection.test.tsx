import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CommentSection } from './CommentSection.js';
import { commentsApi } from '../../api/commentsApi.js';
import type { Comment } from '../../types.js';

vi.mock('../../api/commentsApi.js', () => ({
  commentsApi: {
    list: vi.fn(),
    add: vi.fn(),
    edit: vi.fn(),
    remove: vi.fn(),
  },
}));

const mockedApi = vi.mocked(commentsApi);

function makeComment(id: string, body: string): Comment {
  return {
    id,
    defectId: 'd1',
    authorId: 'u1',
    authorName: 'Alice',
    body,
    createdAt: '2026-01-01T00:00:00.000Z',
    isEdited: false,
    editedAt: null,
    deletedAt: null,
    history: [],
  };
}

describe('CommentSection', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays comments for an unauthenticated viewer', async () => {
    mockedApi.list.mockResolvedValue([makeComment('c1', 'visible to everyone')]);

    render(<CommentSection defectId="d1" currentUser={null} />);

    expect(mockedApi.list).toHaveBeenCalledWith('d1', null);
    await waitFor(() => expect(screen.getByTestId('comment-body')).toHaveTextContent('visible to everyone'));
  });

  it('shows the empty-state message for an unauthenticated viewer when there are no comments', async () => {
    mockedApi.list.mockResolvedValue([]);

    render(<CommentSection defectId="d1" currentUser={null} />);

    await waitFor(() => expect(screen.getByText(/no comments yet/i)).toBeInTheDocument());
  });

  it('shows an error message instead of crashing when fetching comments fails', async () => {
    mockedApi.list.mockRejectedValue(new Error('network down'));

    render(<CommentSection defectId="d1" currentUser={null} />);

    await waitFor(() => expect(screen.getByText(/couldn't load comments/i)).toBeInTheDocument());
  });
});
