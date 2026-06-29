// @build: 2026-06-29.12-15-00 | id: COMP-CARRITO-V3 | desc: vaciar con parámetro silencioso y mapeo de categorías
window.CarritoInsumos = {
  _items: [],
  _contenedor: null,
  _onChange: null,
  _modo: 'donacion',

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
    if (!this._contenedor) return;
    this._renderizar();
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
          <span>${item.cantidad} ${item.unidad} ${item.detalle ? '| ' + item.detalle : ''}</span>
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
    document.getElementById('btn-vaciar-carrito')?.addEventListener('click', () => this.vaciar());
    this._contenedor.querySelectorAll('[data-eliminar]').forEach(btn => {
      btn.addEventListener('click', () => this.eliminar(parseInt(btn.dataset.eliminar)));
    });
    this._contenedor.querySelectorAll('[data-editar]').forEach(btn => {
      btn.addEventListener('click', () => this.editar(parseInt(btn.dataset.editar)));
    });
  },

  agregar(item) {
    if (item.categoria) {
      item.categoria = this._mapearTipoAPI(item.categoria);
    }
    this._items.push(item);
    this._renderizar();
  },

  eliminar(index) {
    this._items.splice(index, 1);
    this._renderizar();
  },

  actualizarItem(index, nuevosDatos) {
    if (index >= 0 && index < this._items.length) {
      this._items[index] = { ...this._items[index], ...nuevosDatos };
      this._renderizar();
    }
  },

  editar(index) {
    if (this._onChange) this._onChange(this._items, { accion: 'editar', index });
  },

  vaciar(silencioso) {
    if (!silencioso && !confirm('¿Vaciar todo el carrito?')) return;
    this._items = [];
    this._renderizar();
  },

  obtenerItems() {
    return this._items;
  },

  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};