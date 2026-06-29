// @build: 2026-06-29.10-00-00 | id: COMP-MENSAJE-V1 | desc: Componente de mensajes toast unificado
window.Mensaje = {
  _timeout: null,
  _contenedor: null,

  /**
   * Inicializa el componente de mensajes.
   * @param {string} contenedorId - ID del elemento donde se mostrarán los mensajes.
   */
  init(contenedorId) {
    this._contenedor = document.getElementById(contenedorId);
    if (!this._contenedor) {
      console.error('Mensaje: contenedor no encontrado:', contenedorId);
    }
  },

  /**
   * Muestra un mensaje toast.
   * @param {string} texto - Texto del mensaje.
   * @param {string} tipo - 'exito' o 'error'.
   * @param {number} duracion - Milisegundos antes de ocultar (default 5000).
   */
  mostrar(texto, tipo, duracion = 5000) {
    if (!this._contenedor) return;
    // Limpiar timeout anterior
    if (this._timeout) clearTimeout(this._timeout);
    
    // Usar textContent para prevenir XSS
    this._contenedor.textContent = texto;
    this._contenedor.className = 'mensaje ' + (tipo || 'exito');
    this._contenedor.style.display = 'block';
    
    // Auto-ocultar
    this._timeout = setTimeout(() => {
      this._contenedor.style.display = 'none';
    }, duracion);
  },

  ocultar() {
    if (this._contenedor) {
      this._contenedor.style.display = 'none';
    }
  }
};