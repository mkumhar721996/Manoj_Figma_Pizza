import { NextFunction, Request, Response } from "express";
import { findMemberIdForToken } from "./memberTokens.js";
import { PROJECT_MEMBERS, ProjectMember } from "../data/projectMembers.js";

export interface AuthenticatedRequest extends Request {
  member?: ProjectMember;
}

const AUTH_SCHEME = "Bearer ";

export function requireAuthenticatedMember(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.header("authorization") ?? "";

  if (!header.startsWith(AUTH_SCHEME)) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = header.slice(AUTH_SCHEME.length).trim();
  const memberId = token ? findMemberIdForToken(token) : undefined;
  const member = memberId ? PROJECT_MEMBERS.find((candidate) => candidate.id === memberId) : undefined;

  if (!member) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  req.member = member;
  next();
}
