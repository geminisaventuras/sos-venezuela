// @build: 2026-07-01.10-00-00 | id: B0-MIDDLEWARE-V7 | desc: Permite primera petición sin X-Session-Id durante el login. Sesión única aplica a partir de la segunda petición.
const supabaseAdmin = require('../config/supabase');
const jwt = require('jsonwebtoken');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Token requerido', traceId: req.traceId } });
  }
  const token = authHeader.split(' ')[1];

  // ==========================================
  // CAPA 1: INSPECCIÓN LOCAL (decodificación manual + sessionId)
  // ==========================================
  let tokenDecodificado;
  try {
    tokenDecodificado = jwt.decode(token);
  } catch (e) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_INVALID', message: 'Estructura de token inválida', traceId: req.traceId } });
  }

  if (!tokenDecodificado || !tokenDecodificado.sub) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_INVALID', message: 'Estructura de token inválida', traceId: req.traceId } });
  }

  const userId = tokenDecodificado.sub;
  const sessionId = req.headers['x-session-id'] || req.headers['X-Session-Id'];

  // Obtener rol desde la tabla perfiles
  let perfil = null;
  try {
    const { data, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('user_id', userId)
      .maybeSingle();
    if (perfilError) throw perfilError;
    perfil = data;
  } catch (e) {
    console.error('Error consultando perfil en authMiddleware:', e.message);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Error interno al validar sesión', traceId: req.traceId } });
  }

  if (perfil) {
    req.user = { sub: userId, email: tokenDecodificado.email, rol: perfil.rol };

    // ---- SESIÓN ÚNICA PARA CONDUCTORES ----
    if (perfil.rol === 'voluntario') {
      // Solo aplicamos sesión única si el frontend ya generó un sessionId.
      // Si no lo ha generado todavía (primera petición post-login), permitimos el paso.
      if (sessionId) {
        let volData = null;
        try {
          const { data, error: volError } = await supabaseAdmin
            .from('voluntarios')
            .select('ultimo_token_jti')
            .eq('user_id', userId)
            .maybeSingle();
          if (volError) throw volError;
          volData = data;
        } catch (e) {
          console.error('Error consultando voluntarios en authMiddleware:', e.message);
          return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Error interno al validar sesión', traceId: req.traceId } });
        }

        // Caso A: Hay un sessionId guardado y no coincide → SESIÓN EXPULSADA
        if (volData?.ultimo_token_jti && volData.ultimo_token_jti !== sessionId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'SESSION_CONFLICT',
              message: 'Sesión iniciada en otro dispositivo. Cierre sesión aquí y vuelva a intentarlo.',
              traceId: req.traceId
            }
          });
        }
        // Caso B: Primer inicio de sesión (no hay sessionId guardado aún) → guardar
        else if (!volData || !volData.ultimo_token_jti) {
          await supabaseAdmin
            .from('voluntarios')
            .update({ ultimo_token_jti: sessionId })
            .eq('user_id', userId);
        }
        // Caso C: El sessionId coincide → mismo dispositivo, permitir (sin acción)
      }
      // Si no hay sessionId, permitimos (primera petición tras login, el frontend aún no lo generó)
    }
    // ---- FIN SESIÓN ÚNICA ----
  }

  // ==========================================
  // CAPA 2: VALIDACIÓN DE FIRMA CON SUPABASE
  // ==========================================
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_INVALID', message: 'Token inválido o expirado', traceId: req.traceId } });
  }

  // Si no se obtuvo el rol en la Capa 1, intentar de nuevo aquí
  if (!req.user || !req.user.rol) {
    req.user = { sub: user.id, email: user.email };
    try {
      const { data: perfil } = await supabaseAdmin
        .from('perfiles')
        .select('rol')
        .eq('user_id', user.id)
        .maybeSingle();
      if (perfil) {
        req.user.rol = perfil.rol;
      }
    } catch (e) {}
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