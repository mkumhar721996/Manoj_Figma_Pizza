import { app } from "./app.js";

const port = Number(process.env.ARC_DEV_PORT ?? 8016);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
