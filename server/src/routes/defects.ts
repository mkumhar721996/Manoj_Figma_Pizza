import { Router } from "express";
import { createDefect, DefectValidationError, getDefect } from "../store/defectStore.js";

export const defectsRouter = Router();

defectsRouter.post("/", (req, res) => {
  try {
    const defect = createDefect(req.body ?? {});
    res.status(201).json(defect);
  } catch (error) {
    if (error instanceof DefectValidationError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    throw error;
  }
});

defectsRouter.get("/:id", (req, res) => {
  const defect = getDefect(req.params.id);
  if (!defect) {
    res.status(404).json({ error: "Defect not found" });
    return;
  }
  res.json(defect);
});
