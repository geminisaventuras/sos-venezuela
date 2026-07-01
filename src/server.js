// @build: 2026-06-30.22-30-00 | id: B0-SERVER-HTTPS | desc: Servidor HTTPS con certificados mkcert
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '..', 'localhost+2-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '..', 'localhost+2.pem'))
};

https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`🛡️ Servidor HTTPS corriendo en https://192.168.1.152:${PORT}`);
});