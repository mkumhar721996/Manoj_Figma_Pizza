import cors from "cors";
import express from "express";
import { requireAuthenticatedMember } from "./auth/authenticate.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { defectsRouter } from "./routes/defects.js";
import { projectMembersRouter } from "./routes/projectMembers.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api/defects", requireAuthenticatedMember, defectsRouter);
app.use("/api/project-members", requireAuthenticatedMember, projectMembersRouter);

app.use(errorHandler);
