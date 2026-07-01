// @build: 2026-07-01.08-20-00 | id: SERVER-DUAL-V2 | desc: HTTP en Render, HTTPS local (comillas corregidas)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const keyPath = path.join(__dirname, '..', 'localhost+2-key.pem');
const certPath = path.join(__dirname, '..', 'localhost+2.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const https = require('https');
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  https.createServer(options, app).listen(PORT, () => {
    console.log('HTTPS local activo en https://localhost:' + PORT);
  });
} else {
  app.listen(PORT, () => {
    console.log('Servidor HTTP en puerto ' + PORT);
  });
}