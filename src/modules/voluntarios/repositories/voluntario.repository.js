// @build: 2026-06-29.14-15-00 | id: B2-VOL-REPO-REFACTOR | desc: Uso de utilidad geo compartida
const supabase = require('../../../config/supabase');
const geo = require('../../../utils/geo');

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
        const distancia = geo.calcularDistancia(lat, lon, necesidad.lat, necesidad.lon);
        return { ...necesidad, distancia_km: distancia };
      })
      .filter(necesidad => necesidad.distancia_km <= radioKm)
      .sort((a, b) => a.distancia_km - b.distancia_km);
  }

  async findDonacionesPendientes() {
    const { data, error } = await supabase
      .from('donaciones')
      .select('*, detalle_donacion(*, catalogo_items(nombre_generico))')
      .eq('modo_entrega', 'recogida')
      .eq('estado', 'ofrecida')
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`Error al buscar donaciones pendientes: ${error.message}`);
    return data;
  }
}

module.exports = VoluntarioRepository;