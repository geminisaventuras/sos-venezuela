// @build: 2026-06-26.23-00-00 | id: B6-CAT | desc: Lógica de negocio catálogo
class CatalogoService {
  constructor(repository) {
    this.repository = repository;
  }

  async obtenerPorTipo(tipo) {
    return this.repository.buscarPorTipo(tipo);
  }

  async registrarSiNoExiste(tipo, detalle, userId) {
    if (detalle && detalle.trim()) {
      await this.repository.upsert(tipo, detalle.trim(), userId);
    }
  }
}

module.exports = CatalogoService;
