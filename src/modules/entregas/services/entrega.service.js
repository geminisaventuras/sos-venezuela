// @build: 2026-06-29.21-00-00 | id: B4-ENT-SERVICE-FIX | desc: Servicio de entregas que maneja recolección y distribución
class EntregaService {
  constructor(entregaRepository) {
    this.repository = entregaRepository;
  }

  async crearEntrega(datosValidados) {
    return this.repository.crearConTransaccion(datosValidados);
  }

  async actualizarEstado(entregaId, nuevoEstado) {
    return this.repository.actualizarEstado(entregaId, nuevoEstado);
  }

  async obtenerEntregas(telefono) {
    return this.repository.findByVoluntario(telefono);
  }
}

module.exports = EntregaService;