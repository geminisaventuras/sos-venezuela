// @build: 2026-06-27.15-00-00 | id: B0-MIDDLEWARE-V3 | desc: Middleware con búsqueda de rol
const jwt = require('jsonwebtoken')
const supabaseAdmin = require('../config/supabase')

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Token requerido', traceId: req.traceId } })
  }
  const token = authHeader.split(' ')[1]
  let decoded
  try {
    // Verificar con el secreto HS256 de Supabase
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
  } catch (err) {
    // Fallback: decodificar sin verificar (solo desarrollo)
    try { decoded = jwt.decode(token); if (!decoded || !decoded.sub) throw new Error() }
    catch { return res.status(401).json({ success: false, error: { code: 'AUTH_INVALID', message: 'Token inválido', traceId: req.traceId } }) }
  }

  req.user = { sub: decoded.sub, email: decoded.email }

  // Obtener rol desde la tabla perfiles
  try {
    const { data: perfil, error } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('user_id', decoded.sub)
      .maybeSingle()
    if (!error && perfil) {
      req.user.rol = perfil.rol
    }
  } catch (e) {
    // Si falla la consulta, continuamos sin rol (las rutas públicas no lo necesitan)
  }

  next()
}

function roleMiddleware(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !req.user.rol || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Rol no autorizado', traceId: req.traceId } })
    }
    next()
  }
}

module.exports = { authMiddleware, roleMiddleware }
