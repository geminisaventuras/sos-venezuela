// @build: 2026-06-28.22-00-00 | id: B0-MIDDLEWARE-V2 | desc: Middleware de autenticación + sesión única para voluntarios
const supabaseAdmin = require('../config/supabase');
const jwt = require('jsonwebtoken');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Token requerido', traceId: req.traceId } });
  }
  const token = authHeader.split(' ')[1];

  // Validar token usando Supabase Admin (soporta HS256 y ES256)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_INVALID', message: 'Token inválido o expirado', traceId: req.traceId } });
  }

  req.user = { sub: user.id, email: user.email };

  // Obtener rol desde la tabla perfiles
  try {
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('user_id', user.id)
      .maybeSingle();
    if (perfil) {
      req.user.rol = perfil.rol;

      // ---- SESIÓN ÚNICA PARA CONDUCTORES ----
      if (perfil.rol === 'voluntario') {
        // Obtener el jti del token actual
        const decoded = jwt.decode(token);
        const currentJti = decoded?.jti;

        if (currentJti) {
          // Verificar si ya existe un jti almacenado
          const { data: volData } = await supabaseAdmin
            .from('voluntarios')
            .select('ultimo_token_jti')
            .eq('user_id', user.id)
            .maybeSingle();

          // Si hay un jti guardado y no coincide con el actual, rechazar
          if (volData?.ultimo_token_jti && volData.ultimo_token_jti !== currentJti) {
            return res.status(401).json({
              success: false,
              error: { code: 'SESSION_CONFLICT', message: 'Sesión iniciada en otro dispositivo. Cierre sesión aquí y vuelva a intentarlo.', traceId: req.traceId }
            });
          }

          // Actualizar el jti actual en la base de datos
          await supabaseAdmin
            .from('voluntarios')
            .update({ ultimo_token_jti: currentJti })
            .eq('user_id', user.id);
        }
      }
      // ---- FIN SESIÓN ÚNICA ----
    }
  } catch (e) {
    // Si falla la consulta, continuamos sin rol (las rutas públicas no lo necesitan)
  }

  next();
}

function roleMiddleware(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !req.user.rol || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Rol no autorizado', traceId: req.traceId } });
    }
    next();
  };
}

module.exports = { authMiddleware, roleMiddleware };