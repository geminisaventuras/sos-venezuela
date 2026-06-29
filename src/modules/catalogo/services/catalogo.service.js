// @build: 2026-06-30.01-35-00 | id: B6-CAT-SERVICE-V4 | desc: Servicio que retorna sugerencias, persiste "Otro" y lista categorías
class CatalogoService {
  constructor(repository) {
    this.repository = repository;
  }

  async buscar(filtros) {
    return this.repository.buscarItems(filtros);
  }

  async crearItem(datos, userId) {
    return this.repository.crearItem(datos, userId);
  }

  async listarCategorias() {
    return this.repository.listarCategorias();
  }
}

module.exports = CatalogoService;