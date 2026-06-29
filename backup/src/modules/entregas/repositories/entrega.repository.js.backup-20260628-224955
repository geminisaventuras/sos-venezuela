// @build: 2026-06-30.08-00-00 | id: B4-ENT-REPO-PERFILES | desc: Repositorio de entregas que devuelve perfiles del donante con el formato esperado por el frontend
const supabase = require('../../../config/supabase');

class EntregaRepository {
  async crearConTransaccion({ idempotencyKey, voluntario_telefono, necesidad_id, donacion_id }) {
    const { data: existente } = await supabase
      .from('entregas')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (existente) return { idempotente: true, id: existente.id };

    const { data: voluntario } = await supabase
      .from('voluntarios')
      .select('user_id')
      .eq('telefono', voluntario_telefono)
      .single();
    if (!voluntario) throw new Error('Voluntario no encontrado');

    const { data: nuevaEntrega, error } = await supabase
      .from('entregas')
      .insert({
        idempotency_key: idempotencyKey,
        voluntario_telefono,
        necesidad_id: necesidad_id || null,
        donacion_id: donacion_id || null,
        estado: 'en_camino',
        fecha_creacion: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw new Error(`Error al crear entrega: ${error.message}`);

    if (donacion_id) {
      await supabase
        .from('donaciones')
        .update({
          estado: 'asignada',
          voluntario_recoleccion_id: voluntario.user_id
        })
        .eq('id', donacion_id);
    }

    if (necesidad_id) {
      await supabase
        .from('despachos')
        .update({ voluntario_id: voluntario.user_id, estado: 'en_transito_a_destino' })
        .eq('necesidad_id', necesidad_id)
        .eq('estado', 'preparando');
    }

    return { idempotente: false, id: nuevaEntrega.id };
  }

  async actualizarEstado(entregaId, nuevoEstado) {
    const { data, error } = await supabase.rpc('actualizar_estado_entrega', {
      _entrega_id: entregaId,
      _nuevo_estado: nuevoEstado,
    });
    if (error) throw new Error(`Error al actualizar entrega: ${error.message}`);
    return data;
  }

  async findByVoluntario(telefono) {
    // Obtener las entregas básicas
    const { data: entregas, error } = await supabase
      .from('entregas')
      .select('*')
      .eq('voluntario_telefono', telefono)
      .order('fecha_creacion', { ascending: false });

    if (error) throw new Error(`Error al consultar entregas: ${error.message}`);
    if (!entregas || entregas.length === 0) return [];

    // Enriquecer cada entrega con datos de la donación o necesidad
    const enriquecidas = await Promise.all(
      entregas.map(async (entrega) => {
        if (entrega.donacion_id) {
          // Join a perfiles usando la foreign key correcta, sin alias, para que el frontend reciba "perfiles.nombre_punto"
          const { data: donacion } = await supabase
            .from('donaciones')
            .select('*, perfiles!donaciones_donante_id_fkey(nombre_punto, telefono)')
            .eq('id', entrega.donacion_id)
            .single();

          return {
            ...entrega,
            tipo_servicio: 'recoleccion',
            detalle: {
              ...donacion,
              // El frontend espera "perfiles.nombre_punto" y "perfiles.telefono", que ya vienen en el join
              direccion: donacion?.direccion_recogida || 'Sin dirección',
              lat: donacion?.lat_recogida,
              lon: donacion?.lon_recogida
            }
          };
        } else if (entrega.necesidad_id) {
          const { data: necesidad } = await supabase
            .from('necesidades')
            .select('*')
            .eq('id', entrega.necesidad_id)
            .single();

          return {
            ...entrega,
            tipo_servicio: 'distribucion',
            detalle: {
              ...necesidad,
              perfiles: {
                nombre_punto: necesidad?.punto || 'Destino',
                telefono: necesidad?.contacto || 'N/A'
              },
              direccion: necesidad?.punto || 'Sin dirección',
              lat: necesidad?.lat,
              lon: necesidad?.lon
            }
          };
        }
        return { ...entrega, tipo_servicio: 'desconocido', detalle: null };
      })
    );

    return enriquecidas;
  }
}

module.exports = EntregaRepository;