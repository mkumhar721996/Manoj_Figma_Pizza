const LEVEL_STREAMS = {
  error: console.error,
  warn: console.error,
  info: console.log,
};

// Structured, single-line JSON logging so auth/authorization/error events are greppable and
// machine-parseable in production log aggregation, without ever including secrets or tokens.
export function logEvent(level, event, context = {}) {
  const write = LEVEL_STREAMS[level] ?? console.log;
  write(JSON.stringify({ level, event, time: new Date().toISOString(), ...context }));
}
