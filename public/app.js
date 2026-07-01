// @build: 2026-06-30.22-30-00 | id: PWA-UTILS-V4 | desc: Utilidades globales + protección anti-bucle de sesión conflictiva + resolución sin recarga
const API_BASE = '__API_BASE__'
let authToken = localStorage.getItem('authToken')
let perfil = JSON.parse(localStorage.getItem('perfil') || 'null')

// 🔒 Protección anti-bucle: evita múltiples diálogos de conflicto simultáneos
let _sesionConflictoEnProgreso = false

window.setAuth = function(token, p) {
  authToken = token
  perfil = p
  localStorage.setItem('authToken', token)
  localStorage.setItem('perfil', JSON.stringify(p))
}

window.logout = function() {
  authToken = null
  perfil = null
  localStorage.removeItem('authToken')
  localStorage.removeItem('perfil')
  localStorage.removeItem('viajeEnCurso')
  localStorage.removeItem('sessionId')
  window.location.href = '/login.html'
}

window.apiFetch = async function(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  options.signal = controller.signal
  options.headers = { 'Content-Type': 'application/json', ...options.headers }
  if (authToken) options.headers['Authorization'] = 'Bearer ' + authToken
  const sessionId = localStorage.getItem('sessionId')
  if (sessionId) options.headers['X-Session-Id'] = sessionId
  const traceId = crypto.randomUUID().replace(/-/g, '')
  const spanId = traceId.substring(0, 16)
  options.headers['traceparent'] = `00-${traceId}-${spanId}-01`
  try {
    const res = await fetch(API_BASE + path, options)
    clearTimeout(timeout)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Error ' + res.status } }))

      if (res.status === 401 && err.error?.code === 'SESSION_CONFLICT') {
        // 🔒 Anti-bucle: si ya hay un diálogo de conflicto abierto, esperar y reintentar
        if (_sesionConflictoEnProgreso) {
          // Esperar 500ms y reintentar la petición (la otra instancia ya está resolviendo)
          await new Promise(r => setTimeout(r, 500))
          return window.apiFetch(path, options)
        }

        _sesionConflictoEnProgreso = true
        const forzar = confirm('Sesión iniciada en otro dispositivo. ¿Desea cerrar la otra sesión y usar este dispositivo?')
        
        if (forzar) {
          try {
            // Enviar el sessionId actual para que el backend lo actualice directamente
            const nuevoSessionId = localStorage.getItem('sessionId')
            const liberarRes = await fetch(API_BASE + '/api/voluntarios/liberar-sesion', {
              method: 'POST',
              headers: { 
                'Authorization': 'Bearer ' + authToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ nuevo_session_id: nuevoSessionId })
            })
            if (liberarRes.ok) {
              _sesionConflictoEnProgreso = false
              alert('Sesión liberada. Puede continuar.')
              // Reintentar la petición original con el mismo sessionId
              return window.apiFetch(path, options)
            }
          } catch (e) {
            _sesionConflictoEnProgreso = false
            alert('Error al liberar sesión. Intente de nuevo.')
          }
        }
        
        _sesionConflictoEnProgreso = false
        localStorage.removeItem('authToken')
        localStorage.removeItem('perfil')
        localStorage.removeItem('viajeEnCurso')
        localStorage.removeItem('sessionId')
        window.location.href = '/login.html'
        throw new Error('Sesión cerrada. Inicie de nuevo.')
      }

      throw new Error(err.error?.message || 'Error del servidor')
    }
    return res.json()
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') throw new Error('Tiempo de espera agotado')
    throw err
  }
}
window.generarUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16) })
window.obtenerUbicacion = cb => navigator.geolocation ? navigator.geolocation.getCurrentPosition(pos => cb(null, { lat: pos.coords.latitude, lon: pos.coords.longitude }), cb, { enableHighAccuracy: true, timeout: 10000 }) : cb(new Error('No soportado'))
window.obtenerDireccion = (lat, lon, cb) => fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`).then(r => r.json()).then(d => cb(d?.display_name || null)).catch(() => cb(null))
window.cargarCatalogo = async tipo => { try { const r = await apiFetch('/api/catalogo?tipo=' + tipo); return r.data || [] } catch { return [] } }
window.verificarSesion = (roles = null) => {
  if (!authToken || !perfil) { window.location.href = '/login.html'; return false }
  if (roles && !roles.includes(perfil.rol)) { alert('No autorizado'); window.location.href = '/login.html'; return false }
  return true
}