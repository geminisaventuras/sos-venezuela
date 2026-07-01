// @build: 2026-07-01.08-15-00 | id: SERVER-DUAL | desc: Inicia HTTP en Render, HTTPS local con certificados mkcert
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Intentar cargar certificados locales (solo desarrollo)
const keyPath = path.join(__dirname, '..', 'localhost+2-key.pem');
const certPath = path.join(__dirname, '..', 'localhost+2.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  // Modo desarrollo con HTTPS
  const https = require('https');
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  https.createServer(options, app).listen(PORT, () => {
    console.log(🔒 HTTPS local activo en https://localhost:);
  });
} else {
  // Modo producción (HTTP simple)
  app.listen(PORT, () => {
    console.log(🚀 Servidor HTTP en puerto );
  });
}
