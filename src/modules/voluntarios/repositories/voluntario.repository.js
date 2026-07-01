// @build: 2026-07-01.12-00-00 | id: B2-VOL-REPO-V3 | desc: Agregado findActiveDelivery para obtener el viaje activo del conductor desde BD
const supabase = require('../../../config/supabase');
const geo = require('../../../utils/geo');

class VoluntarioRepository {
  async upsert(datos) {
    const { telefono, nombre, tipo_vehiculo, capacidad_carga, lat, lon, activo, user_id } = datos;

    const { error: errorPerfil } = await supabase
      .from('perfiles')
      .update({ telefono, nombre_punto: nombre, lat, lon })
      .eq('user_id', user_id);

    if (errorPerfil) throw new Error(`Error al sincronizar perfil maestro: ${errorPerfil.message}`);

    const { data: existente } = await supabase
      .from('voluntarios')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle();

    let resultado;
    if (existente) {
      const { data, error } = await supabase
        .from('voluntarios')
        .update({
          telefono, nombre, tipo_vehiculo, capacidad_carga, lat, lon, activo,
          actualizado_en: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .select('*')
        .single();
      if (error) throw new Error(`Error al actualizar datos de voluntario: ${error.message}`);
      resultado = data;
    } else {
      const { data, error } = await supabase
        .from('voluntarios')
        .insert({
          user_id, telefono, nombre, tipo_vehiculo, capacidad_carga, lat, lon, activo,
          actualizado_en: new Date().toISOString()
        })
        .select('*')
        .single();
      if (error) throw new Error(`Error al insertar datos de voluntario: ${error.message}`);
      resultado = data;
    }

    return resultado;
  }

  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('voluntarios')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`Error al obtener voluntario de la BD: ${error.message}`);
    return data;
  }

  async findNecesidadesCercanas(lat, lon, radioKm) {
    const { data, error } = await supabase
      .from('necesidades')
      .select('*')
      .eq('estado', 'pendiente')
      .not('lat', 'is', null)
      .not('lon', 'is', null);
    if (error) throw new Error(`Error al buscar necesidades: ${error.message}`);
    if (!data || data.length === 0) return [];

    return data
      .map(necesidad => {
        const distancia = geo.calcularDistancia(lat, lon, necesidad.lat, necesidad.lon);
        return { ...necesidad, distancia_km: distancia };
      })
      .filter(necesidad => necesidad.distancia_km <= radioKm)
      .sort((a, b) => a.distancia_km - b.distancia_km);
  }

  async findDonacionesPendientes() {
    const { data, error } = await supabase
      .from('donaciones')
      .select('*, detalle_donacion(*, catalogo_items(nombre_generico)), perfiles!donaciones_donante_id_fkey(nombre_punto, telefono)')
      .eq('modo_entrega', 'recogida')
      .eq('estado', 'ofrecida')
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`Error al buscar donaciones pendientes: ${error.message}`);
    return data;
  }

  // ✅ NUEVO MÉTODO: Buscar viaje activo del conductor
  async findActiveDelivery(telefono) {
    // Buscar entrega activa por teléfono del voluntario
    const { data: entrega, error: errorEntrega } = await supabase
      .from('entregas')
      .select('id, estado, donacion_id, necesidad_id, fecha_creacion')
      .eq('voluntario_telefono', telefono)
      .in('estado', ['asignada', 'en_camino', 'en_transito_a_acopio', 'en_transito_a_destino'])
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errorEntrega) throw new Error(`Error al buscar entrega activa: ${errorEntrega.message}`);
    if (!entrega) return null; // No hay viaje activo

    const viaje = {
      entregaId: entrega.id,
      estado: entrega.estado,
      tipo: null,
      timestamp: new Date(entrega.fecha_creacion).getTime(),
      origen: {},
      destino: {},
      productos: '',
      donacionId: entrega.donacion_id,
      despachoId: null,
      necesidadId: entrega.necesidad_id,
      nombreOrigen: '',
      nombreDestino: '',
      telefonoOrigen: '',
      telefonoDestino: ''
    };

    if (entrega.donacion_id) {
      // Recolección
      viaje.tipo = 'recoleccion';

      const { data: donacion, error: errorDon } = await supabase
        .from('donaciones')
        .select('id, direccion_recogida, lat_recogida, lon_recogida, acopio_destino_id, donante_id, detalle_donacion(cantidad, unidad, catalogo_items(nombre_generico))')
        .eq('id', entrega.donacion_id)
        .single();
      if (errorDon) throw new Error(`Error al obtener donación: ${errorDon.message}`);

      viaje.origen = {
        lat: donacion.lat_recogida,
        lon: donacion.lon_recogida,
        direccion: donacion.direccion_recogida || 'Dirección de recogida'
      };

      // Datos del donante
      const { data: perfilDonante } = await supabase
        .from('perfiles')
        .select('nombre_punto, telefono')
        .eq('user_id', donacion.donante_id)
        .maybeSingle();
      viaje.nombreOrigen = perfilDonante?.nombre_punto || 'Donante';
      viaje.telefonoOrigen = perfilDonante?.telefono || '';

      // Destino: centro de acopio
      const { data: perfilAcopio } = await supabase
        .from('perfiles')
        .select('nombre_punto, telefono, lat, lon')
        .eq('user_id', donacion.acopio_destino_id)
        .maybeSingle();
      viaje.destino = {
        lat: perfilAcopio?.lat,
        lon: perfilAcopio?.lon,
        direccion: perfilAcopio?.nombre_punto || 'Centro de Acopio'
      };
      viaje.nombreDestino = perfilAcopio?.nombre_punto || 'Centro de Acopio';
      viaje.telefonoDestino = perfilAcopio?.telefono || '';

      // Productos
      viaje.productos = (donacion.detalle_donacion || [])
        .map(i => `${i.cantidad} ${i.unidad || ''} ${i.catalogo_items?.nombre_generico || 'Insumo'}`)
        .join(', ');

    } else if (entrega.necesidad_id) {
      // Distribución
      viaje.tipo = 'distribucion';

      const { data: despacho, error: errorDesp } = await supabase
        .from('despachos')
        .select('id, acopio_id, items_despachados')
        .eq('necesidad_id', entrega.necesidad_id)
        .maybeSingle();
      if (errorDesp) throw new Error(`Error al obtener despacho: ${errorDesp.message}`);

      viaje.despachoId = despacho?.id || null;

      // Origen: centro de acopio
      const { data: perfilAcopio } = await supabase
        .from('perfiles')
        .select('nombre_punto, telefono, lat, lon')
        .eq('user_id', despacho?.acopio_id)
        .maybeSingle();
      viaje.origen = {
        lat: perfilAcopio?.lat,
        lon: perfilAcopio?.lon,
        direccion: perfilAcopio?.nombre_punto || 'Centro de Acopio'
      };
      viaje.nombreOrigen = perfilAcopio?.nombre_punto || 'Centro de Acopio';
      viaje.telefonoOrigen = perfilAcopio?.telefono || '';

      // Destino: necesidad
      const { data: necesidad, error: errorNec } = await supabase
        .from('necesidades')
        .select('punto, lat, lon, contacto')
        .eq('id', entrega.necesidad_id)
        .single();
      if (errorNec) throw new Error(`Error al obtener necesidad: ${errorNec.message}`);

      viaje.destino = {
        lat: necesidad.lat,
        lon: necesidad.lon,
        direccion: necesidad.punto || 'Destino'
      };
      viaje.nombreDestino = necesidad.punto || 'Destino';
      viaje.telefonoDestino = necesidad.contacto || '';

      // Productos
      const items = despacho?.items_despachados || [];
      viaje.productos = (Array.isArray(items) ? items : [])
        .map(i => `${i.cantidad || ''} ${i.unidad || ''} ${i.detalle || 'Insumo'}`)
        .join(', ');
    }

    return viaje;
  }
}

module.exports = VoluntarioRepository;