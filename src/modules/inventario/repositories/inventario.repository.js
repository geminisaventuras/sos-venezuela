// @build: 2026-06-28.06-00-00 | id: B10-INV-REPO-UPSERT | desc: Repositorio con upsert en catálogo y lote automático
const supabaseAdmin = require('../../../config/supabase');
const crypto = require('crypto');

class InventarioRepository {
  async _buscarInsumoPorId(insumoId) {
    if (!insumoId || insumoId === 'nuevo' || insumoId === '00000000-0000-0000-0000-000000000000') return null;
    const { data } = await supabaseAdmin.from('catalogo_insumos').select('*').eq('id', insumoId).maybeSingle();
    return data;
  }

  async _upsertCatalogo(detalle, unidad, tipo) {
    const nombreMostrar = detalle.trim();
    const nombreNormalizado = nombreMostrar.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    const { data: existente } = await supabaseAdmin.from('catalogo_insumos').select('id').eq('nombre_normalizado', nombreNormalizado).maybeSingle();
    if (existente) return existente.id;
    const categoria = this._mapearCategoria(tipo);
    const { data: nuevo, error: errorInsert } = await supabaseAdmin.from('catalogo_insumos').insert({
      nombre_mostrar: nombreMostrar,
      nombre_normalizado: nombreNormalizado,
      categoria: categoria,
      tipo_general: tipo,
      unidad_sugerida: unidad,
      requiere_vencimiento: false
    }).select('id').single();
    if (errorInsert) throw new Error(`No se pudo crear el insumo en el catálogo: ${errorInsert.message}`);
    return nuevo.id;
  }

  _mapearCategoria(tipo) {
    const mapa = { 'agua_potable': 'agua', 'alimentos_no_perecibles': 'alimentos', 'medicinas': 'medicinas', 'colchonetas': 'colchonetas', 'ropa': 'ropa', 'calzado': 'calzado', 'material_medico': 'material_medico', 'equipos': 'equipos', 'higiene': 'higiene', 'otros': 'otros' };
    return mapa[tipo] || 'otros';
  }

  async sumarStock({ acopio_id, insumo_id, tipo, detalle, unidad, cantidad, fecha_vencimiento, lote_id }) {
    const insumoExistente = await this._buscarInsumoPorId(insumo_id);
    let insumoIdReal = insumoExistente ? insumo_id : await this._upsertCatalogo(detalle, unidad, tipo);
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
      .select('*, catalogo_insumos(nombre_mostrar)')
      .eq('acopio_id', acopioId)
      .order('fecha_vencimiento', { ascending: true, nullsFirst: false });
    if (error) throw new Error(`Error al consultar inventario: ${error.message}`);
    return data;
  }

  async obtenerInventarioNacional() {
    const { data, error } = await supabaseAdmin
      .from('inventario_acopio')
      .select('*, catalogo_insumos(nombre_mostrar), perfiles!inner(nombre_punto)');
    if (error) throw new Error(`Error al consultar inventario nacional: ${error.message}`);
    return data;
  }
}

module.exports = InventarioRepository;