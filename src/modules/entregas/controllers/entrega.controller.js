// @build: 2026-06-29.21-00-00 | id: B4-ENT-CTRL-FIX | desc: Controlador de entregas sin cambios, ya era compatible
const { crearEntregaSchema, actualizarEstadoSchema } = require('../schemas/entrega.schema');
const { z } = require('zod');

class EntregaController {
  constructor(entregaService) {
    this.service = entregaService;
  }

  async crear(req, res, next) {
    try {
      const datos = crearEntregaSchema.parse(req.body);
      const resultado = await this.service.crearEntrega(datos);
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

  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { estado } = actualizarEstadoSchema.parse(req.body);
      const resultado = await this.service.actualizarEstado(id, estado);
      res.json({ success: true, data: resultado });
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
      const schema = z.object({ voluntario: z.string().regex(/^[0-9]{7,15}$/) });
      const { voluntario } = schema.parse(req.query);
      const entregas = await this.service.obtenerEntregas(voluntario);
      res.json({ success: true, data: entregas });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Parámetros inválidos', traceId: req.traceId, details: error.errors },
        });
      }
      next(error);
    }
  }
}

module.exports = EntregaController;