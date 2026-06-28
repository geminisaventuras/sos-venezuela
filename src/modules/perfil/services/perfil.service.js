class PerfilService {
  constructor(repository) {
    this.repository = repository;
  }

  async obtener(userId) {
    return await this.repository.buscarPorUserId(userId);
  }

  async registrarOActualizar(userId, datos) {
    return await this.repository.crearOActualizar(userId, datos);
  }
}

module.exports = PerfilService;