function log(level, event, data = {}) {
  console[level](JSON.stringify({ level, event, ...data, time: new Date().toISOString() }));
}

module.exports = {
  info: (event, data) => log("info", event, data),
  warn: (event, data) => log("warn", event, data),
  error: (event, data) => log("error", event, data),
};
