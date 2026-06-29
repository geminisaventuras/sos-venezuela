// @build: 2026-06-30.12-00-00 | id: B11-DESP-REPO-DIRECTO | desc: Repositorio de despachos sin RPC, con inserción directa y descuento de inventario
const supabase = require('../../../config/supabase');

class DespachoRepository {
  async crear({ idempotencyKey, necesidad_id, acopio_id, items }) {
    // 1. Verificar idempotencia
    const { data: existente } = await supabase
      .from('despachos')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (existente) return { idempotente: true, id: existente.id };

    // 2. Verificar que la necesidad exista y no esté cubierta
    const { data: necesidad, error: errorNecesidad } = await supabase
      .from('necesidades')
      .select('estado, punto')
      .eq('id', necesidad_id)
      .single();
    if (errorNecesidad || !necesidad) throw new Error('Necesidad no encontrada');
    if (necesidad.estado === 'cubierta' || necesidad.estado === 'cancelacion_parcial') {
      throw new Error('La necesidad ya está cubierta o cancelada');
    }

    // 3. Validar stock y descontar inventario para cada item
    for (const item of items) {
      const { data: filaInventario, error: errorInventario } = await supabase
        .from('inventario_acopio')
        .select('id, cantidad, detalle, lote_id')
        .eq('id', item.inventario_id)
        .eq('acopio_id', acopio_id)
        .single();
      if (errorInventario || !filaInventario) {
        throw new Error(`Item de inventario no encontrado: ${item.inventario_id}`);
      }
      const nuevaCantidad = parseFloat(filaInventario.cantidad) - parseFloat(item.cantidad);
      if (nuevaCantidad < 0) {
        throw new Error(`Stock insuficiente para ${filaInventario.detalle}. Actual: ${filaInventario.cantidad}, solicitado: ${item.cantidad}`);
      }
      const { error: errorUpdate } = await supabase
        .from('inventario_acopio')
        .update({ cantidad: nuevaCantidad, actualizado_en: new Date().toISOString() })
        .eq('id', filaInventario.id);
      if (errorUpdate) throw new Error(`Error al descontar inventario: ${errorUpdate.message}`);
    }

    // 4. Insertar el despacho
    const { data: nuevoDespacho, error: errorInsert } = await supabase
      .from('despachos')
      .insert({
        idempotency_key: idempotencyKey,
        necesidad_id: necesidad_id,
        acopio_id: acopio_id,
        items_despachados: items,
        estado: 'preparando',
        creado_en: new Date().toISOString()
      })
      .select('id')
      .single();
    if (errorInsert) throw new Error(`Error al crear despacho: ${errorInsert.message}`);

    // 5. Actualizar la necesidad a 'parcial' o 'en_camino'
    await supabase
      .from('necesidades')
      .update({ estado: 'en_camino' })
      .eq('id', necesidad_id);

    return { idempotente: false, id: nuevoDespacho.id };
  }

  async actualizarEstado(despachoId, nuevoEstado, datosAdicionales = {}) {
    const { data: despacho } = await supabase
      .from('despachos')
      .select('estado, voluntario_id')
      .eq('id', despachoId)
      .single();
    if (!despacho) throw new Error('Despacho no encontrado');

    const payload = {
      estado: nuevoEstado,
      ultima_actualizacion: new Date().toISOString(),
      estado_anterior: despacho.estado
    };
    if (nuevoEstado === 'en_transito_a_destino') payload.fecha_salida = new Date().toISOString();
    if (nuevoEstado === 'entregado_pendiente_firma') payload.fecha_llegada = new Date().toISOString();
    if (nuevoEstado === 'entregado') payload.fecha_confirmacion = new Date().toISOString();
    if (datosAdicionales.foto_evidencia) payload.foto_evidencia = datosAdicionales.foto_evidencia;

    const { error } = await supabase
      .from('despachos')
      .update(payload)
      .eq('id', despachoId);
    if (error) throw new Error(`Error al actualizar despacho: ${error.message}`);

    if (datosAdicionales.incidencia) {
      await supabase.from('incidencias').insert({
        despacho_id: despachoId,
        reportado_por: despacho.voluntario_id,
        tipo: datosAdicionales.incidencia.tipo,
        descripcion: datosAdicionales.incidencia.descripcion
      });
    }
    return { id: despachoId, estado: nuevoEstado };
  }

  async findByVoluntario(voluntarioId) {
    const { data, error } = await supabase
      .from('despachos')
      .select('*, necesidades(punto, prioridad, estado)')
      .eq('voluntario_id', voluntarioId)
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`Error al consultar despachos: ${error.message}`);
    return data;
  }

  async findPendientes() {
    const { data, error } = await supabase
      .from('despachos')
      .select('*, necesidades(punto, prioridad, items, tipo_punto, lat, lon)')
      .eq('estado', 'preparando')
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`Error al consultar despachos pendientes: ${error.message}`);
    return data;
  }
}

module.exports = DespachoRepository;