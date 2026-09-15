// Falls back to a fixed development secret only so the in-memory demo server is usable out of
// the box; any real deployment must set SESSION_SECRET so tokens can't be forged offline.
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-insecure-default-secret-change-me';
