import { Router } from "express";
import { PROJECT_MEMBERS } from "../data/projectMembers.js";

export const projectMembersRouter = Router();

projectMembersRouter.get("/", (_req, res) => {
  res.json(PROJECT_MEMBERS);
});
