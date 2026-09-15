import { NextFunction, Request, Response } from "express";

// Express identifies error-handling middleware by its four-argument signature,
// so all four parameters must stay even though `next` is unused.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  console.error(
    JSON.stringify({
      level: "error",
      method: req.method,
      path: req.originalUrl,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }),
  );

  res.status(500).json({ error: "Internal server error" });
}
