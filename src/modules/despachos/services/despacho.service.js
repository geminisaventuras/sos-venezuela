// @build: 2026-06-27.17-20-00 | id: B11-DESP-SERVICE | desc: Lógica de negocio para despachos
class DespachoService {
  constructor(repository) {
    this.repository = repository;
  }
  async crear(datos) { return this.repository.crear(datos); }
  async actualizar(id, estado, datos) { return this.repository.actualizarEstado(id, estado, datos); }
  async listarPorVoluntario(voluntarioId) { return this.repository.findByVoluntario(voluntarioId); }
  async listarPendientes() { return this.repository.findPendientes(); }
}

module.exports = DespachoService;