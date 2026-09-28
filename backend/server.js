const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
app.use(express.json());

routes(app);

const PORT = process.env.PORT || 3034;
app.listen(PORT, () => {
  console.log(`🌱 Digital Farm System running at http://localhost:${PORT}`);
  console.log(`   Admin panel: http://localhost:${PORT}/admin`);
  console.log(`   Public site: http://localhost:${PORT}/`);
});
