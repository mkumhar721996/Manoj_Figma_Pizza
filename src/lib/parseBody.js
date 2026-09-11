const logger = require("./logger");

const MAX_BODY_BYTES = 100 * 1024; // 100 KB

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let bytes = 0;
    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        const err = new Error("Request body too large");
        err.status = 413;
        reject(err);
        return;
      }
      raw += chunk;
    });
    req.on("end", () => {
      const contentType = req.headers["content-type"] || "";
      try {
        if (contentType.includes("application/json")) {
          resolve(raw ? JSON.parse(raw) : {});
        } else {
          resolve(Object.fromEntries(new URLSearchParams(raw)));
        }
      } catch (err) {
        logger.error("request_parse_failed", { error: err.message });
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

module.exports = { parseBody };
