import { createApp } from "./api/app";

const port = process.env.ARC_DEV_PORT ?? 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
