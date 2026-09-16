import { randomUUID } from 'node:crypto';
import type { AuthenticatedUser } from '../types.js';
import type { CommentsRepository } from './comments.repository.js';
import type { Comment } from './comments.types.js';

export class ForbiddenCommentActionError extends Error {
  constructor(message = 'Not authorized to modify this comment') {
    super(message);
    this.name = 'ForbiddenCommentActionError';
  }
}

export class CommentNotFoundError extends Error {
  constructor(message = 'Comment not found') {
    super(message);
    this.name = 'CommentNotFoundError';
  }
}

function isAuthorOrQaLead(user: AuthenticatedUser, comment: Comment): boolean {
  return user.id === comment.authorId || user.role === 'qa_lead';
}

export class CommentsService {
  constructor(private readonly repository: CommentsRepository) {}

  addComment(input: { defectId: string; author: AuthenticatedUser; body: string }): Comment {
    const now = new Date().toISOString();
    const comment: Comment = {
      id: randomUUID(),
      defectId: input.defectId,
      authorId: input.author.id,
      authorName: input.author.name,
      body: input.body,
      createdAt: now,
      isEdited: false,
      editedAt: null,
      deletedAt: null,
      history: [],
    };

    return this.repository.save(comment);
  }

  editComment(input: { commentId: string; requester: AuthenticatedUser; body: string }): Comment {
    const existing = this.repository.findById(input.commentId);
    if (!existing || existing.deletedAt) {
      throw new CommentNotFoundError();
    }

    if (!isAuthorOrQaLead(input.requester, existing)) {
      throw new ForbiddenCommentActionError();
    }

    const now = new Date().toISOString();
    const updated: Comment = {
      ...existing,
      body: input.body,
      isEdited: true,
      editedAt: now,
      history: [
        ...existing.history,
        {
          id: randomUUID(),
          body: existing.body,
          changeType: 'edit',
          changedAt: now,
        },
      ],
    };

    return this.repository.save(updated);
  }

  deleteComment(input: { commentId: string; requester: AuthenticatedUser }): Comment {
    const existing = this.repository.findById(input.commentId);
    if (!existing || existing.deletedAt) {
      throw new CommentNotFoundError();
    }

    if (!isAuthorOrQaLead(input.requester, existing)) {
      throw new ForbiddenCommentActionError();
    }

    const now = new Date().toISOString();
    const updated: Comment = {
      ...existing,
      deletedAt: now,
      history: [
        ...existing.history,
        {
          id: randomUUID(),
          body: existing.body,
          changeType: 'delete',
          changedAt: now,
        },
      ],
    };

    return this.repository.save(updated);
  }

  listComments(defectId: string): Comment[] {
    return this.repository.listByDefectId(defectId);
  }
}
