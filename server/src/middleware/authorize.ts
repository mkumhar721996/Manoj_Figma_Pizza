import type { NextFunction, Request, Response } from 'express';

export function requireProjectMember(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.projectIds?.length) {
    res.status(403).json({ error: 'Must be an authenticated project member' });
    return;
  }

  next();
}
