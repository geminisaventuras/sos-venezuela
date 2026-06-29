// @build: 2026-06-28.21-05-00 | id: B4-ENT-REPO-ATOMICO-R1 | backup: entrega.repository.js.backup-20260628-210500 | desc: Delegada creación de entrega a RPC atómica crear_entrega_atomica
const supabase = require('../../../config/supabase');

class EntregaRepository {
  async crearConTransaccion({ idempotencyKey, voluntario_telefono, necesidad_id, donacion_id }) {
    // Delegar completamente a la función RPC atómica
    const { data, error } = await supabase.rpc('crear_entrega_atomica', {
      _idempotency_key: idempotencyKey,
      _voluntario_telefono: voluntario_telefono,
      _necesidad_id: necesidad_id || null,
      _donacion_id: donacion_id || null
    });

    if (error) {
      throw new Error(error.message || 'Error en entrega');
    }

    return data; // { idempotente: bool, id: uuid }
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
    const { data: entregas, error } = await supabase
      .from('entregas')
      .select('*')
      .eq('voluntario_telefono', telefono)
      .order('fecha_creacion', { ascending: false });

    if (error) throw new Error(`Error al consultar entregas: ${error.message}`);
    if (!entregas || entregas.length === 0) return [];

    const enriquecidas = await Promise.all(
      entregas.map(async (entrega) => {
        if (entrega.donacion_id) {
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