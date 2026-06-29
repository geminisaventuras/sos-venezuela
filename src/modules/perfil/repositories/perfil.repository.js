// @build: 2026-06-29.14-10-00 | id: B30-PERFIL-REPO-REFACTOR | desc: Uso de utilidad geo compartida
const supabaseAdmin = require('../../../config/supabase');
const geo = require('../../../utils/geo');

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
  const { data, error } = await supabaseAdmin.rpc('buscar_acopios_cercanos', {
    lat_consulta: lat,
    lon_consulta: lon,
    radio_km: radioKm
  });
  if (error) throw new Error(`Error al buscar acopios cercanos: ${error.message}`);
  // La función SQL devuelve 'distancia_km' pero el frontend espera 'distancia'
  return (data || []).map(item => ({
    ...item,
    distancia: item.distancia_km
  }));
}

  async actualizarEstado(userId, activo) {
    const { data, error } = await supabaseAdmin.from('perfiles').update({ activo }).eq('user_id', userId).select().single();
    if (error) throw new Error(`Error al actualizar estado: ${error.message}`);
    return data;
  }

  async contarPorRol() {
    const { data, error } = await supabaseAdmin.from('perfiles').select('rol').eq('activo', true);
    if (error) throw new Error(`Error al contar usuarios: ${error.message}`);
    const conteo = {};
    if (data) data.forEach(row => { conteo[row.rol] = (conteo[row.rol] || 0) + 1; });
    return conteo;
  }
}

module.exports = PerfilRepository;