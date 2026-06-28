// @build: 2026-06-27.17-15-00 | id: B10-INV-SERVICE | desc: Lógica de negocio para inventario (FEFO)
class InventarioService {
  constructor(repository) {
    this.repository = repository;
  }

  async ingreso(datos) {
    return this.repository.sumarStock(datos);
  }

  async egreso(acopioId, items) {
    return this.repository.restarStock(acopioId, items);
  }

  async listar(acopioId) {
    return this.repository.obtenerInventario(acopioId);
  }

  async listarNacional() {
    return this.repository.obtenerInventarioNacional();
  }
}

module.exports = InventarioService;