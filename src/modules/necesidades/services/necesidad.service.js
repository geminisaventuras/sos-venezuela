// @build: 2026-06-27.04-00-00 | id: B1-NECv4 | desc: Servicio necesidades con filtro automático por rol
const supabase = require('../../../config/supabase');

class NecesidadService {
  constructor(necesidadRepository) {
    this.repository = necesidadRepository;
  }

  async crearNecesidad(datosValidados) {
    return this.repository.crearConTransaccion(datosValidados);
  }

  async obtenerPendientes(userId, rol) {
    // Si es refugio o centro de salud, devolver solo las del punto del usuario
    if (rol === 'refugio' || rol === 'centro_salud') {
      const { data: perfil, error } = await supabase
        .from('perfiles')
        .select('nombre_punto')
        .eq('user_id', userId)
        .single();
      if (error || !perfil || !perfil.nombre_punto) {
        throw new Error('Perfil incompleto. No se puede filtrar por punto.');
      }
      return this.repository.findByPunto(perfil.nombre_punto);
    }
    // centro_acopio ve todas las pendientes
    return this.repository.findPendientes();
  }
}

module.exports = NecesidadService;
