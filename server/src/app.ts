import cors from "cors";
import express from "express";
import { defectsRouter } from "./routes/defects.js";
import { projectMembersRouter } from "./routes/projectMembers.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/defects", defectsRouter);
app.use("/api/project-members", projectMembersRouter);
