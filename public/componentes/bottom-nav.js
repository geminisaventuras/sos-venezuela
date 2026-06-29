// @build: 2026-06-29.10-15-00 | id: COMP-BOTTOMNAV-V1 | desc: Componente de navegación inferior reutilizable
window.BottomNav = {
  _contenedor: null,
  _secciones: [],
  _activa: null,
  _onChange: null,

  /**
   * Inicializa la navegación inferior.
   * @param {object} config - Configuración.
   * @param {string} config.contenedorId - ID del elemento nav.
   * @param {Array} config.secciones - Array de {id, icono, label}.
   * @param {function} config.onChange - Callback al cambiar de sección, recibe el id de la sección.
   * @param {string} config.activaInicial - ID de la sección activa al inicio.
   */
  init(config) {
    this._contenedor = document.getElementById(config.contenedorId);
    if (!this._contenedor) return;
    this._secciones = config.secciones || [];
    this._onChange = config.onChange || null;
    this._activa = config.activaInicial || (this._secciones[0]?.id);

    this._renderizar();
    this._bindEventos();
  },

  _renderizar() {
    this._contenedor.innerHTML = this._secciones.map(s => `
      <button class="nav-item ${s.id === this._activa ? 'active' : ''}" data-section="${s.id}">
        <i class="${s.icono}"></i><span>${s.label}</span>
      </button>
    `).join('');
  },

  _bindEventos() {
    this._contenedor.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const sectionId = btn.dataset.section;
        this.setActiva(sectionId);
        if (this._onChange) this._onChange(sectionId);
      });
    });
  },

  setActiva(sectionId) {
    this._activa = sectionId;
    this._contenedor.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
  }
};