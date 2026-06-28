// @build: 2026-06-26.23-00-00 | id: B6-CAT | desc: Controlador de catálogo
const { z } = require('zod');

class CatalogoController {
  constructor(service) {
    this.service = service;
  }

  async obtener(req, res, next) {
    try {
      const schema = z.object({ tipo: z.enum(['agua_potable','alimentos_no_perecibles','medicinas','colchonetas','ropa','otros']) });
      const { tipo } = schema.parse(req.query);
      const items = await this.service.obtenerPorTipo(tipo);
      res.json({ success: true, data: items });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Tipo inválido', traceId: req.traceId, details: error.errors } });
      }
      next(error);
    }
  }
}

module.exports = CatalogoController;
