import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedUser } from '../types.js';

/**
 * Stub auth middleware: decodes a bearer token of the form
 * `Bearer <base64(JSON AuthenticatedUser)>` into `req.user`.
 * Real session/SSO wiring is out of scope for this story.
 */
export function auth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as AuthenticatedUser;
    req.user = decoded;
  } catch {
    // Malformed token: leave req.user undefined, treated as unauthenticated.
  }

  next();
}

export function encodeToken(user: AuthenticatedUser): string {
  return `Bearer ${Buffer.from(JSON.stringify(user)).toString('base64')}`;
}
