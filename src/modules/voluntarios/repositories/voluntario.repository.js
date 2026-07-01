// src/modules/voluntarios/repositories/voluntario.repository.js
// @build: 2026-06-29.17-55-00 | id: B2-VOL-REPO-PRODUCTION-FIX | backup: voluntario.repository.js.backup-20260629-175500 | desc: Ajuste a columnas de producción reales y sincronización atómica con tabla perfiles
const supabase = require('../../../config/supabase');
const geo = require('../../../utils/geo');

class VoluntarioRepository {
  async upsert(datos) {
    const { telefono, nombre, tipo_vehiculo, capacidad_carga, lat, lon, activo, user_id } = datos;

    // 1. Sincronizar primero la tabla maestra 'perfiles' que consume el middleware de auth
    const { error: errorPerfil } = await supabase
      .from('perfiles')
      .update({
        telefono,
        nombre_punto: nombre,
        lat,
        lon
      })
      .eq('user_id', user_id);

    if (errorPerfil) throw new Error(`Error al sincronizar perfil maestro: ${errorPerfil.message}`);

    // 2. Realizar upsert en la tabla específica 'voluntarios' usando coincidencia por user_id
    // Primero verificamos si ya existe el registro para evitar fallos de restricciones en Supabase
    const { data: existente } = await supabase
      .from('voluntarios')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle();

    let resultado;
    if (existente) {
      const { data, error } = await supabase
        .from('voluntarios')
        .update({
          telefono,
          nombre,
          tipo_vehiculo,
          capacidad_carga,
          lat,
          lon,
          activo,
          actualizado_en: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .select('*')
        .single();
      
      if (error) throw new Error(`Error al actualizar datos de voluntario: ${error.message}`);
      resultado = data;
    } else {
      const { data, error } = await supabase
        .from('voluntarios')
        .insert({
          user_id,
          telefono,
          nombre,
          tipo_vehiculo,
          capacidad_carga,
          lat,
          lon,
          activo,
          actualizado_en: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) throw new Error(`Error al insertar datos de voluntario: ${error.message}`);
      resultado = data;
    }

    return resultado;
  }

  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('voluntarios')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`Error al obtener voluntario de la BD: ${error.message}`);
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
    // Ajustado para acoplarse con la relación de la tabla 'catalogo_items' expuesta en la estructura real
    const { data, error } = await supabase
      .from('donaciones')
      .select('*, detalle_donacion(*, catalogo_items(nombre_generico)), perfiles!donaciones_donante_id_fkey(nombre_punto, telefono)')
      .eq('modo_entrega', 'recogida')
      .eq('estado', 'ofrecida')
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`Error al buscar donaciones pendientes: ${error.message}`);
    return data;
  }
}

module.exports = VoluntarioRepository;