// @build: 2026-06-28.03-30-00 | id: B30-PERFIL-REPO-FIX | desc: Eliminada restricción de unicidad de teléfono en registro
const supabaseAdmin = require('../../../config/supabase');

class PerfilRepository {
  async buscarPorUserId(userId) {
    const { data, error } = await supabaseAdmin.from('perfiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw new Error(`Error interno de BD: ${error.message}`);
    return data;
  }

  async crearOActualizar(userId, datos) {
    const payload = {
      user_id: userId,
      rol: datos.rol,
      nombre_punto: datos.nombre_punto || datos.nombre || ('Usuario ' + datos.rol),
      tipo_punto: datos.tipo_punto || this._obtenerTipoPunto(datos.rol)
    };
    if (datos.telefono && datos.telefono.trim() !== '') payload.telefono = datos.telefono.trim();
    if (datos.lat) payload.lat = parseFloat(datos.lat);
    if (datos.lon) payload.lon = parseFloat(datos.lon);
    if (datos.estado) payload.estado = datos.estado.trim();
    if (datos.municipio) payload.municipio = datos.municipio.trim();
    if (datos.direccion_exacta) payload.direccion_exacta = datos.direccion_exacta.trim();
    if (datos.cedula_rif && datos.cedula_rif.trim() !== '') payload.cedula_rif = datos.cedula_rif.trim();

    const { data, error } = await supabaseAdmin.from('perfiles').upsert(payload, { onConflict: 'user_id' }).select().single();
    if (error) throw new Error(`Error al guardar perfil: ${error.message}`);
    return data;
  }

  _obtenerTipoPunto(rol) {
    switch (rol) { case 'centro_salud': return 'hospital'; case 'centro_acopio': return 'acopio'; case 'refugio': return 'refugio'; default: return null; }
  }

  async buscarPorRol(rol, filtros = {}) {
    let query = supabaseAdmin.from('perfiles').select('*').eq('rol', rol);
    if (filtros.activo !== undefined) query = query.eq('activo', filtros.activo);
    if (filtros.estado) query = query.eq('estado', filtros.estado);
    const { data, error } = await query;
    if (error) throw new Error(`Error al buscar por rol: ${error.message}`);
    return data;
  }

  async buscarAcopiosCercanos(lat, lon, radioKm = 50) {
    const { data, error } = await supabaseAdmin.from('perfiles').select('*').eq('rol', 'centro_acopio').eq('activo', true).not('lat', 'is', null).not('lon', 'is', null);
    if (error) throw new Error(`Error al buscar acopios: ${error.message}`);
    if (data && lat && lon) {
      return data.filter(acopio => { const distancia = this._calcularDistancia(lat, lon, acopio.lat, acopio.lon); return distancia <= radioKm; })
        .map(acopio => ({ ...acopio, distancia: this._calcularDistancia(lat, lon, acopio.lat, acopio.lon) })).sort((a, b) => a.distancia - b.distancia);
    }
    return data;
  }

  _calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; const dLat = this._toRad(lat2 - lat1); const dLon = this._toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(this._toRad(lat1))*Math.cos(this._toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); return R * c;
  }

  _toRad(degrees) { return degrees * (Math.PI / 180); }

  async actualizarEstado(userId, activo) {
    const { data, error } = await supabaseAdmin.from('perfiles').update({ activo }).eq('user_id', userId).select().single();
    if (error) throw new Error(`Error al actualizar estado: ${error.message}`);
    return data;
  }

  async contarPorRol() {
    const { data, error } = await supabaseAdmin.from('perfiles').select('rol, count').eq('activo', true);
    if (error) throw new Error(`Error al contar usuarios: ${error.message}`);
    const conteo = {};
    if (data) data.forEach(row => { conteo[row.rol] = (conteo[row.rol] || 0) + 1; });
    return conteo;
  }
}

module.exports = PerfilRepository;