// @build: 2026-07-02.00-00-00 | id: VOL-VIAJE-ACTIVO-V5 | desc: Panel de 4 filas dinámico según tipo de viaje (recolección/distribución)
window.VoluntarioViajeActivo = {
  mapa: null,
  watchId: null,
  marcadorConductor: null,
  rutaActual: null,
  abortControllerOSRM: null,
  timerInterval: null,
  segundosTranscurridos: 0,

  _iconoVehiculo() {
    const tipo = (VoluntarioStateCore.perfil && VoluntarioStateCore.perfil.tipo_vehiculo) ? VoluntarioStateCore.perfil.tipo_vehiculo : 'moto';
    const iconos = { moto: '🏍️', carro: '🚗', camioneta: '🚛', bicicleta: '🚲', a_pie: '🚶' };
    const emoji = iconos[tipo] || '📍';
    return L.divIcon({
      html: '<div style="font-size: 32px; text-align: center; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">' + emoji + '</div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
      className: ''
    });
  },

  _iniciarTemporizador() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.segundosTranscurridos = 0;
    const timerEl = document.getElementById('detalle-temporizador');
    if (!timerEl) return;
    const actualizar = () => {
      this.segundosTranscurridos++;
      const h = Math.floor(this.segundosTranscurridos / 3600).toString().padStart(2, '0');
      const m = Math.floor((this.segundosTranscurridos % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(this.segundosTranscurridos % 60).toString().padStart(2, '0');
      timerEl.textContent = h + ':' + m + ':' + s;
    };
    actualizar();
    this.timerInterval = setInterval(actualizar, 1000);
  },

  _detenerTemporizador() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  },

  init() {
    const v = VoluntarioStateCore.viajeEnCurso;
    if (!v) { VoluntarioRouter.navegar('explorar'); return; }

    this.bloquearNavegacion();
    VoluntarioNotificaciones.suscribirEntrega();
    this._iniciarTemporizador();

    if (!this.mapa) {
      const coords = v.origen || { lat: perfil.lat || 10.48, lon: perfil.lon || -66.90 };
      this.mapa = L.map('mapa-viaje-activo').setView([coords.lat, coords.lon], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.mapa);
    } else {
      this.mapa.invalidateSize();
    }

    this.mapa.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.GeoJSON) this.mapa.removeLayer(layer);
    });

    if (v.origen?.lat && v.origen?.lon) {
      L.marker([v.origen.lat, v.origen.lon], { icon: L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }) }).addTo(this.mapa).bindPopup('<b>Origen</b><br>' + (v.origen.direccion || ''));
    }
    if (v.destino?.lat && v.destino?.lon) {
      L.marker([v.destino.lat, v.destino.lon], { icon: L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }) }).addTo(this.mapa).bindPopup('<b>Destino</b><br>' + (v.nombreDestino || ''));
    }

    // Distancia en el panel
    if (v.origen?.lat && v.destino?.lat) {
      const dist = VoluntarioUtils.calcularDistancia(v.origen.lat, v.origen.lon, v.destino.lat, v.destino.lon);
      const distEl = document.getElementById('detalle-distancia');
      if (distEl) distEl.textContent = dist + ' km';
    }

    // Ruta OSRM
    if (v.origen?.lat && v.destino?.lat) {
      this.rutaActual = L.polyline([[v.origen.lat, v.origen.lon], [v.destino.lat, v.destino.lon]], { color: '#2563eb', weight: 4, opacity: 0.7, dashArray: '10, 10' }).addTo(this.mapa);
      this.mapa.fitBounds([[v.origen.lat, v.origen.lon], [v.destino.lat, v.destino.lon]], { padding: [50, 50] });

      if (this.abortControllerOSRM) this.abortControllerOSRM.abort();
      this.abortControllerOSRM = new AbortController();
      const timeoutId = setTimeout(() => this.abortControllerOSRM.abort(), 5000);
      fetch('https://routing.openstreetmap.de/routed-car/route/v1/driving/' + v.origen.lon + ',' + v.origen.lat + ';' + v.destino.lon + ',' + v.destino.lat + '?geometries=geojson&overview=full', { signal: this.abortControllerOSRM.signal })
        .then(r => r.json())
        .then(data => {
          clearTimeout(timeoutId);
          if (data.routes?.length && data.routes[0].geometry) {
            if (this.rutaActual) this.mapa.removeLayer(this.rutaActual);
            this.rutaActual = L.geoJSON(data.routes[0].geometry, { style: { color: '#2563eb', weight: 5, opacity: 0.8 } }).addTo(this.mapa);
            this.mapa.fitBounds(L.geoJSON(data.routes[0].geometry).getBounds().pad(0.1));
          }
        })
        .catch(() => {});
    }

    // GPS
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        pos => {
          const lat = pos.coords.latitude, lon = pos.coords.longitude;
          if (this.marcadorConductor) this.mapa.removeLayer(this.marcadorConductor);
          this.marcadorConductor = L.marker([lat, lon], { icon: this._iconoVehiculo(), zIndexOffset: 1000 })
            .addTo(this.mapa)
            .bindPopup('<b>📍 Tú estás aquí</b>');
          if (v.destino?.lat) {
            const eta = VoluntarioUtils.calcularETA(lat, lon, v.destino.lat, v.destino.lon, VoluntarioStateCore.perfil?.tipo_vehiculo);
            const etaEl = document.getElementById('detalle-eta');
            if (etaEl) etaEl.textContent = eta;
          }
        },
        err => console.warn('GPS error:', err),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }

    // ──── RELLENAR LAS 4 FILAS DEL PANEL ────

    // Fila 1: Cliente (donante o centro de acopio)
    if (v.tipo === 'recoleccion') {
      document.getElementById('detalle-icono-cliente').className = 'fa-solid fa-circle-user';
      document.getElementById('detalle-icono-cliente').style.color = '#2563eb';
      document.getElementById('detalle-etiqueta-cliente').textContent = 'Nombre:';
      document.getElementById('detalle-cliente-nombre').textContent = v.nombreOrigen || 'Donante';
    } else {
      document.getElementById('detalle-icono-cliente').className = 'fa-solid fa-building';
      document.getElementById('detalle-icono-cliente').style.color = '#6366f1';
      document.getElementById('detalle-etiqueta-cliente').textContent = 'Centro de Acopio:';
      document.getElementById('detalle-cliente-nombre').textContent = v.nombreOrigen || 'Centro de Acopio';
    }

    // Fila 2: Origen (solo dirección)
    document.getElementById('detalle-origen-nombre').textContent = ''; // no se usa, se deja vacío o se oculta
    document.getElementById('detalle-origen-direccion').textContent = v.origen?.direccion || '';

    // Fila 3: Destino (solo nombre)
    document.getElementById('detalle-destino-nombre').textContent = v.nombreDestino || 'Punto de entrega';
    document.getElementById('detalle-destino-direccion').textContent = ''; // no se usa dirección

    // Fila 4: Recursos
    const productosTexto = v.productos || '';
    const numItems = productosTexto.split(',').filter(p => p.trim()).length;
    document.getElementById('detalle-productos').textContent = numItems > 2 ? 'Varios Recursos' : (productosTexto || 'Sin productos');

    // ETA y temporizador
    document.getElementById('detalle-eta').textContent = 'Calculando...';
    document.getElementById('detalle-temporizador').textContent = '00:00:00';

    // Botones de acción
    const btnAccion = document.getElementById('btn-accion-principal');
    if (v.tipo === 'recoleccion' && v.estado === 'asignada') {
      btnAccion.textContent = '✅ Ya tengo la donación';
      btnAccion.onclick = () => VoluntarioMisViajes.confirmarRecogida(v.donacionId, v.entregaId || '');
    } else {
      btnAccion.textContent = '✅ Confirmar Entrega';
      btnAccion.onclick = () => VoluntarioMisViajes.confirmarEntrega(v.entregaId || v.despachoId);
    }
    document.getElementById('btn-cancelar-viaje').onclick = () => VoluntarioCancelarModal.abrir(v.entregaId || v.despachoId || v.id, () => {
      VoluntarioStateCore.limpiarViajeGuardado();
      this.salir();
    });

    // Panel
    const panel = document.getElementById('panel-detalles-viaje');
    const barraAcciones = document.getElementById('barra-acciones-viaje');
    if (barraAcciones) panel.style.bottom = barraAcciones.offsetHeight + 'px';
    const flecha = document.getElementById('flecha-detalles');
    let panelAbierto = false;
    panel.classList.remove('abierto');
    flecha.querySelector('span').textContent = '▲';
    flecha.onclick = () => {
      panelAbierto = !panelAbierto;
      panel.classList.toggle('abierto', panelAbierto);
      flecha.querySelector('span').textContent = panelAbierto ? '▼' : '▲';
      setTimeout(() => this.mapa.invalidateSize(), 300);
    };

    // Menú de apps de mapas
    const btnMaps = document.getElementById('btn-google-maps');
    btnMaps.style.display = 'block';
    this._crearMenuMapas(btnMaps, v);

    // Botón de emergencia
    this._crearBotonEmergencia();

    // Contactos
    const telefono = v.tipo === 'recoleccion' ? v.telefonoOrigen : v.telefonoDestino;
    document.getElementById('btn-llamar').onclick = () => {
      if (telefono) window.location.href = 'tel:' + telefono;
      else Mensaje.mostrar('No hay teléfono disponible', 'error');
    };
    document.getElementById('btn-whatsapp').onclick = () => {
      if (telefono) window.open('https://wa.me/58' + telefono.replace(/^0/, ''), '_blank');
      else Mensaje.mostrar('No hay teléfono disponible', 'error');
    };
  },

  _crearMenuMapas(btnMaps, v) {
    const menuId = 'menu-apps-mapas';
    let menu = document.getElementById(menuId);
    if (!menu) {
      menu = document.createElement('div');
      menu.id = menuId;
      menu.style.cssText = 'position:fixed; top:135px; right:12px; z-index:3000; background:white; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.15); padding:8px; display:none;';
      document.body.appendChild(menu);
    }
    btnMaps.onclick = (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    };
    document.addEventListener('click', () => menu.style.display = 'none');
    menu.onclick = (e) => e.stopPropagation();

    const opciones = [
      { nombre: 'Google Maps', url: 'https://www.google.com/maps/dir/?api=1&destination=' + v.destino.lat + ',' + v.destino.lon },
      { nombre: 'Waze', url: 'https://waze.com/ul?ll=' + v.destino.lat + ',' + v.destino.lon + '&navigate=yes' },
      { nombre: 'Apple Maps', url: 'maps://maps.apple.com/?daddr=' + v.destino.lat + ',' + v.destino.lon },
      { nombre: 'Cualquier app', url: 'geo:' + v.destino.lat + ',' + v.destino.lon + '?q=' + v.destino.lat + ',' + v.destino.lon }
    ];
    menu.innerHTML = opciones.map(o => '<a href="' + o.url + '" target="_blank" style="display:block; padding:8px 12px; color:var(--text-main); text-decoration:none; border-radius:8px;">' + o.nombre + '</a>').join('');
  },

  _crearBotonEmergencia() {
    const btnEmergencia = document.createElement('button');
    btnEmergencia.className = 'btn btn-danger';
    btnEmergencia.innerHTML = '<i class="fa-solid fa-siren-on"></i> EMERGENCIA';
    btnEmergencia.style.cssText = 'position:fixed; bottom:80px; right:12px; z-index:3000; border-radius:50%; width:56px; height:56px; font-size:12px; font-weight:700;';
    document.body.appendChild(btnEmergencia);
    btnEmergencia.onclick = async () => {
      if (!confirm('¿Activar botón de emergencia? Se notificará a los administradores con tu ubicación actual.')) return;
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          await apiFetch('/api/emergencias', { method: 'POST', body: JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude }) });
          Mensaje.mostrar('🚨 Emergencia reportada. Los administradores han sido notificados.', 'exito');
        } catch (e) { Mensaje.mostrar('❌ Error al reportar emergencia: ' + e.message, 'error'); }
      }, () => { Mensaje.mostrar('No se pudo obtener ubicación para la emergencia', 'error'); });
    };
    this._btnEmergencia = btnEmergencia;
  },

  bloquearNavegacion() {
    const nav = document.getElementById('bottom-nav-voluntario');
    if (nav) nav.style.display = 'none';
    document.getElementById('btn-modo-conductor').style.display = 'none';
    document.getElementById('btn-gps-header').style.display = 'none';
    document.getElementById('btn-cerrar-header').style.display = 'none';
  },

  desbloquearNavegacion() {
    const nav = document.getElementById('bottom-nav-voluntario');
    if (nav) nav.style.display = 'flex';
    document.getElementById('btn-modo-conductor').style.display = '';
    document.getElementById('btn-gps-header').style.display = '';
    document.getElementById('btn-cerrar-header').style.display = '';
  },

  salir() {
    this._detenerTemporizador();
    if (this.watchId) { navigator.geolocation.clearWatch(this.watchId); this.watchId = null; }
    if (this.marcadorConductor && this.mapa) this.mapa.removeLayer(this.marcadorConductor);
    if (this.rutaActual && this.mapa) this.mapa.removeLayer(this.rutaActual);
    if (this.abortControllerOSRM) this.abortControllerOSRM.abort();
    document.getElementById('btn-google-maps').style.display = 'none';
    document.getElementById('panel-detalles-viaje').classList.remove('abierto');
    const menu = document.getElementById('menu-apps-mapas');
    if (menu) menu.remove();
    if (this._btnEmergencia) { this._btnEmergencia.remove(); this._btnEmergencia = null; }
    VoluntarioNotificaciones.limpiarEntrega();
    this.desbloquearNavegacion();
    VoluntarioRouter.navegar('explorar');
  }
};
