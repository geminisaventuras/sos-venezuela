// @build: 2026-06-26.18-30-00 | id: B1-B2 | backup: server.js.backup-20260626-183000 | desc: Arranque del servidor
require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));