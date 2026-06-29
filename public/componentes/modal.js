// @build: 2026-06-29.10-05-00 | id: COMP-MODAL-V1 | desc: Componente de modal reutilizable
window.Modal = {
  _overlay: null,
  _contenido: null,
  _onClose: null,

  /**
   * Inicializa el componente modal.
   * @param {string} overlayId - ID del div overlay del modal.
   * @param {string} contenidoId - ID del div interno donde se inyecta el contenido dinámico.
   */
  init(overlayId, contenidoId) {
    this._overlay = document.getElementById(overlayId);
    this._contenido = document.getElementById(contenidoId);
    if (!this._overlay || !this._contenido) {
      console.error('Modal: overlays no encontrados:', overlayId, contenidoId);
      return;
    }
    // Cerrar al hacer clic fuera del contenido
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.cerrar();
    });
  },

  /**
   * Abre el modal con contenido HTML dinámico.
   * @param {string} html - Contenido HTML seguro a mostrar.
   * @param {function} onClose - Callback opcional al cerrar.
   */
  abrir(html, onClose) {
    if (!this._overlay || !this._contenido) return;
    this._contenido.innerHTML = html;
    this._overlay.classList.add('active');
    this._onClose = onClose || null;
  },

  cerrar() {
    if (this._overlay) {
      this._overlay.classList.remove('active');
      if (this._contenido) this._contenido.innerHTML = '';
      if (this._onClose) {
        this._onClose();
        this._onClose = null;
      }
    }
  }
};