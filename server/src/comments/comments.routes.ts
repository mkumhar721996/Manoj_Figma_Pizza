import { Router } from 'express';
import { requireProjectMember } from '../middleware/authorize.js';
import { CommentNotFoundError, CommentsService, ForbiddenCommentActionError } from './comments.service.js';

export function createCommentsRouter(service: CommentsService): Router {
  const router = Router();

  router.post('/defects/:defectId/comments', requireProjectMember, (req, res) => {
    const { body } = req.body as { body?: string };
    if (!body || !body.trim()) {
      res.status(400).json({ error: 'body is required' });
      return;
    }

    const comment = service.addComment({
      defectId: req.params.defectId,
      author: req.user!,
      body,
    });

    res.status(201).json(comment);
  });

  router.get('/defects/:defectId/comments', (req, res) => {
    const comments = service.listComments(req.params.defectId);
    res.status(200).json(comments);
  });

  router.patch('/comments/:commentId', requireProjectMember, (req, res) => {
    const { body } = req.body as { body?: string };
    if (!body || !body.trim()) {
      res.status(400).json({ error: 'body is required' });
      return;
    }

    try {
      const comment = service.editComment({
        commentId: req.params.commentId,
        requester: req.user!,
        body,
      });
      res.status(200).json(comment);
    } catch (err) {
      if (err instanceof ForbiddenCommentActionError) {
        res.status(403).json({ error: err.message });
        return;
      }
      if (err instanceof CommentNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  router.delete('/comments/:commentId', requireProjectMember, (req, res) => {
    try {
      const comment = service.deleteComment({
        commentId: req.params.commentId,
        requester: req.user!,
      });
      res.status(200).json(comment);
    } catch (err) {
      if (err instanceof ForbiddenCommentActionError) {
        res.status(403).json({ error: err.message });
        return;
      }
      if (err instanceof CommentNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  return router;
}
