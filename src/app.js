// @build: 2026-06-28.19-30-00 | id: B0-APP-CSP-FIX | desc: CSP corregida para desarrollo local (localhost) y producción
require('dotenv').config();
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

const necesidadesRoutes = require('./modules/necesidades/routes/necesidades.routes')
const voluntariosRoutes = require('./modules/voluntarios/routes/voluntarios.routes')
const donacionesRoutes = require('./modules/donaciones/routes/donaciones.routes')
const entregasRoutes = require('./modules/entregas/routes/entregas.routes')
const catalogoRoutes = require('./modules/catalogo/routes/catalogo.routes')
const perfilRoutes = require('./modules/perfil/routes/perfil.routes')
const inventarioRoutes = require('./modules/inventario/routes/inventario.routes')
const despachosRoutes = require('./modules/despachos/routes/despacho.routes')
const emergenciasRoutes = require('./modules/emergencias/routes/emergencias.routes')



const app = express()

const allowedOrigins = [
  'http://localhost:3000',
  'https://192.168.1.152:3000',
  'https://sos-venezuela-backend.onrender.com'
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Origen no permitido por CORS'))
    }
  },
  credentials: true
}))

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: "'self'",
      scriptSrc: "'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes' https://cdn.jsdelivr.net https://unpkg.com https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
      scriptSrcAttr: "'self' 'unsafe-inline' 'unsafe-hashes'",
      styleSrc: "'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      fontSrc: "'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      imgSrc: "'self' data: https: blob: https://*.tile.openstreetmap.org",
      connectSrc: "'self' http://localhost:3000 http://192.168.1.152:3000 https://192.168.1.152:3000 https://sos-venezuela-backend.onrender.com https://*.supabase.co wss://*.supabase.co https://routing.openstreetmap.de https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org",
      frameSrc: "'self'",
      childSrc: "'self'",
      objectSrc: "'none'"
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
  upgradeInsecureRequests: false
}))

app.get('/app.js', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '..', 'public', 'app.js');
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace('__API_BASE__', process.env.API_BASE || 'http://localhost:3000');
  res.setHeader('Content-Type', 'application/javascript');
  res.send(content);
});

app.use(express.json({ limit: '100kb' }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

app.use((req, res, next) => {
  req.traceId = uuidv4()
  res.set('X-Trace-Id', req.traceId)
  next()
})

app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Ayuda ante Terremoto funcionando', version: '3.0.0' })
})

app.use('/api/perfil', perfilRoutes)
app.use('/api/catalogo', catalogoRoutes)
app.use('/api/necesidades', necesidadesRoutes)
app.use('/api/voluntarios', voluntariosRoutes)
app.use('/api/donaciones', donacionesRoutes)
app.use('/api/entregas', entregasRoutes)
app.use('/api/inventario', inventarioRoutes)
app.use('/api/despachos', despachosRoutes)
app.use('/api/emergencias', emergenciasRoutes)


app.use((err, req, res, next) => {
  console.error(`[${req.traceId}]`, err)
  const status = err.status || 500
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status === 500 ? 'Error interno del servidor' : err.message,
      traceId: req.traceId,
    },
  })
})

module.exports = app