// @build: 2026-06-30.01-40-00 | id: B6-CAT-CTRL-V4 | desc: Controlador con sugerencias, persistencia de "Otro" y creación de ítems
const { buscarQuerySchema, crearItemSchema } = require('../schemas/catalogo.schema');

class CatalogoController {
  constructor(service) {
    this.service = service;
  }

  async buscar(req, res, next) {
    try {
      const filtros = buscarQuerySchema.parse(req.query);
      const { data, sugerencias } = await this.service.buscar(filtros);
      res.json({ success: true, data, sugerencias: sugerencias || [], traceId: req.traceId });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Parámetros inválidos', traceId: req.traceId, details: error.errors }
        });
      }
      next(error);
    }
  }

  async crear(req, res, next) {
    try {
      const datos = crearItemSchema.parse(req.body);
      const userId = req.user.sub;
      const nuevo = await this.service.crearItem(datos, userId);
      res.status(201).json({ success: true, data: nuevo, traceId: req.traceId });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', traceId: req.traceId, details: error.errors }
        });
      }
      if (error.message && error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: error.message, traceId: req.traceId }
        });
      }
      next(error);
    }
  }

  async listarCategorias(req, res, next) {
    try {
      const categorias = await this.service.listarCategorias();
      res.json({ success: true, data: categorias, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CatalogoController;