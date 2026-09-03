const { createApp } = require('./app');

const port = process.env.ARC_DEV_PORT || 8007;

createApp().listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
