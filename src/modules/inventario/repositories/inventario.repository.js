// @build: 2026-06-29.14-25-00 | id: B10-INV-REPO-REFACTOR | desc: Uso de utilidad catalogo-helper compartida
const supabaseAdmin = require('../../../config/supabase');
const crypto = require('crypto');
const catalogoHelper = require('../../../utils/catalogo-helper');

class InventarioRepository {
  async _buscarInsumoPorId(insumoId) {
    if (!insumoId || insumoId === 'nuevo' || insumoId === '00000000-0000-0000-0000-000000000000') return null;
    const { data } = await supabaseAdmin.from('catalogo_items').select('*').eq('id', insumoId).maybeSingle();
    return data;
  }

  async sumarStock({ acopio_id, insumo_id, tipo, detalle, unidad, cantidad, fecha_vencimiento, lote_id }) {
    const insumoExistente = await this._buscarInsumoPorId(insumo_id);
    let insumoIdReal = insumoExistente ? insumo_id : await catalogoHelper.upsertCatalogo(detalle, unidad, tipo);
    const lote = lote_id || crypto.randomUUID();

    const { data: existente, error: errorBusqueda } = await supabaseAdmin
      .from('inventario_acopio')
      .select('id, cantidad')
      .eq('acopio_id', acopio_id)
      .eq('insumo_id', insumoIdReal)
      .eq('lote_id', lote)
      .maybeSingle();

    if (errorBusqueda) throw new Error(`Error al buscar inventario: ${errorBusqueda.message}`);

    if (existente) {
      const nuevaCantidad = parseFloat(existente.cantidad) + parseFloat(cantidad);
      const { error: errorUpdate } = await supabaseAdmin
        .from('inventario_acopio')
        .update({ cantidad: nuevaCantidad, actualizado_en: new Date().toISOString() })
        .eq('id', existente.id);
      if (errorUpdate) throw new Error(`Error al actualizar inventario: ${errorUpdate.message}`);
      return existente.id;
    } else {
      const payload = { acopio_id, insumo_id: insumoIdReal, tipo, detalle, unidad, cantidad, fecha_vencimiento, lote_id: lote };
      const { data: nuevo, error: errorInsert } = await supabaseAdmin
        .from('inventario_acopio')
        .insert(payload)
        .select('id')
        .single();
      if (errorInsert) throw new Error(`Error al insertar inventario: ${errorInsert.message}`);
      return nuevo.id;
    }
  }

  async restarStock(acopioId, items) {
    const resultados = [];
    for (const item of items) {
      const { data: fila, error: errorLectura } = await supabaseAdmin
        .from('inventario_acopio')
        .select('id, cantidad, insumo_id, tipo, detalle, unidad, lote_id, fecha_vencimiento')
        .eq('id', item.inventario_id)
        .eq('acopio_id', acopioId)
        .single();
      if (errorLectura || !fila) throw new Error(`Item de inventario no encontrado: ${item.inventario_id}`);
      const nuevaCantidad = parseFloat(fila.cantidad) - parseFloat(item.cantidad);
      if (nuevaCantidad < 0) throw new Error(`Stock insuficiente para item ${fila.detalle}. Actual: ${fila.cantidad}, solicitado: ${item.cantidad}`);
      const { error: errorUpdate } = await supabaseAdmin
        .from('inventario_acopio')
        .update({ cantidad: nuevaCantidad, actualizado_en: new Date().toISOString() })
        .eq('id', fila.id);
      if (errorUpdate) throw new Error(`Error al descontar inventario: ${errorUpdate.message}`);
      resultados.push({ ...fila, cantidad_restante: nuevaCantidad });
    }
    return resultados;
  }

  async obtenerInventario(acopioId) {
    const { data, error } = await supabaseAdmin
      .from('inventario_acopio')
      .select('*, catalogo_items(nombre_generico)')
      .eq('acopio_id', acopioId)
      .order('fecha_vencimiento', { ascending: true, nullsFirst: false });
    if (error) throw new Error(`Error al consultar inventario: ${error.message}`);
    return data;
  }

  async obtenerInventarioNacional() {
    const { data, error } = await supabaseAdmin
      .from('inventario_acopio')
      .select('*, catalogo_items(nombre_generico), perfiles!inner(nombre_punto)');
    if (error) throw new Error(`Error al consultar inventario nacional: ${error.message}`);
    return data;
  }
}

module.exports = InventarioRepository;