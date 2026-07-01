// @build: 2026-06-28.22-40-00 | id: B4-ENT-CTRL-IDOR-R4 | backup: entrega.controller.js.backup-20260628-224000 | desc: Agregada validación IDOR para creación y actualización de entregas
const { crearEntregaSchema, actualizarEstadoSchema } = require('../schemas/entrega.schema');
const { z } = require('zod');
const supabaseAdmin = require('../../../config/supabase');

class EntregaController {
  constructor(entregaService) {
    this.service = entregaService;
  }

  async crear(req, res, next) {
    try {
      const datos = crearEntregaSchema.parse(req.body);

      // IDOR: Si es voluntario, solo puede asignarse a sí mismo
      if (req.user.rol === 'voluntario') {
        const { data: vol } = await supabaseAdmin
          .from('voluntarios')
          .select('telefono')
          .eq('user_id', req.user.sub)
          .single();
        if (!vol || vol.telefono !== datos.voluntario_telefono) {
          return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Solo puede asignarse entregas a sí mismo', traceId: req.traceId } });
        }
      }

      const resultado = await this.service.crearEntrega(datos);
      res.status(resultado.idempotente ? 200 : 201).json({ success: true, data: { id: resultado.id, idempotente: resultado.idempotente, traceId: req.traceId } });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', traceId: req.traceId, details: error.errors } });
      }
      next(error);
    }
  }

     async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { estado, motivo, descripcion } = actualizarEstadoSchema.parse(req.body);

      // IDOR: Solo el voluntario dueño de la entrega o super_admin pueden modificarla
      if (req.user.rol !== 'super_admin') {
        const { data: entrega, error: errorEntrega } = await supabaseAdmin
          .from('entregas')
          .select('voluntario_telefono')
          .eq('id', id)
          .single();
        if (errorEntrega || !entrega) {
          return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Entrega no encontrada', traceId: req.traceId } });
        }

        const { data: voluntario, error: errorVol } = await supabaseAdmin
          .from('voluntarios')
          .select('user_id')
          .eq('telefono', entrega.voluntario_telefono)
          .single();
        if (errorVol || !voluntario || voluntario.user_id !== req.user.sub) {
          return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No autorizado para modificar esta entrega', traceId: req.traceId } });
        }
      }

      const resultado = await this.service.actualizarEstado(id, estado);
      
      if (estado === 'cancelada' && motivo) {
        await this.service.registrarIncidencia(id, req.user.sub, motivo, descripcion);
      }
      
      res.json({ success: true, data: resultado, traceId: req.traceId });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', traceId: req.traceId, details: error.errors } });
      }
      
      // Manejar errores específicos de la RPC
      const mensaje = error.message || '';
      if (mensaje.includes('no encontrada')) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'El viaje no existe o ya fue procesado.', traceId: req.traceId } });
      }
      if (mensaje.includes('estado final')) {
        return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Este viaje ya fue cancelado o completado desde otro dispositivo.', traceId: req.traceId } });
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
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Parámetros inválidos', traceId: req.traceId, details: error.errors } });
      }
      next(error);
    }
  }
}

module.exports = EntregaController;