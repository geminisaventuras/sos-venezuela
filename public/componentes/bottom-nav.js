// @build: 2026-06-30.08-00-00 | id: COMP-BOTTOMNAV-V6 | desc: Detecta rol automáticamente desde perfil, agrega clase CSS al contenedor
window.BottomNav = {
  _contenedor: null,
  _activa: null,

  _menus: {
    donante: [
      { id: 'inicio', icono: 'fa-solid fa-house', label: 'Inicio', href: 'dashboard-donante.html' },
      { id: 'nueva', icono: 'fa-solid fa-plus-circle', label: 'Nueva', href: 'donante-nueva.html' },
      { id: 'historial', icono: 'fa-solid fa-list', label: 'Historial', href: 'donante-historial.html' },
      { id: 'perfil', icono: 'fa-solid fa-user', label: 'Perfil', href: 'donante-perfil.html' }
    ],
    refugio: [
      { id: 'inicio', icono: 'fa-solid fa-house', label: 'Inicio', href: 'dashboard-refugio.html' }
    ],
    centro_salud: [
      { id: 'inicio', icono: 'fa-solid fa-house', label: 'Inicio', href: 'dashboard-hospital.html' }
    ],
    centro_acopio: [
      { id: 'inicio', icono: 'fa-solid fa-house', label: 'Inicio', href: 'dashboard-acopio.html' }
    ],
    voluntario: [
  { id: 'toggle-lista', icono: 'fa-solid fa-list', label: 'Lista', accion: 'toggleLista' },
  { id: 'explorar', icono: 'fa-solid fa-map-location-dot', label: 'Explorar', href: '#explorar' },
  { id: 'mis-viajes', icono: 'fa-solid fa-route', label: 'Mis Viajes', href: '#mis-viajes' }
],
    super_admin: [
      { id: 'inicio', icono: 'fa-solid fa-house', label: 'Inicio', href: 'dashboard-admin.html' }
    ]
  },

  init(config) {
    this._contenedor = document.getElementById(config.contenedorId);
    if (!this._contenedor) return;

    // Agregar la clase bottom-nav para que el CSS aplique
    this._contenedor.classList.add('bottom-nav');

    const rol = (typeof perfil !== 'undefined' && perfil?.rol) ? perfil.rol : null;
    const secciones = this._menus[rol] || [];
    if (!secciones.length) return;

    const currentPath = window.location.pathname.split('/').pop() || '';
    const activa = secciones.find(s => s.href === currentPath);
    this._activa = activa ? activa.id : (secciones[0]?.id);

   this._contenedor.innerHTML = secciones.map(s => {
  if (s.accion) {
    return `<button class="nav-item" data-section="${s.id}" onclick="VoluntarioState.toggleLista()">
      <i class="${s.icono}"></i><span>${s.label}</span>
    </button>`;
  }
  return `<a href="${s.href}" class="nav-item ${s.id === this._activa ? 'active' : ''}" data-section="${s.id}">
    <i class="${s.icono}"></i><span>${s.label}</span>
  </a>`;
}).join('');
  }
};