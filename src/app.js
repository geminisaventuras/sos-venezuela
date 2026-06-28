// @build: 2026-06-28.19-00-00 | id: B0-APP-FINAL | desc: Express con CSP configurada para Supabase y Leaflet
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
const inventarioRoutes = require('./modules/inventario/routes/inventario.routes');
const despachosRoutes = require('./modules/despachos/routes/despacho.routes');
const app = express()

// CORS abierto para desarrollo
app.use(cors())

// Helmet con CSP personalizada para permitir Supabase, Leaflet y scripts inline
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://nominatim.openstreetmap.org",
        "https://*.tile.openstreetmap.org"
      ],
      frameSrc: ["'self'"],
      childSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
}))

// JSON y límites
app.use(express.json({ limit: '100kb' }))

// Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Trace ID
app.use((req, res, next) => {
  req.traceId = uuidv4()
  res.set('X-Trace-Id', req.traceId)
  next()
})

// Archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')))

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Ayuda ante Terremoto funcionando', version: '3.0.0' })
})

// Rutas de módulos
app.use('/api/perfil', perfilRoutes)
app.use('/api/catalogo', catalogoRoutes)
app.use('/api/necesidades', necesidadesRoutes)
app.use('/api/voluntarios', voluntariosRoutes)
app.use('/api/donaciones', donacionesRoutes)
app.use('/api/entregas', entregasRoutes)
app.use('/api/inventario', inventarioRoutes);
app.use('/api/despachos', despachosRoutes);

// Manejo de errores
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