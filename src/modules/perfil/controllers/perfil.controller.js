// @build: 2026-06-28.20-15-00 | id: B30-PERFIL-CTRL-R3 | backup: perfil.controller.js.backup-20260628-201500 | desc: Eliminada vulnerabilidad de escalación de privilegios (R3)
const { perfilEsquema } = require('../schemas/perfil.schema');

class PerfilController {
  constructor(service) { this.service = service; }

  async obtener(req, res, next) {
    try {
      const userId = req.user.sub;
      const perfil = await this.service.obtener(userId);
      if (!perfil) return res.status(404).json({ success: false, error: { code: 'PERFIL_NO_ENCONTRADO', message: 'Perfil no encontrado', traceId: req.traceId } });
      res.json({ success: true, data: perfil });
    } catch (error) { next(error); }
  }

  async guardar(req, res, next) {
    try {
      const userId = req.user.sub;
      
      // R3 FIX: Ignorar el campo 'rol' del body y usar el rol verificado del token
      const datosBody = perfilEsquema.parse(req.body);
      // Forzamos el rol desde el token autenticado, no desde el body
      const datosValidados = {
        ...datosBody,
        rol: req.user.rol  // req.user.rol viene del middleware de autenticación (BD)
      };

      const perfil = await this.service.registrarOActualizar(userId, datosValidados);
      res.status(201).json({ success: true, data: perfil });
    } catch (error) {
      if (error.name === 'ZodError') return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos del perfil inválidos', traceId: req.traceId, details: error.errors } });
      if (error.message && error.message.includes('ya está registrado')) return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: error.message, traceId: req.traceId } });
      next(error);
    }
  }
}

module.exports = PerfilController;