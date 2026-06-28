// @build: 2026-06-29.19-30-00 | id: B3-DON-CTRL-FIX | desc: Controlador de donaciones que pasa modo_entrega y coordenadas manualmente
const { crearDonacionSchema, confirmarRecepcionSchema } = require('../schemas/donacion.schema');
const CatalogoService = require('../../catalogo/services/catalogo.service');
const CatalogoRepository = require('../../catalogo/repositories/catalogo.repository');

class DonacionController {
  constructor(donacionService) {
    this.service = donacionService;
    this.catalogoService = new CatalogoService(new CatalogoRepository());
  }

  async crear(req, res, next) {
    try {
      const datos = crearDonacionSchema.parse(req.body);
      // Agregar campos extra que Zod descarta
      if (req.body.modo_entrega) datos.modo_entrega = req.body.modo_entrega;
      if (req.body.direccion_recogida) datos.direccion_recogida = req.body.direccion_recogida;
      if (req.body.lat_recogida) datos.lat_recogida = req.body.lat_recogida;
      if (req.body.lon_recogida) datos.lon_recogida = req.body.lon_recogida;
      
      const userId = req.user?.sub;
      if (userId) {
        for (const item of datos.items) {
          await this.catalogoService.registrarSiNoExiste(item.tipo, item.detalle, userId);
        }
      }
      const resultado = await this.service.crearDonacion(datos);
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

  async listarPorAcopio(req, res, next) {
    try {
      const acopioId = req.query.acopio_id || req.user.sub;
      const donaciones = await this.service.listarPorAcopio(acopioId);
      res.json({ success: true, data: donaciones });
    } catch (error) {
      next(error);
    }
  }

  async confirmarRecepcion(req, res, next) {
    try {
      const { id } = req.params;
      const datos = confirmarRecepcionSchema.parse(req.body);
      const resultado = await this.service.confirmarRecepcion(id, datos);
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

  async trazabilidad(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.sub;
      
      const donacion = await this.service.obtenerPorId(id);
      if (!donacion) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Donación no encontrada' } });
      }
      if (donacion.donante_id !== userId && req.user.rol !== 'super_admin') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No autorizado' } });
      }
      
      const trazabilidad = await this.service.obtenerTrazabilidad(id);
      res.json({ success: true, data: trazabilidad });
    } catch (error) {
      next(error);
    }
  }


// @build: 2026-06-30.09-00-00 | id: B3-DON-CTRL-RECOGER | desc: Controlador con endpoint para que el transportista confirme la recogida
async recoger(req, res, next) {
  try {
    const donacionId = req.params.id;
    const userId = req.user.sub;
    
    const resultado = await this.service.confirmarRecogida(donacionId, userId);
    res.json({ success: true, data: resultado });
  } catch (error) {
    next(error);
  }
}


}

module.exports = DonacionController;