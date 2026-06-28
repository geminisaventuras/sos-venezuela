// @build: 2026-06-29.16-30-00 | id: B2-VOL-CTRL-DONACIONES | desc: Controlador de voluntarios con endpoint de donaciones pendientes
const { voluntarioSchema } = require('../schemas/voluntario.schema');

class VoluntarioController {
  constructor(voluntarioService) {
    this.service = voluntarioService;
  }

  async registrar(req, res, next) {
    try {
      if (!req.user || !req.user.sub) {
        return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Usuario no autenticado' } });
      }
      const datos = voluntarioSchema.parse(req.body);
      const voluntario = await this.service.registrar(datos, req.user.sub);
      res.status(200).json({ success: true, data: voluntario });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', traceId: req.traceId } });
      }
      next(error);
    }
  }

  async miPerfil(req, res, next) {
    try {
      const voluntario = await this.service.obtenerMiPerfil(req.user.sub);
      if (!voluntario) {
        return res.status(404).json({ success: false, error: { code: 'PERFIL_NO_ENCONTRADO', message: 'Aún no ha registrado sus datos de voluntario', traceId: req.traceId } });
      }
      res.json({ success: true, data: voluntario });
    } catch (error) {
      next(error);
    }
  }

  async necesidadesCercanas(req, res, next) {
    try {
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);
      const radio = parseInt(req.query.radio) || 10;

      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({ success: false, error: { code: 'COORDS_INVALIDAS', message: 'Coordenadas inválidas' } });
      }

      const necesidades = await this.service.obtenerNecesidadesCercanas(lat, lon, radio);
      res.json({ success: true, data: necesidades });
    } catch (error) {
      console.error('[necesidadesCercanas]', error);
      res.status(500).json({ success: false, error: { message: 'Error al buscar necesidades cercanas' } });
    }
  }

  async donacionesPendientes(req, res, next) {
    try {
      const donaciones = await this.service.obtenerDonacionesPendientes();
      res.json({ success: true, data: donaciones });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VoluntarioController;