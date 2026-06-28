// @build: 2026-06-30.12-00-00 | id: B11-DESP-CTRL-FINAL | desc: Controlador de despachos (compatible con repositorio sin RPC)
const { crearDespachoSchema, actualizarDespachoSchema } = require('../schemas/despacho.schema');

class DespachoController {
  constructor(service) { this.service = service; }

  async crear(req, res, next) {
    try {
      const datos = crearDespachoSchema.parse(req.body);
      const resultado = await this.service.crear(datos);
      res.status(resultado.idempotente ? 200 : 201).json({ success: true, data: resultado, traceId: req.traceId });
    } catch (error) {
      if (error.name === 'ZodError') return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', traceId: req.traceId, details: error.errors } });
      next(error);
    }
  }

  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { estado, foto_evidencia, incidencia } = actualizarDespachoSchema.parse(req.body);
      const resultado = await this.service.actualizar(id, estado, { foto_evidencia, incidencia });
      res.json({ success: true, data: resultado, traceId: req.traceId });
    } catch (error) {
      if (error.name === 'ZodError') return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', traceId: req.traceId, details: error.errors } });
      next(error);
    }
  }

  async listarVoluntario(req, res, next) {
    try {
      const data = await this.service.listarPorVoluntario(req.user.sub);
      res.json({ success: true, data, traceId: req.traceId });
    } catch (error) { next(error); }
  }

  async listarPendientes(req, res, next) {
    try {
      const data = await this.service.listarPendientes();
      res.json({ success: true, data, traceId: req.traceId });
    } catch (error) { next(error); }
  }
}

module.exports = DespachoController;