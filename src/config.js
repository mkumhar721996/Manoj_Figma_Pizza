import { randomBytes } from 'node:crypto';

// Falls back to a random secret generated fresh for this process (never logged or persisted) so
// the in-memory demo server is usable without extra setup; every real deployment must set
// SESSION_SECRET explicitly so tokens survive a restart and can't be guessed. A fixed hardcoded
// fallback would let anyone with source access forge tokens for any user, so no such default is
// ever used here.
export const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
