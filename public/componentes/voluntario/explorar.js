// @build: 2026-07-01.19-00-00 | id: VOL-EXPLORAR-V2 | desc: Zoom inicial amplio + marcador del conductor según tipo de vehículo
window.VoluntarioExplorar = {
  mapaServicios: null,
  marcadoresServicios: [],
  marcadorConductor: null,
  todosServicios: [],
  filtroActual: 'todos',
  paginaServicios: 1,
  ITEMS_POR_PAGINA: 5,

    init() {
    const lat = perfil.lat || 10.48;
    const lon = perfil.lon || -66.90;
    if (!this.mapaServicios) {
      this.mapaServicios = L.map('mapa-servicios').setView([lat, lon], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.mapaServicios);
      if (perfil.lat && perfil.lon) {
        L.circle([perfil.lat, perfil.lon], { radius: 15000, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.05, weight: 1 }).addTo(this.mapaServicios);
      }
    } else {
      this.mapaServicios.invalidateSize();
    }
    this.agregarMarcadorConductor(lat, lon);
    this.cargarServicios();
    const sheet = document.getElementById('bottom-sheet');
    if (sheet) sheet.classList.add('oculta');
    this.mapaServicios.off('click');
    this.mapaServicios.on('click', () => {
      const s = document.getElementById('bottom-sheet');
      if (s && !s.classList.contains('oculta')) s.classList.add('oculta');
    });
  },
  agregarMarcadorConductor(lat, lon) {
    if (this.marcadorConductor) this.mapaServicios.removeLayer(this.marcadorConductor);
    const tipoVehiculo = (VoluntarioStateCore.perfil && VoluntarioStateCore.perfil.tipo_vehiculo) ? VoluntarioStateCore.perfil.tipo_vehiculo : 'moto';
    const iconosVehiculo = {
      moto: '🏍️',
      carro: '🚗',
      camioneta: '🚛',
      bicicleta: '🚲',
      a_pie: '🚶'
    };
    const emoji = iconosVehiculo[tipoVehiculo] || '📍';
    const iconoPersonalizado = L.divIcon({
      html: '<div style="font-size: 28px; text-align: center; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">' + emoji + '</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
      className: ''
    });
    this.marcadorConductor = L.marker([lat, lon], { icon: iconoPersonalizado, zIndexOffset: 1000 })
      .addTo(this.mapaServicios)
      .bindPopup('<b>📍 Tú estás aquí</b><br>' + (VoluntarioStateCore.perfil?.nombre || 'Conductor'));
  },

  async cargarServicios() {
    const lista = document.getElementById('lista-servicios');
    lista.innerHTML = '<div class="loading">Conectando al radar de viajes...</div>';
    try {
      const [recRes, disRes] = await Promise.all([
        apiFetch('/api/voluntarios/donaciones-pendientes'),
        apiFetch('/api/despachos/pendientes')
      ]);
      this.todosServicios = [
        ...(recRes.data || []).map(d => ({ ...d, tipo: 'recoleccion' })),
        ...(disRes.data || []).map(d => ({ ...d, tipo: 'distribucion' }))
      ];
      this.paginaServicios = 1;
      this.filtrarServicios(this.filtroActual);
    } catch (e) { lista.innerHTML = '<div class="empty-state">Error de conexión. Intente recargar.</div>'; }
  },

  filtrarServicios(filtro) {
    this.filtroActual = filtro;
    this.paginaServicios = 1;
    document.querySelectorAll('#bottom-sheet .btn-outline').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('filtro-' + filtro);
    if (btn) btn.classList.add('active');
    let datos = this.todosServicios;
    if (filtro === 'recolecciones') datos = datos.filter(s => s.tipo === 'recoleccion');
    else if (filtro === 'distribuciones') datos = datos.filter(s => s.tipo === 'distribucion');
    if (perfil.lat && perfil.lon) {
      datos.forEach(s => {
        const lat = s.tipo === 'recoleccion' ? s.lat_recogida : s.necesidades?.lat;
        const lon = s.tipo === 'recoleccion' ? s.lon_recogida : s.necesidades?.lon;
        s._distancia = (lat && lon) ? VoluntarioUtils.calcularDistancia(perfil.lat, perfil.lon, lat, lon) : 999;
      });
      datos.sort((a, b) => a._distancia - b._distancia);
    }
    this.renderizarLista(datos);
    this.actualizarMarcadores(datos);
  },

  renderizarLista(datos) {
    const lista = document.getElementById('lista-servicios');
    if (!datos.length) {
      lista.innerHTML = '<div class="empty-state">Sin viajes disponibles en esta categoría</div>';
      document.getElementById('paginacion-servicios').style.display = 'none';
      return;
    }
    const total = Math.ceil(datos.length / this.ITEMS_POR_PAGINA);
    if (this.paginaServicios > total) this.paginaServicios = total;
    if (this.paginaServicios < 1) this.paginaServicios = 1;
    const inicio = (this.paginaServicios - 1) * this.ITEMS_POR_PAGINA;
    const pagina = datos.slice(inicio, inicio + this.ITEMS_POR_PAGINA);
    lista.innerHTML = pagina.map(s => this.renderizarTarjeta(s)).join('');
    const pagDiv = document.getElementById('paginacion-servicios');
    if (total > 1) {
      pagDiv.style.display = 'flex';
      pagDiv.innerHTML = '<button class="btn btn-outline btn-sm" ' + (this.paginaServicios === 1 ? 'disabled' : '') + ' onclick="VoluntarioExplorar.cambiarPagina(-1)">←</button><span>' + this.paginaServicios + ' / ' + total + '</span><button class="btn btn-outline btn-sm" ' + (this.paginaServicios === total ? 'disabled' : '') + ' onclick="VoluntarioExplorar.cambiarPagina(1)">→</button>';
    } else {
      pagDiv.style.display = 'none';
    }
  },

  cambiarPagina(dir) { this.paginaServicios += dir; this.filtrarServicios(this.filtroActual); },

  renderizarTarjeta(s) {
    const distancia = s._distancia || 999;
    const items = s.tipo === 'recoleccion' ? (s.detalle_donacion || []) : (s.items_despachados || []);
    const resumen = items.slice(0, 3).map(i => `${i.cantidad} ${i.unidad || ''} ${VoluntarioUtils.escapeHTML(i.catalogo_items?.nombre_generico || i.detalle || 'Insumo')}`).join(', ');
    const direccion = VoluntarioUtils.escapeHTML(s.tipo === 'recoleccion' ? (s.direccion_recogida || 'Sin dirección') : (s.necesidades?.punto || 'Destino'));
    const urgente = (Date.now() - new Date(s.creado_en).getTime()) > 2 * 60 * 60 * 1000;
    return '<div class="servicio-item ' + s.tipo + (urgente ? ' urgente' : '') + '" onclick="VoluntarioExplorar.toggleExpandir(this)"><div class="servicio-header"><span class="servicio-tipo">' + (s.tipo === 'recoleccion' ? '📦 RECOGER' : '🚚 ENTREGAR') + '</span><span class="badge" style="background:var(--accent);color:white;">' + (distancia < 999 ? distancia + ' km' : 'N/A') + '</span></div><div style="font-size:14px; margin:6px 0;">📍 ' + direccion + '</div><div style="font-size:13px; color:var(--text-muted);">📦 ' + resumen + (items.length > 3 ? ' y más...' : '') + '</div><div class="servicio-expand"><div class="manifest-premium-box"><strong>📋 Detalle completo:</strong><ul>' + items.map(i => '<li>' + i.cantidad + ' ' + VoluntarioUtils.escapeHTML(i.unidad || '') + ' – ' + VoluntarioUtils.escapeHTML(i.catalogo_items?.nombre_generico || i.detalle || 'Insumo') + '</li>').join('') + '</ul></div><button class="btn btn-success btn-accion" onclick="event.stopPropagation(); VoluntarioExplorar.aceptarViaje(\'' + s.id + '\', \'' + s.tipo + '\')">✅ Aceptar Viaje</button></div></div>';
  },

  toggleExpandir(el) {
    const expandido = el.classList.contains('expandido');
    document.querySelectorAll('.servicio-item').forEach(item => item.classList.remove('expandido'));
    if (!expandido) el.classList.add('expandido');
  },

  actualizarMarcadores(datos) {
    if (!this.mapaServicios) return;
    this.marcadoresServicios.forEach(m => this.mapaServicios.removeLayer(m));
    this.marcadoresServicios = [];
    datos.forEach(s => {
      const lat = s.tipo === 'recoleccion' ? s.lat_recogida : s.necesidades?.lat;
      const lon = s.tipo === 'recoleccion' ? s.lon_recogida : s.necesidades?.lon;
      if (lat && lon) {
        const color = s.tipo === 'recoleccion' ? 'orange' : 'blue';
        const marker = L.marker([lat, lon], { icon: L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' + color + '.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }) }).addTo(this.mapaServicios).bindPopup('<b>' + (s.tipo === 'recoleccion' ? 'Recogida' : 'Entrega') + '</b><br>' + (s._distancia < 999 ? s._distancia + ' km' : ''));
        marker.on('click', () => { if (confirm('¿Aceptar este viaje de ' + (s.tipo === 'recoleccion' ? 'recogida' : 'entrega') + '?')) { this.aceptarViaje(s.id, s.tipo); } });
        this.marcadoresServicios.push(marker);
      }
    });
    if (this.marcadoresServicios.length) this.mapaServicios.fitBounds(L.featureGroup(this.marcadoresServicios).getBounds().pad(0.1));
     

if (this.marcadoresServicios.length) {
      const bounds = L.featureGroup(this.marcadoresServicios).getBounds().pad(0.1);
      this.mapaServicios.flyToBounds(bounds, { duration: 1.5 });
      // Después de ajustar a los servicios, centrar en el conductor con zoom cercano
      setTimeout(() => {
        const lat = perfil.lat || 10.48;
        const lon = perfil.lon || -66.90;
        this.mapaServicios.flyTo([lat, lon], 15, { duration: 1.5 });
      }, 2000);
    }

  },

  async aceptarViaje(id, tipo) {
    if (VoluntarioStateCore.viajeEnCurso) {
      Mensaje.mostrar('Ya tienes un viaje activo. Finalízalo o cancélalo antes de aceptar otro.', 'error');
      return;
    }
    if (!VoluntarioStateCore.perfilCargado) { await VoluntarioPerfil.cargar(); }
    const p = VoluntarioStateCore.perfil;
    if (!p) { Mensaje.mostrar('Debe completar su ficha antes de aceptar viajes.', 'error'); VoluntarioRouter.navegar('perfil'); return; }
    if (!p.nombre || !p.telefono || !p.tipo_vehiculo || !p.lat || !p.lon) { Mensaje.mostrar('Faltan datos obligatorios en su ficha.', 'error'); VoluntarioRouter.navegar('perfil'); return; }
    if (!confirm('¿Aceptar este viaje de ' + (tipo === 'recoleccion' ? 'recogida' : 'entrega') + '?')) return;
    try {
      let entregaId = null;
      if (tipo === 'recoleccion') {
        const res = await apiFetch('/api/entregas', { method: 'POST', body: JSON.stringify({ idempotencyKey: generarUUID(), voluntario_telefono: p.telefono, donacion_id: id, tipo_servicio: 'recoleccion' }) });
        entregaId = res?.data?.id || null;
      } else {
        await apiFetch('/api/despachos/' + id, { method: 'PATCH', body: JSON.stringify({ estado: 'en_transito_a_destino' }) });
        entregaId = id;
      }
      const servicio = this.todosServicios.find(s => s.id === id && s.tipo === tipo);
      const viaje = { id, tipo, estado: tipo === 'recoleccion' ? 'asignada' : 'en_transito_a_destino', timestamp: Date.now(), entregaId };
      if (servicio) {
        if (tipo === 'recoleccion') {
          viaje.origen = { lat: servicio.lat_recogida, lon: servicio.lon_recogida, direccion: servicio.direccion_recogida || 'Dirección de recogida' };
          viaje.destino = { lat: p.lat, lon: p.lon, direccion: 'Centro de Acopio' };
          viaje.nombreOrigen = servicio.perfiles?.nombre_punto || 'Donante';
          viaje.nombreDestino = 'Centro de Acopio';
          viaje.telefonoOrigen = servicio.perfiles?.telefono || '';
          viaje.telefonoDestino = '';
          viaje.productos = (servicio.detalle_donacion || []).map(i => `${i.cantidad} ${i.unidad || ''} ${i.catalogo_items?.nombre_generico || i.detalle || 'Insumo'}`).join(', ');
          viaje.donacionId = servicio.id;
        } else {
          viaje.origen = { lat: p.lat, lon: p.lon, direccion: 'Tu ubicación' };
          viaje.destino = { lat: servicio.necesidades?.lat, lon: servicio.necesidades?.lon, direccion: servicio.necesidades?.punto || 'Destino' };
          viaje.nombreOrigen = 'Tu ubicación';
          viaje.nombreDestino = servicio.necesidades?.punto || 'Destino';
          viaje.telefonoOrigen = '';
          viaje.telefonoDestino = servicio.necesidades?.contacto || '';
          viaje.productos = (servicio.items_despachados || []).map(i => `${i.cantidad} ${i.unidad || ''} ${i.catalogo_items?.nombre_generico || i.detalle || 'Insumo'}`).join(', ');
          viaje.despachoId = servicio.id;
        }
      }
      VoluntarioStateCore.viajeEnCurso = viaje;
      VoluntarioStateCore.guardarViaje();
      Mensaje.mostrar('✅ Viaje aceptado. Ve a la ruta.', 'exito');
      VoluntarioRouter.navegar('viaje-activo');
      this.cargarServicios();
    } catch (e) { Mensaje.mostrar('❌ ' + e.message, 'error'); }
  }
};
