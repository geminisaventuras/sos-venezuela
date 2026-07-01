// @build: 2026-07-01.17-15-00 | id: VOL-MIS-VIAJES-V2 | desc: Corrección de paginación: el filtro no reinicia la página, solo cambiarFiltro lo hace
window.VoluntarioMisViajes = {
  misViajes: [],
  filtroEstado: 'activos',
  pagina: 1,
  ITEMS_POR_PAGINA: 5,

  async cargar() {
    if (!VoluntarioStateCore.perfil) { await VoluntarioPerfil.cargar(); if (!VoluntarioStateCore.perfil) return; }
    const lista = document.getElementById('lista-mis-viajes');
    lista.innerHTML = '<div class="loading">Cargando historial...</div>';
    try {
      const res = await apiFetch('/api/entregas?voluntario=' + encodeURIComponent(VoluntarioStateCore.perfil.telefono));
      this.misViajes = res.data || [];
      const retomarContainer = document.getElementById('retomar-viaje-container');
      if (VoluntarioStateCore.viajeEnCurso) retomarContainer.style.display = 'block';
      else retomarContainer.style.display = 'none';
      this.pagina = 1;
      this.filtrar(this.filtroEstado);
    } catch (e) { lista.innerHTML = '<div class="empty-state">Error al cargar viajes</div>'; }
  },

  cambiarFiltro(filtro) {
    this.pagina = 1;
    this.filtrar(filtro);
  },

  filtrar(filtro) {
    this.filtroEstado = filtro;
    let datos = this.misViajes;
    if (filtro === 'activos') datos = datos.filter(v => !['entregada', 'cancelada'].includes(v.estado));
    else if (filtro === 'completados') datos = datos.filter(v => ['entregada', 'cancelada'].includes(v.estado));
    this.renderizar(datos);
  },

  renderizar(datos) {
    const lista = document.getElementById('lista-mis-viajes');
    if (!datos.length) {
      lista.innerHTML = '<div class="empty-state">Sin viajes en esta categoría</div>';
      document.getElementById('paginacion-mis-viajes').style.display = 'none';
      return;
    }
    const total = Math.ceil(datos.length / this.ITEMS_POR_PAGINA);
    if (this.pagina > total) this.pagina = total;
    if (this.pagina < 1) this.pagina = 1;
    const inicio = (this.pagina - 1) * this.ITEMS_POR_PAGINA;
    const paginaDatos = datos.slice(inicio, inicio + this.ITEMS_POR_PAGINA);
    lista.innerHTML = paginaDatos.map(v => {
      const esActivo = !['entregada', 'cancelada'].includes(v.estado);
      const tipo = v.tipo_servicio === 'recoleccion' ? '📦 Recolección' : '🚚 Distribución';
      const detalle = v.detalle || {};
      const direccion = VoluntarioUtils.escapeHTML(v.tipo_servicio === 'recoleccion' ? (detalle.direccion_recogida || detalle.direccion || 'No registrada') : (detalle.punto || detalle.direccion || 'Destino'));
      const lat = detalle.lat_recogida || detalle.lat;
      const lon = detalle.lon_recogida || detalle.lon;
      const enlace = (lat && lon) ? '<a href="https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lon + '" target="_blank" class="btn btn-outline btn-sm" style="margin-top:8px;"><i class="fa-solid fa-location-arrow"></i> Abrir en Mapas</a>' : '';
      let acciones = '';
      if (esActivo) {
        if (v.tipo_servicio === 'recoleccion' && v.estado === 'asignada') acciones += '<button class="btn btn-success btn-sm" onclick="VoluntarioMisViajes.confirmarRecogida(\'' + v.donacion_id + '\', \'' + v.id + '\')" style="margin-top:6px;">✅ Ya tengo la donación</button>';
        if (v.tipo_servicio === 'distribucion' && v.estado === 'en_transito_a_destino') acciones += '<button class="btn btn-success btn-sm" onclick="VoluntarioMisViajes.confirmarEntrega(\'' + v.id + '\')" style="margin-top:6px;">✅ Confirmar Entrega</button>';
        acciones += '<button class="btn btn-danger btn-sm" onclick="VoluntarioCancelarModal.abrir(\'' + v.id + '\', () => { VoluntarioStateCore.limpiarViajeGuardado(); VoluntarioViajeActivo.salir(); })" style="margin-top:6px;">🗑️ Cancelar Viaje</button>';
      }
      return '<div class="entrega-item"><div class="entrega-header"><strong>' + tipo + '</strong><span class="badge badge-' + (v.estado === 'entregada' ? 'recibida' : v.estado === 'cancelada' ? 'cancelada' : 'en_transito') + '">' + VoluntarioUtils.escapeHTML(v.estado.replace(/_/g, ' ')) + '</span></div><p style="font-size:14px;">📍 ' + direccion + '</p><p style="font-size:12px; color:var(--text-muted);">📅 ' + new Date(v.fecha_creacion).toLocaleString('es-VE') + '</p>' + acciones + ' ' + enlace + '</div>';
    }).join('');
    const pagDiv = document.getElementById('paginacion-mis-viajes');
    if (total > 1) {
      pagDiv.style.display = 'flex';
      pagDiv.innerHTML = '<button class="btn btn-outline btn-sm" ' + (this.pagina === 1 ? 'disabled' : '') + ' onclick="VoluntarioMisViajes.cambiarPagina(-1)">←</button><span>' + this.pagina + ' / ' + total + '</span><button class="btn btn-outline btn-sm" ' + (this.pagina === total ? 'disabled' : '') + ' onclick="VoluntarioMisViajes.cambiarPagina(1)">→</button>';
    } else {
      pagDiv.style.display = 'none';
    }
  },

  cambiarPagina(dir) { this.pagina += dir; this.filtrar(this.filtroEstado); },

  async confirmarRecogida(donacionId, entregaId) {
    try {
      await apiFetch('/api/donaciones/' + donacionId + '/recoger', { method: 'PATCH' });
      Mensaje.mostrar('✅ Recogida confirmada', 'exito');
      if (VoluntarioStateCore.viajeEnCurso) {
        VoluntarioStateCore.viajeEnCurso.estado = 'en_transito_a_acopio';
        VoluntarioStateCore.guardarViaje();
        document.getElementById('btn-accion-principal').textContent = '✅ Confirmar Entrega';
        document.getElementById('btn-accion-principal').onclick = () => this.confirmarEntrega(entregaId);
      }
      this.cargar();
    } catch (e) { Mensaje.mostrar('❌ ' + e.message, 'error'); }
  },

  async confirmarEntrega(entregaId) {
    try {
      await apiFetch('/api/entregas/' + entregaId, { method: 'PATCH', body: JSON.stringify({ estado: 'entregada' }) });
      Mensaje.mostrar('✅ Entrega confirmada. ¡Viaje completado!', 'exito');
      VoluntarioStateCore.limpiarViajeGuardado();
      VoluntarioViajeActivo.salir();
      this.cargar();
    } catch (e) { Mensaje.mostrar('❌ ' + e.message, 'error'); }
  }
};
