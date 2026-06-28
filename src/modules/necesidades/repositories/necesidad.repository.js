// @build: 2026-06-27.04-00-00 | id: B1-NECv4 | desc: Repositorio necesidades con filtro por punto
const supabase = require('../../../config/supabase');

class NecesidadRepository {
  async crearConTransaccion({ idempotencyKey, punto, ubicacion, items, prioridad, contacto, tipo_punto }) {
    const { data: existente } = await supabase
      .from('necesidades')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (existente) return { idempotente: true, id: existente.id };

    const { data, error } = await supabase.rpc('crear_necesidad_transaccion', {
      _idempotency_key: idempotencyKey,
      _punto: punto,
      _lat: ubicacion.lat,
      _lon: ubicacion.lon,
      _items: items,
      _prioridad: prioridad,
      _contacto: contacto || null,
      _tipo_punto: tipo_punto
    });
    if (error) throw new Error(`Error en transacci?n: ${error.message}`);
    return { idempotente: false, id: data };
  }

  async findPendientes() {
    const { data, error } = await supabase
      .from('necesidades')
      .select('*')
      .eq('estado', 'pendiente')
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`Error al listar necesidades: ${error.message}`);
    return data;
  }

  async findByPunto(punto) {
    const { data, error } = await supabase
      .from('necesidades')
      .select('*')
      .eq('punto', punto)
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`Error al listar necesidades: ${error.message}`);
    return data;
  }
}

module.exports = NecesidadRepository;



