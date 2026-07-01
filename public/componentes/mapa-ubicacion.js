// @build: 2026-06-30.10-00-00 | id: COMP-MAPAUBICACION-V1 | desc: Componente de mapa unificado con autocompletado, GPS y guardado en perfil
window.MapaUbicacion = {
  _mapa: null,
  _marcador: null,
  _config: {},

  /**
   * Inicializa el mapa con búsqueda de direcciones y GPS.
   * @param {object} config
   * @param {string} config.mapaContenedorId - ID del div donde se renderiza el mapa.
   * @param {string} config.inputDireccionId - ID del input de dirección.
   * @param {string} config.resultadosDireccionId - ID del div para el dropdown de sugerencias.
   * @param {string} config.inputLatId - ID del input oculto para latitud.
   * @param {string} config.inputLonId - ID del input oculto para longitud.
   * @param {boolean} [config.mostrarBotonGPS=true] - Si se muestra el botón "Usar mi ubicación GPS".
   * @param {boolean} [config.mostrarGuardarPerfil=true] - Si se muestra el checkbox para guardar en perfil.
   * @param {number} [config.zoomInicial=12] - Zoom inicial del mapa.
   * @param {function} [config.alSeleccionar] - Callback al seleccionar ubicación (lat, lon, direccion).
   */
  init(config) {
    this._config = config;

    // 1. Inicializar mapa
    this._initMapa();

    // 2. Configurar autocompletado de direcciones
    this._setupAutocompletado();

    // 3. Configurar botón GPS si se solicita
    if (config.mostrarBotonGPS !== false) {
      this._setupBotonGPS();
    }

    // 4. Mostrar checkbox de guardar en perfil si se solicita
    if (config.mostrarGuardarPerfil !== false) {
      this._setupGuardarPerfil();
    }
  },

  _initMapa() {
    const contenedor = document.getElementById(this._config.mapaContenedorId);
    if (!contenedor) return;

    const latInicial = 10.48;
    const lonInicial = -66.90;
    contenedor.style.display = 'block';

    this._mapa = L.map(this._config.mapaContenedorId).setView([latInicial, lonInicial], this._config.zoomInicial || 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      referrerPolicy: 'strict-origin-when-cross-origin'
    }).addTo(this._mapa);

    this._mapa.on('click', (e) => {
      this._colocarMarcador(e.latlng.lat, e.latlng.lng);
      this._geocodificarInversa(e.latlng.lat, e.latlng.lng);
    });

    // Si ya hay coordenadas en los inputs ocultos, centrar el mapa allí
    const latInput = document.getElementById(this._config.inputLatId);
    const lonInput = document.getElementById(this._config.inputLonId);
    if (latInput && lonInput && latInput.value && lonInput.value) {
      const lat = parseFloat(latInput.value);
      const lon = parseFloat(lonInput.value);
      this._mapa.setView([lat, lon], 15);
      this._colocarMarcador(lat, lon);
    }
  },

  _colocarMarcador(lat, lon) {
    if (this._marcador) {
      this._mapa.removeLayer(this._marcador);
    }
    this._marcador = L.marker([lat, lon], { draggable: true }).addTo(this._mapa);
    this._marcador.on('dragend', () => {
      const pos = this._marcador.getLatLng();
      this._setCoords(pos.lat, pos.lng);
      this._geocodificarInversa(pos.lat, pos.lng);
    });
    this._setCoords(lat, lon);
  },

  _setCoords(lat, lon) {
    const latInput = document.getElementById(this._config.inputLatId);
    const lonInput = document.getElementById(this._config.inputLonId);
    if (latInput) latInput.value = lat.toFixed(6);
    if (lonInput) lonInput.value = lon.toFixed(6);
  },

  async _geocodificarInversa(lat, lon) {
    const inputDireccion = document.getElementById(this._config.inputDireccionId);
    if (!inputDireccion) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data?.display_name) {
        inputDireccion.value = data.display_name;
      }
    } catch (e) {
      console.error('Error en geocodificación inversa', e);
    }
  },

  _setupAutocompletado() {
    const input = document.getElementById(this._config.inputDireccionId);
    const resultadosDiv = document.getElementById(this._config.resultadosDireccionId);
    if (!input || !resultadosDiv) return;

    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const texto = input.value.trim();
      if (texto.length < 3) {
        resultadosDiv.innerHTML = '';
        resultadosDiv.style.display = 'none';
        return;
      }
      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}&countrycodes=ve`);
          const data = await res.json();
          if (!data || data.length === 0) {
            resultadosDiv.innerHTML = '';
            resultadosDiv.style.display = 'none';
            return;
          }
          resultadosDiv.innerHTML = data.map(item => `
            <div class="search-result-item" data-lat="${item.lat}" data-lon="${item.lon}" data-display="${item.display_name.replace(/"/g, '&quot;')}">
              ${item.display_name}
            </div>
          `).join('');
          resultadosDiv.style.display = 'block';
        } catch (e) {
          resultadosDiv.innerHTML = '';
          resultadosDiv.style.display = 'none';
        }
      }, 300);
    });

    resultadosDiv.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;
      const lat = parseFloat(item.dataset.lat);
      const lon = parseFloat(item.dataset.lon);
      const display = item.dataset.display.replace(/&quot;/g, '"');
      input.value = display;
      resultadosDiv.innerHTML = '';
      resultadosDiv.style.display = 'none';
      this._mapa.setView([lat, lon], 15);
      this._colocarMarcador(lat, lon);
      if (this._config.alSeleccionar) {
        this._config.alSeleccionar(lat, lon, display);
      }
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !resultadosDiv.contains(e.target)) {
        resultadosDiv.innerHTML = '';
        resultadosDiv.style.display = 'none';
      }
    });
  },

  _setupBotonGPS() {
  const container = document.getElementById('mapa-botones-gps');
  if (!container) return;

  container.style.display = 'flex';
  container.style.gap = '10px';
  container.style.marginTop = '10px';

  container.innerHTML = `
    <button type="button" id="btn-gps-actual" class="btn btn-outline" style="flex:1;">
      <i class="fa-solid fa-location-crosshairs"></i> Ubicación actual
    </button>
    <button type="button" id="btn-gps-guardada" class="btn btn-outline" style="flex:1;">
      <i class="fa-solid fa-map-pin"></i> Ubicación guardada
    </button>
  `;

  document.getElementById('btn-gps-actual').addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada.');
      return;
    }
    const btn = document.getElementById('btn-gps-actual');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
    btn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this._mapa.setView([pos.coords.latitude, pos.coords.longitude], 15);
        this._colocarMarcador(pos.coords.latitude, pos.coords.longitude);
        this._geocodificarInversa(pos.coords.latitude, pos.coords.longitude);
        btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Ubicación actual';
        btn.disabled = false;
      },
      () => {
        alert('No se pudo obtener la ubicación GPS.');
        btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Ubicación actual';
        btn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  document.getElementById('btn-gps-guardada').addEventListener('click', () => {
    const lat = typeof perfil !== 'undefined' ? perfil.lat : null;
    const lon = typeof perfil !== 'undefined' ? perfil.lon : null;
    if (!lat || !lon) {
      alert('No tienes una ubicación guardada en tu perfil.');
      return;
    }
    this._mapa.setView([lat, lon], 15);
    this._colocarMarcador(lat, lon);
    this._geocodificarInversa(lat, lon);
  });
},

  _setupGuardarPerfil() {
    const checkbox = document.getElementById('guardar-ubicacion-principal');
    if (!checkbox) return;
    // El guardado se realiza en el momento de enviar el formulario que use esta ubicación.
    // Se expone un método público para que la página llame cuando quiera persistir.
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        this.guardarEnPerfil();
      }
    });
  },

  async guardarEnPerfil() {
    const lat = parseFloat(document.getElementById(this._config.inputLatId)?.value);
    const lon = parseFloat(document.getElementById(this._config.inputLonId)?.value);
    const direccion = document.getElementById(this._config.inputDireccionId)?.value;
    if (!lat || !lon) return;
    try {
      await apiFetch('/api/perfil', {
        method: 'POST',
        body: JSON.stringify({
          rol: perfil.rol,
          nombre: perfil.nombre_punto || perfil.nombre,
          telefono: perfil.telefono || '',
          lat,
          lon,
          direccion_exacta: direccion
        })
      });
      if (window.Mensaje) {
        Mensaje.mostrar('📍 Ubicación guardada en tu perfil', 'exito');
      }
    } catch (e) {
      if (window.Mensaje) {
        Mensaje.mostrar('❌ No se pudo guardar la ubicación', 'error');
      }
    }
  }
};