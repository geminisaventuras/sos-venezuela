// @build: 2026-06-26.23-00-00 | id: B6-CAT | desc: Repositorio del catálogo
const supabase = require('../../../config/supabase');

class CatalogoRepository {
  async buscarPorTipo(tipoGeneral) {
    const { data, error } = await supabase
      .from('insumos_catalogo')
      .select('nombre_detalle')
      .eq('tipo_general', tipoGeneral)
      .order('nombre_detalle', { ascending: true });
    if (error) throw new Error(`Error al consultar catálogo: ${error.message}`);
    return data.map(item => item.nombre_detalle);
  }

  async upsert(tipoGeneral, nombreDetalle, userId) {
    const { error } = await supabase.rpc('upsert_insumo_catalogo', {
      _tipo_general: tipoGeneral,
      _nombre_detalle: nombreDetalle,
      _user_id: userId
    });
    if (error) throw new Error(`Error al actualizar catálogo: ${error.message}`);
  }
}

module.exports = CatalogoRepository;



