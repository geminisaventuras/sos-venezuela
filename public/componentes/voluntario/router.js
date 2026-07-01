// @build: 2026-07-01.15-30-00 | id: VOL-ROUTER-V1 | desc: Router hash del voluntario con bloqueo durante viaje activo y detección de viaje desde BD
window.VoluntarioRouter = {
  vistaActual: 'explorar',

  navegar(vista) {
    if (VoluntarioStateCore.viajeEnCurso && vista !== 'viaje-activo' && vista !== 'mis-viajes') {
      Mensaje.mostrar('Complete o cancele el viaje activo antes de navegar.', 'error');
      return;
    }
    document.querySelectorAll('.spa-vista').forEach(el => el.classList.remove('active'));
    const destino = document.getElementById('vista-' + vista);
    if (destino) {
      destino.classList.add('active');
      this.vistaActual = vista;
      window.location.hash = vista;
      if (vista === 'explorar') VoluntarioExplorar.init();
      else if (vista === 'viaje-activo') VoluntarioViajeActivo.init();
      else if (vista === 'mis-viajes') VoluntarioMisViajes.cargar();
      else if (vista === 'perfil') VoluntarioPerfil.cargar();
    }
  },

  async init() {
    if (VoluntarioStateCore.cargarViajeGuardado()) {
      this.navegar('viaje-activo');
      VoluntarioNotificaciones.suscribirSesion();
      return;
    }
    try {
      const res = await apiFetch('/api/voluntarios/viaje-activo');
      if (res.success && res.data) {
        VoluntarioStateCore.viajeEnCurso = res.data;
        VoluntarioStateCore.guardarViaje();
        Mensaje.mostrar('🚨 Tienes un viaje activo. Continúa desde aquí.', 'exito');
        this.navegar('viaje-activo');
        VoluntarioNotificaciones.suscribirSesion();
        return;
      }
    } catch (e) {}
    const hash = window.location.hash.replace('#', '') || 'explorar';
    this.navegar(hash);
    window.addEventListener('hashchange', () => {
      this.navegar(window.location.hash.replace('#', '') || 'explorar');
    });
    VoluntarioNotificaciones.suscribirSesion();
  }
};
