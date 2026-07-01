// @build: 2026-07-01.15-35-00 | id: VOL-NOTIF-V1 | desc: Suscripciones Realtime: cierre de sesión por conflicto y cambios en entrega activa
window.VoluntarioNotificaciones = {
  canalSesion: null,
  canalEntrega: null,

  suscribirSesion() {
    if (this.canalSesion || !authToken) return;
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      const userId = payload.sub;
      if (!userId) return;
      this.canalSesion = sb.channel('sesion-unica')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'voluntarios', filter: 'user_id=eq.' + userId }, (payload) => {
          const nuevoJti = payload.new.ultimo_token_jti;
          const sessionIdActual = localStorage.getItem('sessionId');
          if ((nuevoJti && nuevoJti !== sessionIdActual) || (!nuevoJti && sessionIdActual)) {
            Mensaje.mostrar('⚠️ Tu sesión fue cerrada desde otro dispositivo.', 'error');
            setTimeout(() => logout(), 3000);
          }
        })
        .subscribe();
    } catch (e) {}
  },

  suscribirEntrega() {
    if (this.canalEntrega || !VoluntarioStateCore.viajeEnCurso?.entregaId) return;
    this.canalEntrega = sb.channel('entrega-activa')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'entregas', filter: 'id=eq.' + VoluntarioStateCore.viajeEnCurso.entregaId }, (payload) => {
        const nuevoEstado = payload.new.estado;
        if (nuevoEstado === 'cancelada' || nuevoEstado === 'entregada') {
          Mensaje.mostrar('ℹ️ Este viaje fue completado o cancelado desde otro dispositivo.', 'info');
          VoluntarioStateCore.limpiarViajeGuardado();
          VoluntarioViajeActivo.salir();
        }
      })
      .subscribe();
  },

  limpiarSesion() {
    if (this.canalSesion) { sb.removeChannel(this.canalSesion); this.canalSesion = null; }
  },

  limpiarEntrega() {
    if (this.canalEntrega) { sb.removeChannel(this.canalEntrega); this.canalEntrega = null; }
  }
};
