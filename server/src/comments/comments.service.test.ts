import { beforeEach, describe, expect, it } from 'vitest';
import { CommentsRepository } from './comments.repository.js';
import { CommentsService } from './comments.service.js';
import type { AuthenticatedUser } from '../types.js';

describe('CommentsService', () => {
  let repository: CommentsRepository;
  let service: CommentsService;
  const author: AuthenticatedUser = { id: 'u1', name: 'Alice', role: 'member', projectIds: ['p1'] };
  const qaLead: AuthenticatedUser = { id: 'u2', name: 'Quinn', role: 'qa_lead', projectIds: ['p1'] };
  const stranger: AuthenticatedUser = { id: 'u3', name: 'Sam', role: 'member', projectIds: ['p1'] };

  beforeEach(() => {
    repository = new CommentsRepository();
    service = new CommentsService(repository);
  });

  it('retains original content in history after an edit', () => {
    const created = service.addComment({ defectId: 'd1', author, body: 'original text' });
    const updated = service.editComment({ commentId: created.id, requester: author, body: 'updated text' });

    expect(updated.history).toContainEqual(
      expect.objectContaining({ body: 'original text', changeType: 'edit' })
    );
  });

  it('marks a comment as edited', () => {
    const created = service.addComment({ defectId: 'd1', author, body: 'original text' });
    const updated = service.editComment({ commentId: created.id, requester: author, body: 'updated text' });

    expect(updated.isEdited).toBe(true);
    expect(updated.editedAt).not.toBeNull();
  });

  it('allows a QA/Lead to edit someone else\'s comment', () => {
    const created = service.addComment({ defectId: 'd1', author, body: 'original text' });
    const updated = service.editComment({ commentId: created.id, requester: qaLead, body: 'lead edit' });

    expect(updated.body).toBe('lead edit');
  });

  it('rejects an edit from a non-author, non QA/Lead requester', () => {
    const created = service.addComment({ defectId: 'd1', author, body: 'original text' });

    expect(() =>
      service.editComment({ commentId: created.id, requester: stranger, body: 'hacked' })
    ).toThrow();
  });

  it('retains the original content in history when a comment is deleted', () => {
    const created = service.addComment({ defectId: 'd1', author, body: 'to remove' });
    service.deleteComment({ commentId: created.id, requester: author });

    const stored = repository.findById(created.id);
    expect(stored?.deletedAt).not.toBeNull();
    expect(stored?.history).toContainEqual(
      expect.objectContaining({ body: 'to remove', changeType: 'delete' })
    );
  });

  it('excludes a deleted comment from listComments', () => {
    const created = service.addComment({ defectId: 'd1', author, body: 'to remove' });
    service.deleteComment({ commentId: created.id, requester: author });

    expect(service.listComments('d1').map((c) => c.id)).not.toContain(created.id);
  });

  it('lists comments in chronological order', () => {
    const first = service.addComment({ defectId: 'd1', author, body: 'first' });
    const second = service.addComment({ defectId: 'd1', author, body: 'second' });

    expect(service.listComments('d1').map((c) => c.id)).toEqual([first.id, second.id]);
  });
});
