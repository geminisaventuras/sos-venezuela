// @build: 2026-06-28.09-00-00 | id: B3-DON-SERVICE-TRAZABILIDAD | desc: Servicio con trazabilidad de donación
class DonacionService {
  constructor(donacionRepository, inventarioRepository) {
    this.donacionRepository = donacionRepository;
    this.inventarioRepository = inventarioRepository;
  }

  async crearDonacion(datosValidados) {
    return this.donacionRepository.crearConTransaccion(datosValidados);
  }

  async listarPorAcopio(acopioId) {
    return this.donacionRepository.findByAcopio(acopioId);
  }

  async obtenerPorId(donacionId) {
    return this.donacionRepository.findById(donacionId);
  }

  async confirmarRecepcion(donacionId, datos) {
    const donacion = await this.donacionRepository.findById(donacionId);
    if (!donacion) throw new Error('Donación no encontrada');
    
    for (const detalle of donacion.detalle_donacion) {
      await this.inventarioRepository.sumarStock({
        acopio_id: donacion.acopio_destino_id,
        insumo_id: detalle.insumo_id,
        tipo: 'otros',
        detalle: detalle.catalogo_insumos?.nombre_mostrar || 'Insumo',
        unidad: detalle.unidad,
        cantidad: detalle.cantidad - (datos.cantidad_rechazada || 0),
        fecha_vencimiento: detalle.fecha_vencimiento || null,
        lote_id: donacion.id
      });
    }
    
    return this.donacionRepository.confirmarRecepcion(donacionId, datos);
  }

  async obtenerTrazabilidad(donacionId) {
    return this.donacionRepository.obtenerTrazabilidad(donacionId);
  }

// @build: 2026-06-30.09-00-00 | id: B3-DON-SERVICE-RECOGER | desc: Servicio con confirmación de recogida por el transportista
async confirmarRecogida(donacionId, userId) {
  const donacion = await this.donacionRepository.findById(donacionId);
  if (!donacion) throw new Error('Donación no encontrada');
  if (donacion.estado !== 'asignada') throw new Error('La donación no está en estado asignada');
  
  // Verificar que el usuario sea el voluntario asignado
  const { data: voluntario } = await supabase
    .from('voluntarios')
    .select('user_id')
    .eq('user_id', userId)
    .single();
  if (!voluntario || donacion.voluntario_recoleccion_id !== voluntario.user_id) {
    throw new Error('No autorizado para confirmar esta recogida');
  }
  
  await this.donacionRepository.confirmarRecogida(donacionId);
  return { id: donacionId, estado: 'en_transito_a_acopio' };
}



}

module.exports = DonacionService;