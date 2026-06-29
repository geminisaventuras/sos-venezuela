// @build: 2026-06-29.14-05-00 | id: UTIL-CAT-01 | desc: Utilidad compartida para upsert en catálogo unificado
const supabaseAdmin = require('../config/supabase');

const catalogoHelper = {
  /**
   * Busca o crea un ítem en catalogo_items, devolviendo su ID.
   * @param {string} nombreDetalle - Nombre del insumo (será normalizado)
   * @param {string} unidad - Unidad sugerida
   * @param {string} tipo - Tipo general del insumo (para mapear a categoría)
   * @returns {Promise<string>} ID del ítem en catalogo_items
   */
  async upsertCatalogo(nombreDetalle, unidad, tipo) {
    const nombreMostrar = nombreDetalle.trim();
    const nombreNormalizado = nombreMostrar.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ').trim();

    const { data: existente } = await supabaseAdmin
      .from('catalogo_items')
      .select('id')
      .eq('nombre_normalizado', nombreNormalizado)
      .maybeSingle();

    if (existente) return existente.id;

    const categoria = this._mapearCategoria(tipo);
    const { data: nuevo, error: errorInsert } = await supabaseAdmin
      .from('catalogo_items')
      .insert({
        nombre_generico: nombreMostrar,
        nombre_normalizado: nombreNormalizado,
        categoria_id: null, // Se asigna posteriormente si es necesario
        requiere_vencimiento: false
      })
      .select('id')
      .single();

    if (errorInsert) throw new Error(`No se pudo crear el insumo en catálogo: ${errorInsert.message}`);
    return nuevo.id;
  },

  _mapearCategoria(tipo) {
    const mapa = {
      'agua_potable': 'agua',
      'alimentos_no_perecibles': 'alimentos',
      'medicinas': 'medicinas',
      'colchonetas': 'colchonetas',
      'ropa': 'ropa',
      'calzado': 'calzado',
      'material_medico': 'material_medico',
      'equipos': 'equipos',
      'higiene': 'higiene',
      'otros': 'otros'
    };
    return mapa[tipo] || 'otros';
  }
};

module.exports = catalogoHelper;