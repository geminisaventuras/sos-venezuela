// @build: 2026-07-01.15-45-00 | id: VOL-CANCELAR-V1 | desc: Modal de cancelación de viaje con motivo obligatorio
window.VoluntarioCancelarModal = {
  abrir(entregaId, callback) {
    const container = document.createElement('div');
    container.innerHTML = '<h3 style="margin-bottom:16px;">🗑️ Cancelar Viaje</h3><p style="color:var(--text-muted); margin-bottom:12px;">Seleccione el motivo de cancelación</p><div class="form-group"><label>Motivo *</label><select id="cancel-motivo" required><option value="">-- Seleccione --</option><option value="accidentado">Accidentado</option><option value="no_comunicacion">No me pude comunicar</option><option value="ubicacion_incorrecta">Ubicación incorrecta</option><option value="otro">Otro</option></select></div><div class="form-group" id="cancel-otro-group" style="display:none;"><label>Especifique *</label><textarea id="cancel-otro-texto" maxlength="500" rows="3" placeholder="Describa el motivo"></textarea></div><div style="display:flex; gap:10px; margin-top:16px;"><button id="modal-confirmar-cancel" class="btn btn-danger" style="flex:1;">Sí, cancelar viaje</button><button id="modal-cancelar-cancel" class="btn btn-outline" style="flex:1;">No cancelar</button></div>';
    Modal.abrir(container.innerHTML);
    requestAnimationFrame(() => {
      const motivoSelect = document.getElementById('cancel-motivo');
      const otroGrupo = document.getElementById('cancel-otro-group');
      const otroTexto = document.getElementById('cancel-otro-texto');
      motivoSelect.addEventListener('change', function() { otroGrupo.style.display = this.value === 'otro' ? 'block' : 'none'; });
      document.getElementById('modal-confirmar-cancel').onclick = async () => {
        const motivo = motivoSelect.value;
        if (!motivo) { alert('Seleccione un motivo'); return; }
        let descripcion = '';
        if (motivo === 'otro') { descripcion = otroTexto.value.trim(); if (!descripcion) { alert('Describa el motivo'); return; } }
        Modal.cerrar();
        try {
          await apiFetch('/api/entregas/' + entregaId, { method: 'PATCH', body: JSON.stringify({ estado: 'cancelada', motivo: motivo, descripcion: descripcion || motivoSelect.options[motivoSelect.selectedIndex].text }) });
          Mensaje.mostrar('🗑️ Viaje cancelado. Motivo registrado.', 'exito');
          if (callback) callback();
        } catch (e) { Mensaje.mostrar('❌ ' + e.message, 'error'); }
      };
      document.getElementById('modal-cancelar-cancel').onclick = () => Modal.cerrar();
    });
  }
};
