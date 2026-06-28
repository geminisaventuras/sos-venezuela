// @build: 2026-06-29.16-30-00 | id: B2-VOL-SERVICE-DONACIONES | desc: Servicio de voluntarios con método de donaciones pendientes
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
}

module.exports = VoluntarioService;