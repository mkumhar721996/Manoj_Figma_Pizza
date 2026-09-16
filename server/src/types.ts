export type UserRole = 'member' | 'qa_lead';

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: UserRole;
  projectIds: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
