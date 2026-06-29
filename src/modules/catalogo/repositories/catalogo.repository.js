// @build: 2026-06-30.01-00-00 | id: B6-CAT-REPO-V4 | desc: Sugerencias trigramas, persistencia de "Otro" agregando presentaciones
const supabase = require('../../../config/supabase');

class CatalogoRepository {
  async buscarItems({ q, id, categoria_id, modulo }) {
    let query = supabase.from('catalogo_items').select(`
      *,
      categoria:catalogo_categorias(*),
      presentaciones:catalogo_presentaciones(*)
    `).eq('activo', true);

    if (id) {
      query = query.eq('id', id).single();
      const { data, error } = await query;
      if (error) throw new Error(`Error al buscar item por ID: ${error.message}`);
      return { data, sugerencias: [] };
    }

    if (q) {
      query = query.ilike('nombre_normalizado', `%${q}%`);
    }
    if (categoria_id) {
      query = query.eq('categoria_id', categoria_id);
    }
    if (modulo) {
      query = query.eq('categoria.modulo', modulo);
    }

    const { data, error } = await query.order('nombre_normalizado').limit(20);
    if (error) throw new Error(`Error al buscar items: ${error.message}`);

    // Si no hay resultados y hay término de búsqueda, usar trigramas para sugerencias
    let sugerencias = [];
    if (q && data.length === 0) {
      const { data: similares, error: errorSim } = await supabase.rpc('buscar_similares', { termino: q });
      if (!errorSim && similares) {
        sugerencias = similares;
      }
    }

    return { data, sugerencias };
  }

  async crearItem(datos, userId) {
    const { nombre_generico, categoria_id, requiere_vencimiento, presentaciones } = datos;
    const nombre_normalizado = nombre_generico.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

    // Verificar si el ítem ya existe
    const { data: existente } = await supabase.from('catalogo_items').select('id').eq('nombre_normalizado', nombre_normalizado).maybeSingle();
    
    if (existente) {
      // Agregar nuevas presentaciones al ítem existente
      for (const pres of presentaciones) {
        const { error: errorInsert } = await supabase
          .from('catalogo_presentaciones')
          .insert({
            item_id: existente.id,
            tipo: pres.tipo,
            valor: pres.valor,
            unidad_sugerida: pres.unidad_sugerida
          });
        if (errorInsert) throw new Error(`Error al agregar presentación: ${errorInsert.message}`);
      }
      return { id: existente.id, mensaje: 'Presentaciones agregadas a ítem existente' };
    }

    // Crear nuevo ítem con RPC
    const { data: nuevoItem, error } = await supabase.rpc('crear_item_catalogo', {
      _nombre_generico: nombre_generico.trim(),
      _nombre_normalizado: nombre_normalizado,
      _categoria_id: categoria_id,
      _requiere_vencimiento: requiere_vencimiento || false,
      _creado_por: userId,
      _presentaciones: presentaciones
    });

    if (error) throw new Error(`Error al crear item: ${error.message}`);
    return nuevoItem;
  }

  async listarCategorias() {
    const { data, error } = await supabase
      .from('catalogo_categorias')
      .select('*')
      .order('nombre');
    if (error) throw new Error(`Error al listar categorías: ${error.message}`);
    return data;
  }
}

module.exports = CatalogoRepository;