// @build: 2026-07-01.15-40-00 | id: VOL-MODO-V1 | desc: Modo conductor: Wake Lock, refresco de sesión, Realtime de servicios
window.VoluntarioModoConductor = {
  intervaloRefresh: null,
  wakeLock: null,
  suscripcionRealtime: null,

  async toggle() {
    if (VoluntarioStateCore.viajeEnCurso) return;
    VoluntarioStateCore.modoConductor = !VoluntarioStateCore.modoConductor;
    const btn = document.getElementById('btn-modo-conductor');
    if (VoluntarioStateCore.modoConductor) {
      btn.innerHTML = '<i class="fa-solid fa-toggle-on"></i>'; btn.classList.add('active');
      try { this.wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
      this.intervaloRefresh = setInterval(() => this.refrescarSesion(), 30 * 60 * 1000);
      this.iniciarRealtime();
      Mensaje.mostrar('🟢 Modo conductor activado. La pantalla no se apagará.', 'exito');
    } else {
      btn.innerHTML = '<i class="fa-solid fa-toggle-off"></i>'; btn.classList.remove('active');
      if (this.wakeLock) { await this.wakeLock.release(); this.wakeLock = null; }
      if (this.intervaloRefresh) { clearInterval(this.intervaloRefresh); this.intervaloRefresh = null; }
      if (this.suscripcionRealtime) { sb.removeChannel(this.suscripcionRealtime); this.suscripcionRealtime = null; }
      Mensaje.mostrar('🔴 Modo conductor desactivado', 'exito');
    }
  },

  async refrescarSesion() {
    try {
      const { data, error } = await sb.auth.refreshSession();
      if (error) throw error;
      if (data.session) { authToken = data.session.access_token; localStorage.setItem('authToken', authToken); }
    } catch (e) { Mensaje.mostrar('⚠️ Sesión expirada', 'error'); await this.toggle(); setTimeout(() => logout(), 3000); }
  },

  iniciarRealtime() {
    this.suscripcionRealtime = sb.channel('servicios-tiempo-real')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donaciones', filter: 'estado=eq.ofrecida' }, () => {
        if (VoluntarioRouter.vistaActual === 'explorar') VoluntarioExplorar.cargarServicios();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'despachos', filter: 'estado=eq.preparando' }, () => {
        if (VoluntarioRouter.vistaActual === 'explorar') VoluntarioExplorar.cargarServicios();
      })
      .subscribe();
  }
};
