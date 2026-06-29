// @build: 2026-06-29.10-10-00 | id: COMP-HEADER-V1 | desc: Componente de cabecera reutilizable
window.HeaderApp = {
  /**
   * Inicializa la cabecera.
   * @param {object} config - Configuración.
   * @param {string} config.contenedorId - ID del elemento header.
   * @param {string} config.titulo - Título principal.
   * @param {string} config.subtitulo - Texto secundario (ej. "SOS Venezuela").
   * @param {string} config.avatarIniciales - Iniciales del avatar (2 letras).
   * @param {string} config.nombreUsuario - Nombre a mostrar.
   * @param {Array} config.botonesExtra - Array de {icono, onclick, title} para botones adicionales.
   */
  init(config) {
    const contenedor = document.getElementById(config.contenedorId);
    if (!contenedor) return;
    
    let botonesHTML = '';
    if (config.botonesExtra) {
      botonesHTML = config.botonesExtra.map(b => `
        <button class="icon-btn" onclick="${b.onclick}" title="${b.title || ''}">
          <i class="${b.icono}"></i>
        </button>
      `).join('');
    }

    contenedor.innerHTML = `
      <h1>${config.subtitulo || ''} <span>${config.titulo || ''}</span></h1>
      <div class="header-actions">
        ${botonesHTML}
        <div class="user-info">
          <p>Bienvenido</p>
          <strong>${this._escapeHTML(config.nombreUsuario || 'Usuario')}</strong>
        </div>
        <div class="avatar">${this._escapeHTML(config.avatarIniciales || 'U')}</div>
      </div>
    `;
  },

  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};