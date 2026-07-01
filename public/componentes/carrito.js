// @build: 2026-06-30.17-30-00 | id: COMP-CARRITO-V7 | desc: Restauración robusta de edición y vaciado con requestAnimationFrame
window.CarritoInsumos = {
  _items: [],
  _contenedor: null,
  _onChange: null,
  _modo: 'donacion',
  _storageKey: 'carrito_insumos',

  _mapearTipoAPI(categoria) {
    const mapa = {
      'medico': 'medicinas',
      'alimentos': 'alimentos_no_perecibles',
      'agua': 'agua_potable',
      'ropa_calzado': 'ropa',
      'colchonetas': 'colchonetas',
      'higiene': 'higiene',
      'logistica': 'otros'
    };
    return mapa[categoria] || 'otros';
  },

  init(config) {
    this._contenedor = document.getElementById(config.contenedorId);
    this._modo = config.modo || 'donacion';
    this._onChange = config.onChange || null;
    this._storageKey = 'carrito_insumos_' + this._modo;

    const guardado = localStorage.getItem(this._storageKey);
    if (guardado) {
      try { this._items = JSON.parse(guardado); } catch (e) { this._items = []; }
    } else {
      this._items = [];
    }

    if (!this._contenedor) return;
    this._renderizar();
  },

  _guardar() {
    localStorage.setItem(this._storageKey, JSON.stringify(this._items));
  },

  _renderizar() {
    const vacio = this._items.length === 0;
    this._contenedor.style.display = vacio ? 'none' : 'block';
    if (vacio) {
      if (this._onChange) this._onChange(this._items);
      return;
    }

    this._contenedor.innerHTML = `
      <h3>🛒 ${this._modo === 'donacion' ? 'Productos a donar' : 'Items en la solicitud'} <span style="background:var(--danger);color:white;border-radius:50%;padding:2px 10px;font-size:12px;">${this._items.length}</span></h3>
      <div id="lista-carrito-items"></div>
      <button class="btn btn-danger btn-sm" style="margin-top:8px;" id="btn-vaciar-carrito">🗑️ Vaciar carrito</button>
    `;

    const lista = document.getElementById('lista-carrito-items');
    lista.innerHTML = this._items.map((item, index) => `
      <div class="carrito-item">
        <div class="carrito-item-info">
          <strong>${this._escapeHTML(item.nombre)}</strong>
          <span>${item.detalle || (item.cantidad + ' ' + item.unidad)}</span>
        </div>
        <div class="carrito-item-actions">
          <button class="btn btn-warning btn-sm" data-editar="${index}">✏️</button>
          <button class="btn btn-danger btn-sm" data-eliminar="${index}">🗑️</button>
        </div>
      </div>
    `).join('');

    this._bindEventos();
    if (this._onChange) this._onChange(this._items);
  },

  _bindEventos() {
    document.getElementById('btn-vaciar-carrito')?.addEventListener('click', () => this._confirmarVaciar());
    this._contenedor.querySelectorAll('[data-eliminar]').forEach(btn => {
      btn.addEventListener('click', () => this.eliminar(parseInt(btn.dataset.eliminar)));
    });
    this._contenedor.querySelectorAll('[data-editar]').forEach(btn => {
      btn.addEventListener('click', () => this._mostrarModalModificar(parseInt(btn.dataset.editar)));
    });
  },

  agregar(item) {
    if (item.categoria) {
      item.categoria = this._mapearTipoAPI(item.categoria);
    }
    if (!item.cantidadOriginal) {
      item.cantidadOriginal = item.cantidad;
    }
    this._items.push(item);
    this._guardar();
    this._renderizar();
  },

  eliminar(index) {
    this._items.splice(index, 1);
    this._guardar();
    this._renderizar();
  },

  actualizarItem(index, nuevosDatos) {
    if (index >= 0 && index < this._items.length) {
      if (nuevosDatos.cantidadOriginal && this._items[index].cantidadOriginal) {
        const factor = nuevosDatos.cantidadOriginal / this._items[index].cantidadOriginal;
        nuevosDatos.cantidad = this._items[index].cantidad * factor;
        this._items[index] = { ...this._items[index], ...nuevosDatos };
      } else {
        this._items[index] = { ...this._items[index], ...nuevosDatos };
      }
      this._guardar();
      this._renderizar();
    }
  },

  obtenerItems() {
    return this._items;
  },

  _confirmarVaciar() {
    if (!window.Modal) {
      if (confirm('¿Vaciar todo el carrito?')) this.vaciar(true);
      return;
    }
    const html = `
      <p style="text-align:center; font-size:16px; margin-bottom:20px;">¿Estás seguro de vaciar todo el carrito?</p>
      <div style="display:flex; gap:10px;">
        <button id="modal-confirmar-si" class="btn btn-danger" style="flex:1;">Sí, vaciar</button>
        <button id="modal-confirmar-no" class="btn btn-outline" style="flex:1;">Cancelar</button>
      </div>
    `;
    Modal.abrir(html);
    requestAnimationFrame(() => {
      document.getElementById('modal-confirmar-si')?.addEventListener('click', () => {
        this.vaciar(true);
        Modal.cerrar();
      });
      document.getElementById('modal-confirmar-no')?.addEventListener('click', () => Modal.cerrar());
    });
  },

  vaciar(silencioso) {
    if (silencioso === undefined) silencioso = false;
    if (!silencioso && !window.Modal) {
      if (!confirm('¿Vaciar todo el carrito?')) return;
    }
    this._items = [];
    localStorage.removeItem(this._storageKey);
    this._renderizar();
  },

  _mostrarModalModificar(index) {
    const item = this._items[index];
    if (!item) return;

    if (!window.Modal) {
      const nuevaCantidad = prompt('Nueva cantidad:', item.cantidadOriginal || item.cantidad);
      if (nuevaCantidad && parseInt(nuevaCantidad) > 0) {
        this.actualizarItem(index, { cantidadOriginal: parseInt(nuevaCantidad) });
      }
      return;
    }

    const tieneFormula = !!(item._formula && item._formula.cantUnidadMinima > 0 && item._formula.formato !== 'unidad_suelta');

            if (!tieneFormula) {
      // Modal simple (ítem sin fórmula o unidad suelta)
      const valorInicial = item.cantidadOriginal || item.cantidad;
      const html = `
        <h3 style="margin-bottom:16px;">Modificar cantidad</h3>
        <p style="margin-bottom:12px; color:var(--text-muted);">Producto: <strong>${this._escapeHTML(item.nombre)}</strong></p>
        <p style="margin-bottom:12px; color:var(--text-muted);">Total actual: ${item.detalle || (item.cantidad + ' ' + item.unidad)}</p>
        <div class="form-group">
          <label>Cantidad</label>
          <input type="number" id="modal-cantidad" value="${valorInicial}" min="1" required>
        </div>
        <div style="display:flex; gap:10px; margin-top:16px;">
          <button id="modal-guardar-cantidad" class="btn btn-primary" style="flex:1;">💾 Guardar</button>
          <button id="modal-cancelar-modificar" class="btn btn-outline" style="flex:1;">Cancelar</button>
        </div>
      `;
      Modal.abrir(html);
      requestAnimationFrame(() => {
        document.getElementById('modal-guardar-cantidad')?.addEventListener('click', () => {
          const input = document.getElementById('modal-cantidad');
          const nueva = parseInt(input.value);
          if (!nueva || nueva <= 0) { alert('Ingrese una cantidad válida'); return; }
          
          // 1. Determinar la cantidad física o peso métrico real
          let totalMetrico = nueva;
          const f = item._formula;

          if (f && (f.modulo === 'alimentos' || f.modulo === 'alimentos_no_perecibles' || f.modulo === 'agua' || f.modulo === 'agua_potable')) {
            if (f.valorAtributo && f.valorAtributo !== 'otro') {
              const unidadAtributo = f.valorAtributo.replace(/[\d.]/g, '').toLowerCase();
              const pesoUnitario = f.pesoUnitario || 0;
              
              if (unidadAtributo === 'g' || unidadAtributo === 'gramo') {
                totalMetrico = (nueva * pesoUnitario) / 1000;
              } else {
                totalMetrico = nueva * pesoUnitario;
              }
            }
          }
          totalMetrico = Math.round(totalMetrico * 100) / 100;

          // 2. Construir objeto de actualización equilibrado
          const nuevosDatos = { 
            cantidadOriginal: nueva,
            cantidad: totalMetrico 
          };

          // 3. Regenerar el detalle amigable para que la lista no se rompa
          if (f && f.formato === 'unidad_suelta') {
            let detalleTexto = `${nueva} unidades`;
            if (f.valorAtributo && f.valorAtributo !== 'otro') {
              detalleTexto += ` × ${f.valorAtributo}`;
            }
            nuevosDatos.detalle = detalleTexto;
          } else {
            nuevosDatos.detalle = ''; // Respaldo para limpiar e inducir renderizado por cantidad plana
          }

          this.actualizarItem(index, nuevosDatos);
          Modal.cerrar();
        });
        document.getElementById('modal-cancelar-modificar')?.addEventListener('click', () => Modal.cerrar());
      });
      return;
    }

    // Modal con selector formato/unidades (ítem con fórmula)
    const f = item._formula;
    const formatoNombre = (typeof BuscadorInsumos !== 'undefined' && BuscadorInsumos._formatearFormato)
      ? BuscadorInsumos._formatearFormato(f.formato)
      : f.formato;

    const cantFormatos = item.cantidadOriginal || 1;
    const cantUnidadesPorFormato = f.cantUnidadMinima;
    const totalUnidadesActual = cantFormatos * cantUnidadesPorFormato;

    const html = `
      <h3 style="margin-bottom:16px;">Modificar cantidades</h3>
      <p style="margin-bottom:12px; color:var(--text-muted);">Producto: <strong>${this._escapeHTML(item.nombre)}</strong></p>
      <div class="form-group">
        <label>Selecciona qué modificar</label>
        <select id="modal-selector">
          <option value="formatos">${formatoNombre}s</option>
          <option value="unidades" selected>Unidades</option>
        </select>
      </div>
      <div class="form-group">
        <label>Cantidad</label>
        <input type="number" id="modal-cantidad" value="${totalUnidadesActual}" min="1" required>
      </div>
      <div style="display:flex; gap:10px; margin-top:16px;">
        <button id="modal-guardar-cantidad" class="btn btn-primary" style="flex:1;">💾 Guardar</button>
        <button id="modal-cancelar-modificar" class="btn btn-outline" style="flex:1;">Cancelar</button>
      </div>
    `;

    Modal.abrir(html);

    requestAnimationFrame(() => {
      const selector = document.getElementById('modal-selector');
      const inputCantidad = document.getElementById('modal-cantidad');

      selector.addEventListener('change', () => {
        if (selector.value === 'unidades') {
          inputCantidad.value = cantFormatos * cantUnidadesPorFormato;
        } else {
          inputCantidad.value = cantFormatos;
        }
      });

      document.getElementById('modal-guardar-cantidad')?.addEventListener('click', () => {
        const nuevaCantidad = parseInt(inputCantidad.value);
        if (!nuevaCantidad || nuevaCantidad < 1) {
          alert('Ingrese una cantidad válida');
          return;
        }

        let nuevosFormatos, nuevasUnidades;

        if (selector.value === 'unidades') {
          nuevasUnidades = nuevaCantidad;
          nuevosFormatos = Math.ceil(nuevasUnidades / cantUnidadesPorFormato);
        } else {
          nuevosFormatos = nuevaCantidad;
          nuevasUnidades = nuevosFormatos * cantUnidadesPorFormato;
        }

        // Calcular total en kg para métricas internas
        let totalKg = nuevasUnidades;
        if (f.modulo === 'alimentos' || f.modulo === 'agua') {
          if (f.valorAtributo && f.valorAtributo !== 'otro') {
            const unidadAtributo = f.valorAtributo.replace(/[\d.]/g, '').toLowerCase();
            if (unidadAtributo === 'g' || unidadAtributo === 'gramo') {
              totalKg = (nuevasUnidades * f.pesoUnitario) / 1000;
            } else if (unidadAtributo === 'kg') {
              totalKg = nuevasUnidades * f.pesoUnitario;
            }
          }
        }

        // Regenerar el detalle amigable
        const formatoNom = (typeof BuscadorInsumos !== 'undefined' && BuscadorInsumos._formatearFormato)
          ? BuscadorInsumos._formatearFormato(f.formato).toLowerCase()
          : f.formato.toLowerCase();
        let nuevoDetalle = `${nuevosFormatos} ${formatoNom}s × ${cantUnidadesPorFormato} unidades`;
        if (f.valorAtributo && f.valorAtributo !== 'otro') {
          nuevoDetalle += ` × ${f.valorAtributo}`;
        }
        nuevoDetalle += ` = ${nuevasUnidades} unidades`;

        this.actualizarItem(index, {
          cantidadOriginal: nuevosFormatos,
          cantidad: totalKg,
          detalle: nuevoDetalle
        });
        Modal.cerrar();
      });

      document.getElementById('modal-cancelar-modificar')?.addEventListener('click', () => Modal.cerrar());
    });
  },

  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};