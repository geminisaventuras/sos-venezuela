// @build: 2026-07-01.16-45-00 | id: VOL-PERFIL-V1 | desc: Carga y edición del perfil del voluntario
window.VoluntarioPerfil = {
  async cargar() {
    const div = document.getElementById('perfil-contenido');
    div.innerHTML = '<div class="loading">Cargando perfil...</div>';
    try {
      const res = await apiFetch('/api/voluntarios/mi-perfil');
      const data = res.data;
      const completo = data && data.nombre && data.telefono && data.tipo_vehiculo && data.lat && data.lon;
      VoluntarioStateCore.perfilCargado = true;
      if (!completo) {
        VoluntarioStateCore.perfil = null;
        div.innerHTML = '<div class="alert-aviso"><i class="fa-solid fa-triangle-exclamation"></i> Para aceptar viajes necesitas completar: nombre, teléfono, vehículo y ubicación base.</div><button class="btn btn-primary" onclick="VoluntarioPerfil.mostrarFormulario()">📝 Completar Ficha</button>';
        return;
      }
      VoluntarioStateCore.perfil = data;
      div.innerHTML = '<p><strong>Nombre:</strong> ' + VoluntarioUtils.escapeHTML(data.nombre) + '</p><p><strong>Teléfono:</strong> ' + VoluntarioUtils.escapeHTML(data.telefono) + '</p><p><strong>Vehículo:</strong> ' + VoluntarioUtils.escapeHTML(data.tipo_vehiculo) + '</p><p><strong>Capacidad de carga:</strong> ' + VoluntarioUtils.escapeHTML(data.capacidad_carga || '') + '</p><p><strong>📍 Ubicación base:</strong> ' + (data.lat ? data.lat.toFixed(5) + ', ' + data.lon.toFixed(5) : 'No configurada') + '</p><button class="btn btn-primary" onclick="VoluntarioPerfil.mostrarFormulario()">✏️ Editar Ficha</button>';
    } catch (e) { VoluntarioStateCore.perfilCargado = true; div.innerHTML = '<div class="empty-state">Error al cargar perfil</div>'; }
  },

  mostrarFormulario() {
    const p = VoluntarioStateCore.perfil || {};
    Modal.abrir('<h3>' + (VoluntarioStateCore.perfil ? 'Editar' : 'Crear') + ' Ficha de Transportista</h3><div class="form-group"><label>Nombre completo</label><input type="text" id="perfil-nombre" value="' + VoluntarioUtils.escapeHTML(p.nombre || '') + '" required></div><div class="form-group"><label>Teléfono</label><input type="tel" id="perfil-telefono" value="' + VoluntarioUtils.escapeHTML(p.telefono || '') + '" required pattern="[0-9]{7,15}"></div><div class="form-group"><label>Vehículo</label><select id="perfil-vehiculo"><option value="moto"' + (p.tipo_vehiculo === 'moto' ? ' selected' : '') + '>🏍️ Moto</option><option value="carro"' + (p.tipo_vehiculo === 'carro' ? ' selected' : '') + '>🚗 Carro</option><option value="camioneta"' + (p.tipo_vehiculo === 'camioneta' ? ' selected' : '') + '>🚛 Camioneta</option><option value="bicicleta"' + (p.tipo_vehiculo === 'bicicleta' ? ' selected' : '') + '>🚲 Bicicleta</option><option value="a_pie"' + (p.tipo_vehiculo === 'a_pie' ? ' selected' : '') + '>🚶 A pie</option></select></div><div class="form-group"><label>Capacidad de carga</label><input type="text" id="perfil-capacidad" value="' + VoluntarioUtils.escapeHTML(p.capacidad_carga || '') + '" placeholder="Ej: 80 kg, 3 bultos"></div><div class="form-group"><label>📍 Ubicación base</label><button type="button" class="btn btn-outline btn-sm" id="btn-gps-perfil" onclick="VoluntarioPerfil.obtenerGPS()"><i class="fa-solid fa-location-crosshairs"></i> Usar GPS</button><input type="hidden" id="perfil-lat" value="' + (p.lat || '') + '"><input type="hidden" id="perfil-lon" value="' + (p.lon || '') + '"><p id="perfil-coords" style="font-size:12px; color:var(--accent); margin-top:4px;">' + (p.lat ? p.lat.toFixed(5) + ', ' + p.lon.toFixed(5) : '') + '</p></div><div style="display:flex; gap:10px; margin-top:16px;"><button id="modal-guardar-perfil" class="btn btn-primary" style="flex:1;">💾 Guardar</button><button id="modal-cancelar-perfil" class="btn btn-outline" style="flex:1;">Cancelar</button></div>');
    document.getElementById('modal-guardar-perfil').onclick = async () => {
      const datos = {
        telefono: document.getElementById('perfil-telefono').value.trim(),
        nombre: document.getElementById('perfil-nombre').value.trim(),
        tipo_vehiculo: document.getElementById('perfil-vehiculo').value,
        capacidad_carga: document.getElementById('perfil-capacidad').value.trim(),
        lat: parseFloat(document.getElementById('perfil-lat').value) || null,
        lon: parseFloat(document.getElementById('perfil-lon').value) || null,
        activo: true
      };
      try {
        await apiFetch('/api/voluntarios', { method: 'POST', body: JSON.stringify(datos) });
        Mensaje.mostrar('✅ Ficha guardada', 'exito');
        Modal.cerrar();
        this.cargar();
      } catch (e) { Mensaje.mostrar('❌ ' + e.message, 'error'); }
    };
    document.getElementById('modal-cancelar-perfil').onclick = () => Modal.cerrar();
  },

  obtenerGPS() {
    if (!navigator.geolocation) { alert('GPS no disponible'); return; }
    const btn = document.getElementById('btn-gps-perfil');
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    navigator.geolocation.getCurrentPosition(pos => {
      document.getElementById('perfil-lat').value = pos.coords.latitude;
      document.getElementById('perfil-lon').value = pos.coords.longitude;
      document.getElementById('perfil-coords').innerText = pos.coords.latitude.toFixed(5) + ', ' + pos.coords.longitude.toFixed(5);
      btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Usar GPS';
    }, () => { alert('No se pudo obtener ubicación'); btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Usar GPS'; }, { enableHighAccuracy: true, timeout: 10000 });
  }
};
