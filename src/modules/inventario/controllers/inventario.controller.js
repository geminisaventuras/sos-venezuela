// @build: 2026-06-27.17-15-00 | id: B10-INV-CTRL | desc: Controlador con validación Zod
const { ingresoInventarioSchema, egresoInventarioSchema } = require('../schemas/inventario.schema');

class InventarioController {
  constructor(service) {
    this.service = service;
  }

  async ingresar(req, res, next) {
    try {
      const datos = ingresoInventarioSchema.parse(req.body);
      const id = await this.service.ingreso(datos);
      res.status(201).json({ success: true, data: { id, traceId: req.traceId } });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', traceId: req.traceId, details: error.errors } });
      }
      next(error);
    }
  }

  async egresar(req, res, next) {
    try {
      const { acopio_id, items } = egresoInventarioSchema.parse(req.body);
      const resultado = await this.service.egreso(acopio_id, items);
      res.json({ success: true, data: resultado, traceId: req.traceId });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', traceId: req.traceId, details: error.errors } });
      }
      next(error);
    }
  }

  async listar(req, res, next) {
    try {
      const acopioId = req.params.acopio_id;
      const inventario = await this.service.listar(acopioId);
      res.json({ success: true, data: inventario, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async listarNacional(req, res, next) {
    try {
      const inventario = await this.service.listarNacional();
      res.json({ success: true, data: inventario, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InventarioController;