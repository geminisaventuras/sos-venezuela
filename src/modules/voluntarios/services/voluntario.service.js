// @build: 2026-07-01.12-15-00 | id: B2-VOL-SERVICE-V3 | desc: Agregado obtenerViajeActivo para consultar la entrega activa del conductor
class VoluntarioService {
  constructor(voluntarioRepository) {
    this.repository = voluntarioRepository;
  }

  async registrar(datosValidados, userId) {
    const datosConUserId = { ...datosValidados, user_id: userId };
    return this.repository.upsert(datosConUserId);
  }

  async obtenerMiPerfil(userId) {
    return this.repository.findByUserId(userId);
  }

  async obtenerNecesidadesCercanas(lat, lon, radioKm) {
    return this.repository.findNecesidadesCercanas(lat, lon, radioKm);
  }

  async obtenerDonacionesPendientes() {
    return this.repository.findDonacionesPendientes();
  }

  // ✅ NUEVO MÉTODO: Obtener viaje activo del conductor
  async obtenerViajeActivo(telefono) {
    return this.repository.findActiveDelivery(telefono);
  }
}

module.exports = VoluntarioService;