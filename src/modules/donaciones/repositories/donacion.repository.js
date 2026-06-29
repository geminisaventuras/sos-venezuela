// @build: 2026-06-29.14-20-00 | id: B3-DON-REPO-REFACTOR | desc: Uso de utilidad catalogo-helper compartida
const supabase = require('../../../config/supabase');
const catalogoHelper = require('../../../utils/catalogo-helper');

class DonacionRepository {
  constructor() {
    this.supabase = supabase;
  }

  async crearConTransaccion({ idempotencyKey, centro_acopio, items, donante, modo_entrega, direccion_recogida, lat_recogida, lon_recogida }) {
    const { data: existente } = await this.supabase
      .from('donaciones')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (existente) return { idempotente: true, id: existente.id };

    const { data: acopioData } = await this.supabase
      .from('perfiles')
      .select('user_id')
      .eq('nombre_punto', centro_acopio.nombre)
      .eq('rol', 'centro_acopio')
      .maybeSingle();

    let acopioId = acopioData?.user_id;
    if (!acopioId) {
      const { data: primerAcopio } = await this.supabase
        .from('perfiles')
        .select('user_id')
        .eq('rol', 'centro_acopio')
        .eq('activo', true)
        .limit(1)
        .single();
      acopioId = primerAcopio?.user_id;
    }

    if (!acopioId) throw new Error('No se encontró un centro de acopio activo');

    let donanteId = null;
    if (donante) {
      const { data: donanteData } = await this.supabase
        .from('perfiles')
        .select('user_id')
        .eq('nombre_punto', donante)
        .eq('rol', 'donante')
        .maybeSingle();
      donanteId = donanteData?.user_id || null;
    }

    const { data: nuevaDonacion, error: errorDonacion } = await this.supabase
      .from('donaciones')
      .insert({
        idempotency_key: idempotencyKey,
        donante_id: donanteId,
        acopio_destino_id: acopioId,
        modo_entrega: modo_entrega || 'propia',
        estado: 'ofrecida',
        creado_en: new Date().toISOString(),
        direccion_recogida: direccion_recogida || null,
        lat_recogida: lat_recogida ? parseFloat(lat_recogida) : null,
        lon_recogida: lon_recogida ? parseFloat(lon_recogida) : null
      })
      .select('id')
      .single();

    if (errorDonacion) throw new Error(`Error al crear donación: ${errorDonacion.message}`);

    for (const item of items) {
      let insumoId = item.insumo_id;
      if (!insumoId || insumoId === 'nuevo' || insumoId === '00000000-0000-0000-0000-000000000000') {
        insumoId = await catalogoHelper.upsertCatalogo(item.detalle, item.unidad, item.tipo);
      }

      const { error: errorDetalle } = await this.supabase
        .from('detalle_donacion')
        .insert({
          donacion_id: nuevaDonacion.id,
          insumo_id: insumoId,
          cantidad: item.cantidad,
          unidad: item.unidad
        });
      
      if (errorDetalle) throw new Error(`Error al insertar detalle: ${errorDetalle.message}`);
    }

    return { idempotente: false, id: nuevaDonacion.id };
  }

  async findByAcopio(acopioId) {
    const { data, error } = await this.supabase
      .from('donaciones')
      .select('*, detalle_donacion(*, catalogo_items(nombre_generico))')
      .eq('acopio_destino_id', acopioId)
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`Error al listar donaciones: ${error.message}`);
    return data;
  }

  async findById(donacionId) {
    const { data, error } = await this.supabase
      .from('donaciones')
      .select('*, detalle_donacion(*)')
      .eq('id', donacionId)
      .single();
    if (error) throw new Error(`Donación no encontrada: ${error.message}`);
    return data;
  }

  async confirmarRecepcion(donacionId, { cantidad_rechazada, motivo_rechazo }) {
    const donacion = await this.findById(donacionId);
    if (!donacion) throw new Error('Donación no encontrada');
    if (donacion.estado === 'recibida') throw new Error('Esta donación ya fue confirmada');
    const { error } = await this.supabase.from('donaciones').update({
      estado: 'recibida', fecha_recibida: new Date().toISOString(), cantidad_rechazada, motivo_rechazo: motivo_rechazo || null
    }).eq('id', donacionId);
    if (error) throw new Error(`Error al confirmar donación: ${error.message}`);
    return { id: donacionId, estado: 'recibida' };
  }

  async confirmarRecogida(donacionId) {
    const donacion = await this.findById(donacionId);
    if (!donacion) throw new Error('Donación no encontrada');
    if (donacion.estado !== 'asignada') throw new Error('Estado inválido para confirmar recogida');
    const { error } = await this.supabase.from('donaciones').update({ estado: 'en_transito_a_acopio' }).eq('id', donacionId);
    if (error) throw new Error(`Error al confirmar recogida: ${error.message}`);
    return { id: donacionId, estado: 'en_transito_a_acopio' };
  }

  async modificarDonacion(donacionId, userId, { detalle, cantidad, unidad }) {
    const donacion = await this.findById(donacionId);
    if (!donacion) throw new Error('Donación no encontrada');
    if (donacion.estado !== 'ofrecida') throw new Error('Solo se pueden modificar donaciones en estado ofrecida');
    if (donacion.donante_id !== userId) throw new Error('No autorizado');

    let insumoId = null;
    if (detalle) {
      insumoId = await catalogoHelper.upsertCatalogo(detalle, unidad || 'unidades', 'otros');
    }

    if (donacion.detalle_donacion && donacion.detalle_donacion.length > 0) {
      const detalleId = donacion.detalle_donacion[0].id;
      const updateData = {};
      if (insumoId) updateData.insumo_id = insumoId;
      if (cantidad) updateData.cantidad = cantidad;
      if (unidad) updateData.unidad = unidad;
      
      const { error } = await this.supabase
        .from('detalle_donacion')
        .update(updateData)
        .eq('id', detalleId);
      if (error) throw new Error(`Error al modificar detalle: ${error.message}`);
    }

    return { id: donacionId, estado: donacion.estado };
  }

  async cancelarDonacion(donacionId, userId) {
    const donacion = await this.findById(donacionId);
    if (!donacion) throw new Error('Donación no encontrada');
    if (donacion.estado !== 'ofrecida') throw new Error('Solo se pueden cancelar donaciones en estado ofrecida');
    if (donacion.donante_id !== userId) throw new Error('No autorizado');

    const { error } = await this.supabase
      .from('donaciones')
      .update({ estado: 'cancelada' })
      .eq('id', donacionId);
    if (error) throw new Error(`Error al cancelar donación: ${error.message}`);
    return { id: donacionId, estado: 'cancelada' };
  }

  async obtenerTrazabilidad(donacionId) {
    const { data: donacion, error: errorDonacion } = await this.supabase
      .from('donaciones')
      .select('*, detalle_donacion(*, catalogo_items(nombre_generico)), perfiles!donaciones_donante_id_fkey(nombre_punto)')
      .eq('id', donacionId)
      .single();
    
    if (errorDonacion) throw new Error(`Error al obtener donación: ${errorDonacion.message}`);
    
    const { data: inventarios, error: errorInventario } = await this.supabase
      .from('inventario_acopio')
      .select('*')
      .eq('lote_id', donacionId);
    
    if (errorInventario) throw new Error(`Error al buscar inventario: ${errorInventario.message}`);
    
    const despachos = [];
    if (inventarios && inventarios.length > 0) {
      for (const inv of inventarios) {
        const { data: despachosDelItem } = await this.supabase
          .from('despachos')
          .select('*, necesidades(punto, tipo_punto), perfiles!despachos_voluntario_id_fkey(nombre_punto)')
          .eq('lote_id_origen', inv.lote_id || donacionId)
          .limit(10);
        
        if (despachosDelItem) {
          for (const despacho of despachosDelItem) {
            despachos.push({
              id: despacho.id,
              estado: despacho.estado,
              fecha_salida: despacho.fecha_salida,
              fecha_llegada: despacho.fecha_llegada,
              fecha_confirmacion: despacho.fecha_confirmacion,
              destino: despacho.necesidades?.punto || 'No especificado',
              tipo_destino: despacho.necesidades?.tipo_punto || 'refugio',
              voluntario: despacho.perfiles?.nombre_punto || 'No asignado',
              items_despachados: despacho.items_despachados
            });
          }
        }
      }
    }
    
    const timeline = [
      {
        estado: 'ofrecida',
        fecha: donacion.creado_en,
        descripcion: 'Donación registrada por el donante',
        icono: 'fa-hand-holding-heart'
      }
    ];
    
    if (donacion.estado === 'asignada' || donacion.estado === 'en_transito_a_acopio' || donacion.estado === 'recibida' || donacion.estado === 'distribuida') {
      timeline.push({
        estado: 'asignada',
        fecha: donacion.creado_en,
        descripcion: 'Transportista asignado para recolección',
        icono: 'fa-user-check'
      });
    }
    
    if (donacion.estado === 'en_transito_a_acopio' || donacion.estado === 'recibida' || donacion.estado === 'distribuida') {
      timeline.push({
        estado: 'en_transito_a_acopio',
        fecha: donacion.fecha_recibida || donacion.creado_en,
        descripcion: 'Recogida confirmada, en camino al acopio',
        icono: 'fa-truck-fast'
      });
    }
    
    if (donacion.estado === 'recibida' || donacion.estado === 'distribuida') {
      timeline.push({
        estado: 'recibida',
        fecha: donacion.fecha_recibida,
        descripcion: donacion.cantidad_rechazada ? `Recibida con ${donacion.cantidad_rechazada} unidades rechazadas` : 'Recibida y verificada en el acopio',
        icono: 'fa-check-circle'
      });
    }
    
    if (donacion.estado === 'cancelada') {
      timeline.push({
        estado: 'cancelada',
        fecha: donacion.creado_en,
        descripcion: 'Donación cancelada por el donante',
        icono: 'fa-ban'
      });
    }
    
    for (const despacho of despachos) {
      if (despacho.estado === 'entregado') {
        timeline.push({
          estado: 'distribuida',
          fecha: despacho.fecha_confirmacion || despacho.fecha_llegada,
          descripcion: `Entregado a ${despacho.destino} (${despacho.tipo_destino}) por voluntario ${despacho.voluntario}`,
          icono: 'fa-flag-checkered'
        });
      } else if (despacho.estado === 'en_transito_a_destino') {
        timeline.push({
          estado: 'en_transito_a_destino',
          fecha: despacho.fecha_salida,
          descripcion: `En camino a ${despacho.destino} con voluntario ${despacho.voluntario}`,
          icono: 'fa-truck-fast'
        });
      }
    }
    
    return {
      donacion_id: donacion.id,
      donante: donacion.perfiles?.nombre_punto || 'Donante anónimo',
      insumos: donacion.detalle_donacion?.map(d => ({
        nombre: d.catalogo_items?.nombre_generico || d.detalle || 'Insumo',
        cantidad: d.cantidad,
        unidad: d.unidad
      })) || [],
      estado_actual: donacion.estado,
      timeline: timeline.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
      despachos: despachos
    };
  }

  async findByDonante(userId) {
    const { data, error } = await supabase
      .from('donaciones')
      .select('*, detalle_donacion(*, catalogo_items(nombre_generico)), acopio_destino:perfiles!donaciones_acopio_destino_id_fkey(nombre_punto)')
      .eq('donante_id', userId)
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`Error al obtener historial: ${error.message}`);
    return data;
  }
}

module.exports = DonacionRepository;