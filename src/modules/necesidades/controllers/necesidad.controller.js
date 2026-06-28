// @build: 2026-06-27.04-00-00 | id: B1-NECv4 | desc: Controlador necesidades con filtro por rol
const { crearNecesidadSchema } = require('../schemas/necesidad.schema');
const CatalogoService = require('../../catalogo/services/catalogo.service');
const CatalogoRepository = require('../../catalogo/repositories/catalogo.repository');

class NecesidadController {
  constructor(necesidadService) {
    this.service = necesidadService;
    this.catalogoService = new CatalogoService(new CatalogoRepository());
  }

  async crear(req, res, next) {
    try {
      const datos = crearNecesidadSchema.parse(req.body);
      const userId = req.user?.sub;
      if (userId) {
        for (const item of datos.items) {
          await this.catalogoService.registrarSiNoExiste(item.tipo, item.detalle, userId);
        }
      }
      const resultado = await this.service.crearNecesidad(datos);
      res.status(resultado.idempotente ? 200 : 201).json({
        success: true,
        data: { id: resultado.id, idempotente: resultado.idempotente, traceId: req.traceId },
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', traceId: req.traceId, details: error.errors },
        });
      }
      next(error);
    }
  }

  async listar(req, res, next) {
    try {
      const necesidades = await this.service.obtenerPendientes(req.user.sub, req.user.rol);
      res.json({ success: true, data: necesidades });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NecesidadController;
