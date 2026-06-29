// @build: 2026-06-27.16-00-00 | id: PWA-UTILS | desc: Utilidades globales (sin autenticación)
//const API_BASE = 'https://sos-venezuela-backend.onrender.com'
const API_BASE = '__API_BASE__'
let authToken = localStorage.getItem('authToken')
let perfil = JSON.parse(localStorage.getItem('perfil') || 'null')

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
  window.location.href = '/login.html'
}

window.apiFetch = async function(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  options.signal = controller.signal
  options.headers = { 'Content-Type': 'application/json', ...options.headers }
  if (authToken) options.headers['Authorization'] = 'Bearer ' + authToken
  try {
    const res = await fetch(API_BASE + path, options)
    clearTimeout(timeout)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Error ' + res.status } }))
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
