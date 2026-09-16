import express, { type Express } from 'express';
import { auth } from './middleware/auth.js';
import { CommentsRepository } from './comments/comments.repository.js';
import { CommentsService } from './comments/comments.service.js';
import { createCommentsRouter } from './comments/comments.routes.js';

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(auth);

  const commentsRepository = new CommentsRepository();
  const commentsService = new CommentsService(commentsRepository);
  app.use('/api', createCommentsRouter(commentsService));

  return app;
}
