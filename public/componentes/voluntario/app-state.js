// @build: 2026-07-01.15-15-00 | id: VOL-STATE-V1 | desc: Estado global compartido del voluntario: perfil, viajeEnCurso, persistencia
window.VoluntarioStateCore = {
  perfil: null,
  perfilCargado: false,
  modoConductor: false,
  viajeEnCurso: null,

  guardarViaje() {
    if (this.viajeEnCurso) {
      localStorage.setItem('viajeEnCurso', JSON.stringify(this.viajeEnCurso));
    }
  },

  cargarViajeGuardado() {
    const guardado = localStorage.getItem('viajeEnCurso');
    if (guardado) {
      try {
        this.viajeEnCurso = JSON.parse(guardado);
        return true;
      } catch(e) {
        localStorage.removeItem('viajeEnCurso');
      }
    }
    return false;
  },

  limpiarViajeGuardado() {
    localStorage.removeItem('viajeEnCurso');
    this.viajeEnCurso = null;
  }
};
