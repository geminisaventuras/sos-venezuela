// @build: 2026-06-29.17-00-00 | id: B2-VOL-REPO-UPSERT-FIX | desc: upsert sobre user_id, no sobre teléfono
const supabase = require('../../../config/supabase');

class VoluntarioRepository {
  async upsert(datos) {
    const { telefono, nombre, tipo_vehiculo, capacidad_carga, lat, lon, activo, user_id } = datos;
    const { data, error } = await supabase
      .from('voluntarios')
      .upsert(
        { telefono, nombre, tipo_vehiculo, capacidad_carga, lat, lon, activo, user_id },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();
    if (error) throw new Error(`Error al registrar voluntario: ${error.message}`);
    return data;
  }

  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('voluntarios')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`Error al obtener voluntario: ${error.message}`);
    return data;
  }

  async findNecesidadesCercanas(lat, lon, radioKm) {
    const { data, error } = await supabase
      .from('necesidades')
      .select('*')
      .eq('estado', 'pendiente')
      .not('lat', 'is', null)
      .not('lon', 'is', null);
    if (error) throw new Error(`Error al buscar necesidades: ${error.message}`);
    if (!data || data.length === 0) return [];
    return data
      .map(necesidad => {
        const distancia = this._calcularDistancia(lat, lon, necesidad.lat, necesidad.lon);
        return { ...necesidad, distancia_km: distancia };
      })
      .filter(necesidad => necesidad.distancia_km <= radioKm)
      .sort((a, b) => a.distancia_km - b.distancia_km);
  }

  async findDonacionesPendientes() {
    const { data, error } = await supabase
      .from('donaciones')
      .select('*, detalle_donacion(*, catalogo_insumos(nombre_mostrar))')
      .eq('modo_entrega', 'recogida')
      .eq('estado', 'ofrecida')
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`Error al buscar donaciones pendientes: ${error.message}`);
    return data;
  }

  _calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(this._toRad(lat1))*Math.cos(this._toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  _toRad(degrees) { return degrees * (Math.PI / 180); }
}

module.exports = VoluntarioRepository;