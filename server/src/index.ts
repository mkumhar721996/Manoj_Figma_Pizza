import { createApp } from './app.js';

const port = Number(process.env.ARC_DEV_PORT) || 8021;
const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});
