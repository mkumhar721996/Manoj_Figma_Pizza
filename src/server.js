const { createApp } = require('./api/app');
const { DefectRepository } = require('./domain/defectRepository');

const port = process.env.ARC_DEV_PORT || 8020;
const repo = new DefectRepository();
const app = createApp(repo);

app.listen(port, () => {
  console.log(`Defects API listening on port ${port}`);
});
