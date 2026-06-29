// @build: 2026-06-30.02-00-00 | id: COMP-BUSCADOR-V13 | desc: Campos Otro con unidad fija, formato Otro contextual, botón limpiar integrado en input
window.BuscadorInsumos = {
  _itemSeleccionado: null,
  _abortController: null,
  _contenedor: null,
  _opciones: {},

  _jerarquia: {
    blister: { intermedio: null, unidad_minima: 'tableta', genero: 'm' },
    caja: { intermedio: 'blister', unidad_minima: 'tableta', genero: 'f' },
    frasco: { intermedio: null, unidad_minima: 'tableta', genero: 'm' },
    ampolla: { intermedio: null, unidad_minima: 'ampolla', genero: 'f' },
    botella: { intermedio: null, unidad_minima: 'litros', genero: 'f' },
    botellon: { intermedio: null, unidad_minima: 'litros', genero: 'm' },
    garrafon: { intermedio: null, unidad_minima: 'litros', genero: 'm' },
    paquete: { intermedio: null, unidad_minima: 'kg', genero: 'm' },
    bulto: { intermedio: null, unidad_minima: 'kg', genero: 'm' },
    bolsa: { intermedio: null, unidad_minima: 'kg', genero: 'f' },
    pack: { intermedio: 'botella', unidad_minima: 'litros', genero: 'm' },
    unidad_suelta: { intermedio: null, unidad_minima: 'unidad', genero: 'f' },
    otro: { intermedio: null, unidad_minima: 'unidad', genero: 'm' }
  },

  _modulosSinDesgloseUnidad: ['agua', 'alimentos'],
  _modulosConConversion: ['agua', 'alimentos'],

  _conversiones: {
    ml: { unidad: 'litros', factor: 0.001 },
    l: { unidad: 'litros', factor: 1 },
    litro: { unidad: 'litros', factor: 1 },
    g: { unidad: 'kg', factor: 0.001 },
    gramo: { unidad: 'kg', factor: 0.001 },
    kg: { unidad: 'kg', factor: 1 }
  },

  // Unidades fijas para campos "Otro" numéricos
  _unidadesOtro: {
    dosis: 'mg',
    volumen: 'ml',
    peso: 'kg'
  },

  // Placeholders para campos "Otro" de texto libre
  _placeholdersOtro: {
    'tipo-ropa': 'Ej: Chaqueta, Suéter',
    'genero-ropa': 'Ej: Unisex',
    'talla-ropa': 'Ej: XXL',
    'tipo-calzado': 'Ej: Sandalias, Botas',
    'genero-calzado': 'Ej: Niño',
    'talla-calzado': 'Ej: 42',
    'tipo-higiene': 'Ej: Toallas, Jabón',
    'tipo-logistica': 'Ej: Manta, Linterna',
    formato: {
      medico: 'Ej: Sachet, Tubo, Gotero',
      alimentos: 'Ej: Lata, Frasco, Sobre',
      agua: 'Ej: Galón, Bidón, Tanque',
      higiene: 'Ej: Dispenser, Envase, Rollo',
      ropa_calzado: 'Ej: Par, Conjunto, Set'
    }
  },

  async init(contenedorId, opciones = {}) {
    this._contenedor = document.getElementById(contenedorId);
    this._opciones = opciones;
    if (!this._contenedor) return;
    this._renderizar();
    this._bindEventos();
  },

  _renderizar() {
    this._contenedor.innerHTML = `
      <div class="form-group">
        <label>Buscar insumo <span style="color:var(--danger);">*</span></label>
        <div class="search-box" style="position:relative;">
          <input type="text" id="busqueda-insumo" placeholder="Ej: Paracetamol, Arroz, Agua..." autocomplete="off" required style="padding-right:30px;">
          <span id="btn-limpiar-busqueda" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); cursor:pointer; color:var(--text-muted); font-size:18px; display:none;" title="Limpiar búsqueda">✕</span>
          <div class="search-results" id="resultados-busqueda"></div>
        </div>
      </div>
      <div id="formulario-dinamico"></div>
      <div id="resumen-calculo" style="background:#f0fdf4;padding:10px;border-radius:8px;display:none;margin-top:12px;"></div>
      <button class="btn btn-success" id="btn-agregar-carrito" disabled>➕ Agregar al carrito</button>
      <div id="mensaje-buscador" class="mensaje" style="display:none;"></div>
    `;
  },

  _bindEventos() {
    const input = document.getElementById('busqueda-insumo');
    const btnLimpiar = document.getElementById('btn-limpiar-busqueda');

    input.addEventListener('input', () => {
      btnLimpiar.style.display = input.value.length > 0 ? 'block' : 'none';
      this._realizarBusqueda(input.value);
    });

    btnLimpiar.addEventListener('click', () => {
      input.value = '';
      btnLimpiar.style.display = 'none';
      document.getElementById('resultados-busqueda').style.display = 'none';
      this._limpiarFormulario();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box')) {
        document.getElementById('resultados-busqueda').style.display = 'none';
      }
    });
    document.getElementById('btn-agregar-carrito').addEventListener('click', () => this._agregarAlCarrito());
  },

  async _realizarBusqueda(termino) {
    if (this._abortController) this._abortController.abort();
    this._abortController = new AbortController();
    const div = document.getElementById('resultados-busqueda');
    if (termino.length < 2) { div.style.display = 'none'; return; }
    div.innerHTML = '<div class="search-result-item" style="color:var(--text-muted);">Buscando...</div>';
    div.style.display = 'block';
    try {
      const res = await apiFetch(`/api/catalogo?q=${encodeURIComponent(termino)}`, { signal: this._abortController.signal });
      const items = res.data || [];
      const sugerencias = res.sugerencias || [];

      if (items.length === 0 && sugerencias.length > 0) {
        div.innerHTML = `<div class="search-result-item" style="color:var(--text-muted);">Quizás quisiste decir:</div>
          ${sugerencias.map(s => `
            <div class="search-result-item" onclick="BuscadorInsumos._seleccionarItem('${s.id}')">
              <strong>${this._escapeHTML(s.nombre_generico)}</strong>
              <span style="font-size:12px;color:var(--text-muted);">(similitud: ${(s.sim * 100).toFixed(0)}%)</span>
            </div>
          `).join('')}`;
      } else if (items.length === 0) {
        div.innerHTML = `<div class="search-result-item" onclick="BuscadorInsumos._mostrarFormularioCreacion('${this._escapeHTML(termino)}')">
          <span style="color:var(--text-muted);">No se encontró "<strong>${this._escapeHTML(termino)}</strong>".</span>
          <button class="btn btn-outline" style="margin-top:4px;width:auto;padding:8px 12px;">➕ Crear nuevo insumo</button>
        </div>`;
      } else {
        div.innerHTML = items.map(item => `
          <div class="search-result-item" onclick="BuscadorInsumos._seleccionarItem('${item.id}')">
            <strong>${this._escapeHTML(item.nombre_generico)}</strong>
            <span style="font-size:12px;color:var(--text-muted);display:block;">
              ${item.categoria?.nombre || 'Sin categoría'} — ${item.presentaciones?.map(p => p.valor).join(', ') || 'Sin presentaciones'}
            </span>
          </div>
        `).join('');
      }
    } catch (err) {
      if (err.name !== 'AbortError') div.innerHTML = '<div class="search-result-item" style="color:var(--danger);">Error al buscar</div>';
    }
  },

  async _seleccionarItem(itemId) {
    try {
      const res = await apiFetch(`/api/catalogo?id=${itemId}`);
      const item = res.data;
      if (!item) { this._mostrarMensaje('Ítem no encontrado', 'error'); return; }
      this._itemSeleccionado = item;
      document.getElementById('busqueda-insumo').value = item.nombre_generico;
      document.getElementById('btn-limpiar-busqueda').style.display = 'block';
      document.getElementById('resultados-busqueda').style.display = 'none';
      this._renderizarFormularioDinamico(item);
    } catch (err) { this._mostrarMensaje('Error al cargar el ítem', 'error'); }
  },

  _renderizarFormularioDinamico(item) {
    const div = document.getElementById('formulario-dinamico');
    const cat = item.categoria?.modulo || 'otros';
    const presentaciones = item.presentaciones || [];
    const nombre = item.nombre_generico?.toLowerCase() || '';
    const esCalzado = cat === 'ropa_calzado' && (nombre.includes('zapato') || nombre.includes('calzado'));

    div.innerHTML = ''; // Sin botón de limpiar, ya está integrado en el input

    const esLiquidoMedico = cat === 'medico' && this._extraerOpciones(presentaciones, /\d+\s*(ml|L|litro|cc)/gi).length > 0;

    if (cat === 'medico' && !esLiquidoMedico) this._agregarSelectorDosis(div, presentaciones);
    else if (cat === 'medico' && esLiquidoMedico) this._agregarSelectorVolumen(div, presentaciones);
    else if (cat === 'alimentos') this._agregarSelectorPeso(div, presentaciones);
    else if (cat === 'agua') this._agregarSelectorVolumen(div, presentaciones);
    else if (cat === 'ropa_calzado') {
      if (esCalzado) this._agregarSelectorTipoCalzado(div, presentaciones);
      else this._agregarSelectorTipoRopa(div, presentaciones);
    }
    else if (cat === 'higiene') this._agregarSelectorTipoHigiene(div, presentaciones);
    else if (cat === 'logistica') this._agregarSelectorTipoLogistica(div, presentaciones);
    else this._agregarCampoTexto(div, 'Descripción', 'descripcion-manual', 'Ej: Manta térmica');

    if (['medico', 'alimentos', 'agua', 'higiene', 'ropa_calzado'].includes(cat) || esLiquidoMedico) {
      this._agregarSelectorFormato(div, cat);
    }

    div.innerHTML += `<div id="desglose-container"></div>`;

    if (item.requiere_vencimiento) {
      div.innerHTML += `<div class="form-group" id="grupo-vencimiento" style="margin-top:12px;"><label>Fecha de vencimiento <span style="color:var(--danger);">*</span></label><input type="date" id="vencimiento" required></div>`;
    }

    const resumen = document.getElementById('resumen-calculo');
    if (resumen) resumen.style.display = 'none';

    this._vincularEventosDinamicos(cat, item);
    this._generarDesglose(cat);
    document.getElementById('btn-agregar-carrito').disabled = false;
    this._actualizarResumen();
  },

  _extraerOpciones(presentaciones, regex) {
    const valores = presentaciones.map(p => p.valor.match(regex)).filter(m => m).map(m => m[0]);
    return [...new Set(valores)];
  },

  _agregarSelectorConOtro(div, id, label, opciones, tipoNumerico, unidad) {
    let html = `<div class="form-group"><label>${label} <span style="color:var(--danger);">*</span></label><select id="${id}">`;
    html += opciones.map(o => `<option value="${o}">${o}</option>`).join('');
    html += '<option value="otro">Otro</option></select></div>';

    if (tipoNumerico) {
      // Campo numérico con sufijo de unidad fija
      html += `<div class="form-group" id="grupo-${id}-otro" style="display:none;"><label>Especifica otro valor</label><div style="display:flex; align-items:center; gap:8px;"><input type="number" id="${id}-otro" min="1" placeholder="Ej: 1000" style="flex:1;"><span style="font-weight:bold;">${unidad}</span></div></div>`;
    } else {
      // Campo de texto libre
      const placeholder = this._placeholdersOtro[id] || 'Especifica otro valor';
      html += `<div class="form-group" id="grupo-${id}-otro" style="display:none;"><label>Especifica otro valor</label><input type="text" id="${id}-otro" placeholder="${placeholder}" maxlength="50"></div>`;
    }
    div.innerHTML += html;

    if (opciones.length === 1) {
      setTimeout(() => {
        const sel = document.getElementById(id);
        if (sel && sel.options.length === 2) {
          sel.value = opciones[0];
          sel.dispatchEvent(new Event('change'));
        }
      }, 50);
    }
  },

  _agregarSelectorDosis(div, presentaciones) {
    const dosis = this._extraerOpciones(presentaciones, /\d+\s*(mg|mcg|g|UI)/gi);
    this._agregarSelectorConOtro(div, 'dosis', 'Dosis', dosis, true, 'mg');
  },

  _agregarSelectorVolumen(div, presentaciones) {
    const volumenes = this._extraerOpciones(presentaciones, /\d+\s*(ml|L|litro|cc)/gi);
    this._agregarSelectorConOtro(div, 'volumen', 'Volumen', volumenes, true, 'ml');
  },

  _agregarSelectorPeso(div, presentaciones) {
    const pesos = this._extraerOpciones(presentaciones, /\d+\s*(kg|g|gramo)/gi);
    this._agregarSelectorConOtro(div, 'peso', 'Peso', pesos, true, 'kg');
  },

  _agregarSelectorTipoRopa(div, presentaciones) {
    const tipos = presentaciones.filter(p => p.tipo === 'presentacion').map(p => p.valor);
    this._agregarSelectorConOtro(div, 'tipo-ropa', 'Tipo de prenda', tipos.length ? tipos : ['Camiseta', 'Pantalón', 'Ropa interior'], false);
    this._agregarSelectorConOtro(div, 'genero-ropa', 'Género', ['Dama', 'Caballero', 'Niño', 'Unisex'], false);
    this._agregarSelectorConOtro(div, 'talla-ropa', 'Talla', ['XS', 'S', 'M', 'L', 'XL', 'XXL'], false);
  },

  _agregarSelectorTipoCalzado(div, presentaciones) {
    const tipos = presentaciones.filter(p => p.tipo === 'presentacion').map(p => p.valor);
    this._agregarSelectorConOtro(div, 'tipo-calzado', 'Tipo de calzado', tipos.length ? tipos : ['Zapatos deportivos', 'Zapatos casuales', 'Botas'], false);
    this._agregarSelectorConOtro(div, 'genero-calzado', 'Género', ['Dama', 'Caballero', 'Niño', 'Unisex'], false);
    const tallasCalzado = [];
    for (let i = 34; i <= 45; i++) tallasCalzado.push(i.toString());
    this._agregarSelectorConOtro(div, 'talla-calzado', 'Número', tallasCalzado, true, '');
  },

  _agregarSelectorTipoHigiene(div, presentaciones) {
    const tipos = presentaciones.filter(p => p.tipo === 'presentacion').map(p => p.valor);
    this._agregarSelectorConOtro(div, 'tipo-higiene', 'Tipo', tipos.length ? tipos : ['Pañales', 'Jabón', 'Shampoo'], false);
  },

  _agregarSelectorTipoLogistica(div, presentaciones) {
    const tipos = presentaciones.filter(p => p.tipo === 'presentacion').map(p => p.valor);
    this._agregarSelectorConOtro(div, 'tipo-logistica', 'Tipo', tipos.length ? tipos : ['Colchoneta', 'Saco de dormir'], false);
  },

  _agregarCampoTexto(div, label, id, placeholder) {
    div.innerHTML += `<div class="form-group"><label>${label} <span style="color:var(--danger);">*</span></label><input type="text" id="${id}" placeholder="${placeholder}" maxlength="200" required></div>`;
  },

  _agregarSelectorFormato(div, modulo) {
    const formatos = {
      medico: ['blister', 'caja', 'frasco', 'ampolla', 'unidad_suelta'],
      alimentos: ['paquete', 'bulto', 'bolsa', 'caja', 'unidad_suelta'],
      agua: ['botella', 'botellon', 'garrafon', 'pack', 'unidad_suelta'],
      higiene: ['paquete', 'caja', 'bolsa', 'unidad_suelta'],
      ropa_calzado: ['paquete', 'caja', 'unidad_suelta']
    };
    const opciones = (formatos[modulo] || ['unidad_suelta']).map(f => `<option value="${f}">${this._formatearFormato(f)}</option>`).join('');

    let html = `<div class="form-group"><label>¿Cómo viene el producto? <span style="color:var(--danger);">*</span></label><select id="formato">${opciones}<option value="otro">Otro</option></select></div>`;

    // Campo "Otro" para formato con placeholder contextual
    const placeholderFormato = this._placeholdersOtro.formato?.[modulo] || 'Especifica otro formato';
    html += `<div class="form-group" id="grupo-formato-otro" style="display:none;"><label>Especifica otro formato</label><input type="text" id="formato-otro" placeholder="${placeholderFormato}" maxlength="50"></div>`;

    div.innerHTML += html;
  },

  _formatearFormato(valor) {
    const nombres = {
      blister: 'Blíster', caja: 'Caja', frasco: 'Frasco', ampolla: 'Ampolla',
      botella: 'Botella', botellon: 'Botellón', garrafon: 'Garrafón',
      paquete: 'Paquete', bulto: 'Bulto', bolsa: 'Bolsa', pack: 'Pack',
      unidad_suelta: 'Unidad suelta'
    };
    return nombres[valor] || valor;
  },

  _vincularEventosDinamicos(modulo, item) {
    const idsSelectores = ['dosis', 'volumen', 'peso', 'formato', 'tipo-ropa', 'genero-ropa', 'talla-ropa',
      'tipo-calzado', 'genero-calzado', 'talla-calzado', 'tipo-higiene', 'tipo-logistica'];

    idsSelectores.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          this._toggleCampoOtro(id);
          this._generarDesglose(modulo);
          this._actualizarResumen();
        });
        if (el.value === 'otro') this._toggleCampoOtro(id);
      }
    });

    const desglose = document.getElementById('desglose-container');
    if (desglose) {
      desglose.addEventListener('input', () => this._actualizarResumen());
    }
  },

  _toggleCampoOtro(id) {
    const sel = document.getElementById(id);
    const grupo = document.getElementById(`grupo-${id}-otro`);
    if (sel && grupo) {
      grupo.style.display = sel.value === 'otro' ? 'block' : 'none';
    }
  },

  _obtenerValorAtributo() {
    const ids = ['dosis', 'volumen', 'peso'];
    for (const id of ids) {
      const sel = document.getElementById(id);
      if (sel) {
        if (sel.value === 'otro') {
          const otro = document.getElementById(`${id}-otro`);
          const unidad = this._unidadesOtro[id] || '';
          return otro?.value?.trim() ? otro.value.trim() + unidad : 'otro';
        }
        return sel.value;
      }
    }
    return null;
  },

  _obtenerValorFormato() {
    const sel = document.getElementById('formato');
    if (sel && sel.value === 'otro') {
      const otro = document.getElementById('formato-otro');
      return otro?.value?.trim() || 'otro';
    }
    return sel?.value || null;
  },

  _extraerNumerico(valor) {
    if (!valor) return 0;
    const match = valor.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  },

  _extraerUnidad(valor) {
    if (!valor) return '';
    const match = valor.match(/[a-zA-Z]+/);
    return match ? match[0].toLowerCase() : '';
  },

  _generarDesglose(modulo) {
    const contenedor = document.getElementById('desglose-container');
    if (!contenedor) return;
    const formato = this._obtenerValorFormato();
    if (!formato || formato === 'unidad_suelta' || formato === 'otro') {
      contenedor.innerHTML = this._campoCantidad('unidades', null);
      return;
    }
    const jerarquia = this._jerarquia[formato];
    if (!jerarquia) { contenedor.innerHTML = this._campoCantidad('unidades', null); return; }

    const atributoSeleccionado = this._obtenerValorAtributo();
    const esAtributoLibre = !atributoSeleccionado || atributoSeleccionado === 'otro';
    const moduloSinDesglose = this._modulosSinDesgloseUnidad.includes(modulo) && !esAtributoLibre;

    let html = '';
    if (jerarquia.intermedio) {
      html += this._campoCantidad(formato, null);
      html += `<div class="form-group"><label>¿Cuántos ${jerarquia.intermedio}s trae cada ${this._formatearFormato(formato).toLowerCase()}?</label><input type="number" id="cant-intermedia" min="1" required></div>`;
      html += `<div class="form-group"><label>¿Cuántas ${jerarquia.unidad_minima}s trae cada ${jerarquia.intermedio}?</label><input type="number" id="cant-unidad-minima" min="1" required></div>`;
    } else {
      html += this._campoCantidad(formato, null);
      if (!moduloSinDesglose) {
        html += `<div class="form-group"><label>¿Cuántas ${jerarquia.unidad_minima}s trae cada ${this._formatearFormato(formato).toLowerCase()}?</label><input type="number" id="cant-unidad-minima" min="1" required></div>`;
      }
    }
    contenedor.innerHTML = html;
  },

  _campoCantidad(formato, unidadMinima) {
    const jer = this._jerarquia[formato] || {};
    const g = jer.genero || 'm';
    const nombre = this._formatearFormato(formato).toLowerCase();
    if (formato && formato !== 'unidad_suelta' && formato !== 'otro') {
      return `<div class="form-group"><label>¿Cuánt${g === 'f' ? 'as' : 'os'} ${nombre}s deseas donar?</label><input type="number" id="cant-principal" min="1" required></div>`;
    }
    return `<div class="form-group"><label>¿Cuántas unidades deseas donar?</label><input type="number" id="cant-principal" min="1" required></div>`;
  },

  _actualizarResumen() {
    const resumen = document.getElementById('resumen-calculo');
    if (!resumen) return;
    const item = this._itemSeleccionado;
    if (!item) { resumen.style.display = 'none'; return; }
    const cat = item.categoria?.modulo || 'otros';
    const cantidadPrincipal = parseInt(document.getElementById('cant-principal')?.value) || 0;
    if (cantidadPrincipal <= 0) { resumen.style.display = 'none'; return; }

    const formato = this._obtenerValorFormato();
    const jer = this._jerarquia[formato] || {};
    const cantIntermedia = parseInt(document.getElementById('cant-intermedia')?.value) || 0;
    const cantUnidadMinima = parseInt(document.getElementById('cant-unidad-minima')?.value) || 0;
    const valorAtributo = this._obtenerValorAtributo();
    const aplicarConversion = this._modulosConConversion.includes(cat);
    let unidadAtributo = '';
    let conversion = null;

    if (aplicarConversion && valorAtributo && valorAtributo !== 'otro') {
      unidadAtributo = this._extraerUnidad(valorAtributo);
      conversion = this._conversiones[unidadAtributo];
    }

    let total = cantidadPrincipal;
    let detalle = `${cantidadPrincipal} ${this._formatearFormato(formato || 'unidad').toLowerCase()}s`;
    let unidad = jer.unidad_minima || 'unidad';

    if (jer.intermedio && cantIntermedia > 0 && cantUnidadMinima > 0) {
      total = cantidadPrincipal * cantIntermedia * cantUnidadMinima;
      detalle = `${cantidadPrincipal} ${this._formatearFormato(formato).toLowerCase()}s × ${cantIntermedia} ${jer.intermedio}s × ${cantUnidadMinima} ${jer.unidad_minima}s`;
      unidad = jer.unidad_minima;
    } else if (!jer.intermedio && cantUnidadMinima > 0) {
      total = cantidadPrincipal * cantUnidadMinima;
      detalle = `${cantidadPrincipal} ${this._formatearFormato(formato).toLowerCase()}s × ${cantUnidadMinima} ${jer.unidad_minima}s`;
      unidad = jer.unidad_minima;
    } else if (conversion) {
      const numerico = this._extraerNumerico(valorAtributo);
      total = cantidadPrincipal * numerico * conversion.factor;
      detalle = `${cantidadPrincipal} ${this._formatearFormato(formato).toLowerCase()}s × ${numerico}${unidadAtributo}`;
      unidad = conversion.unidad;
    }

    const extras = [];
    const genero = document.getElementById('genero-ropa')?.value || document.getElementById('genero-calzado')?.value;
    const talla = document.getElementById('talla-ropa')?.value || document.getElementById('talla-calzado')?.value;
    if (genero && genero !== 'otro') extras.push(genero);
    if (talla && talla !== 'otro') extras.push(`Talla ${talla}`);

    resumen.style.display = 'block';
    resumen.innerHTML = `<strong>${detalle} = ${total} ${unidad} de ${item.nombre_generico}${extras.length ? ' (' + extras.join(', ') + ')' : ''}</strong>`;
  },

  _obtenerUnidadMinima() {
    const formato = this._obtenerValorFormato();
    const jer = this._jerarquia[formato];
    const valorAtributo = this._obtenerValorAtributo();
    const unidadAtributo = this._extraerUnidad(valorAtributo);
    const conversion = this._conversiones[unidadAtributo];
    return conversion ? conversion.unidad : (jer ? jer.unidad_minima : 'unidad');
  },

  _calcularTotal() {
    const item = this._itemSeleccionado;
    const cat = item?.categoria?.modulo || 'otros';
    const cantidadPrincipal = parseInt(document.getElementById('cant-principal')?.value) || 0;
    const cantIntermedia = parseInt(document.getElementById('cant-intermedia')?.value) || 0;
    const cantUnidadMinima = parseInt(document.getElementById('cant-unidad-minima')?.value) || 0;
    const formato = this._obtenerValorFormato();
    const jer = this._jerarquia[formato];
    const valorAtributo = this._obtenerValorAtributo();
    const aplicarConversion = this._modulosConConversion.includes(cat);
    let conversion = null;

    if (aplicarConversion && valorAtributo && valorAtributo !== 'otro') {
      const unidadAtributo = this._extraerUnidad(valorAtributo);
      conversion = this._conversiones[unidadAtributo];
    }

    if (!jer) return cantidadPrincipal;
    if (jer.intermedio && cantIntermedia > 0 && cantUnidadMinima > 0) return cantidadPrincipal * cantIntermedia * cantUnidadMinima;
    if (!jer.intermedio && cantUnidadMinima > 0) return cantidadPrincipal * cantUnidadMinima;
    if (conversion) return cantidadPrincipal * this._extraerNumerico(valorAtributo) * conversion.factor;
    return cantidadPrincipal;
  },

  async _agregarAlCarrito() {
    const item = this._itemSeleccionado;
    if (!item) { this._mostrarMensaje('Seleccione un insumo primero', 'error'); return; }
    const cantidadPrincipal = parseInt(document.getElementById('cant-principal')?.value) || 0;
    if (cantidadPrincipal <= 0) { this._mostrarMensaje('Ingrese una cantidad válida', 'error'); return; }

    await this._persistirValoresOtro(item);

    const total = this._calcularTotal();
    const unidad = this._obtenerUnidadMinima();
    const genero = document.getElementById('genero-ropa')?.value || document.getElementById('genero-calzado')?.value || null;
    const talla = document.getElementById('talla-ropa')?.value || document.getElementById('talla-calzado')?.value || null;
    const formato = this._obtenerValorFormato();

    const itemData = {
      id: item.id,
      nombre: item.nombre_generico,
      cantidad: total,
      unidad: unidad,
      categoria: item.categoria?.modulo || 'otros',
      extra: {
        dosis: this._obtenerValorAtributo() || null,
        formato: formato,
        genero: genero,
        talla: talla,
        vencimiento: document.getElementById('vencimiento')?.value || null
      }
    };
    if (this._opciones.onAgregar) this._opciones.onAgregar(itemData);
    this._limpiarFormulario();
    this._mostrarMensaje('✅ Agregado al carrito', 'exito');
  },

  async _persistirValoresOtro(item) {
    const presentacionesNuevas = [];
    const camposConUnidad = ['dosis', 'volumen', 'peso'];
    const camposTextoLigero = ['tipo-ropa', 'genero-ropa', 'talla-ropa', 'tipo-calzado', 'genero-calzado', 'talla-calzado', 'tipo-higiene', 'tipo-logistica'];

    // Procesar campos numéricos con unidad fija
    for (const id of camposConUnidad) {
      const sel = document.getElementById(id);
      if (sel && sel.value === 'otro') {
        const otroInput = document.getElementById(`${id}-otro`);
        if (otroInput && otroInput.value.trim()) {
          const unidad = this._unidadesOtro[id] || '';
          presentacionesNuevas.push({
            tipo: 'medida',
            valor: otroInput.value.trim() + unidad,
            unidad_sugerida: unidad
          });
        }
      }
    }

    // Procesar campos de texto libre
    for (const id of camposTextoLigero) {
      const sel = document.getElementById(id);
      if (sel && sel.value === 'otro') {
        const otroInput = document.getElementById(`${id}-otro`);
        if (otroInput && otroInput.value.trim()) {
          presentacionesNuevas.push({
            tipo: id.includes('talla') || id.includes('numero') ? 'medida' : 'presentacion',
            valor: otroInput.value.trim(),
            unidad_sugerida: 'unidades'
          });
        }
      }
    }

    // Procesar formato "Otro"
    const selFormato = document.getElementById('formato');
    if (selFormato && selFormato.value === 'otro') {
      const otroFormato = document.getElementById('formato-otro');
      if (otroFormato && otroFormato.value.trim()) {
        presentacionesNuevas.push({
          tipo: 'formato',
          valor: otroFormato.value.trim(),
          unidad_sugerida: 'unidades'
        });
      }
    }

    if (presentacionesNuevas.length > 0) {
      try {
        await apiFetch('/api/catalogo', {
          method: 'POST',
          body: JSON.stringify({
            nombre_generico: item.nombre_generico,
            categoria_id: item.categoria?.id || null,
            requiere_vencimiento: item.requiere_vencimiento || false,
            presentaciones: presentacionesNuevas
          })
        });
      } catch (e) {
        this._mostrarMensaje('No se pudo registrar el nuevo valor, pero se agregó al carrito.', 'error');
      }
    }
  },

  _limpiarFormulario() {
    document.getElementById('busqueda-insumo').value = '';
    document.getElementById('btn-limpiar-busqueda').style.display = 'none';
    document.getElementById('formulario-dinamico').innerHTML = '';
    const resumen = document.getElementById('resumen-calculo');
    if (resumen) resumen.style.display = 'none';
    document.getElementById('btn-agregar-carrito').disabled = true;
    this._itemSeleccionado = null;
  },

  _mostrarMensaje(texto, tipo) {
    const msg = document.getElementById('mensaje-buscador');
    msg.textContent = texto;
    msg.className = 'mensaje ' + (tipo || 'exito');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 4000);
  },

  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  async _mostrarFormularioCreacion(termino) {
    document.getElementById('resultados-busqueda').style.display = 'none';
    document.getElementById('busqueda-insumo').value = termino;
    document.getElementById('btn-limpiar-busqueda').style.display = 'block';
    const div = document.getElementById('formulario-dinamico');

    let categorias = [];
    try {
      const res = await apiFetch('/api/catalogo/categorias');
      categorias = res.data || [];
    } catch (e) {
      this._mostrarMensaje('Error al cargar categorías', 'error');
      return;
    }

    div.innerHTML = `
      <div class="alert-aviso" style="margin-top:12px;">Creando nuevo insumo: <strong>${this._escapeHTML(termino)}</strong></div>
      <div class="form-group">
        <label>Categoría <span style="color:var(--danger);">*</span></label>
        <select id="nueva-categoria" required>
          <option value="">Seleccione categoría...</option>
          ${categorias.map(c => `<option value="${c.id}">${this._escapeHTML(c.nombre)} (${c.modulo})</option>`).join('')}
        </select>
      </div>
      <div class="form-group" id="grupo-vencimiento-nuevo">
        <label>¿Requiere fecha de vencimiento?</label>
        <select id="requiere-vencimiento">
          <option value="false">No</option>
          <option value="true">Sí</option>
        </select>
      </div>
      <div class="form-group">
        <label>Presentación / Descripción <span style="color:var(--danger);">*</span></label>
        <input type="text" id="nueva-presentacion" placeholder="Ej: Tableta 500mg, Empaque 1kg" required maxlength="100">
      </div>
      <button class="btn btn-primary" id="btn-crear-insumo">➕ Crear y agregar</button>
    `;

    document.getElementById('btn-crear-insumo').addEventListener('click', async () => {
      const btn = document.getElementById('btn-crear-insumo');
      const categoriaId = document.getElementById('nueva-categoria').value;
      if (!categoriaId) {
        this._mostrarMensaje('Seleccione una categoría', 'error');
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Creando...';
      try {
        const payload = {
          nombre_generico: termino.trim(),
          categoria_id: categoriaId,
          requiere_vencimiento: document.getElementById('requiere-vencimiento').value === 'true',
          presentaciones: [{
            tipo: 'presentacion',
            valor: document.getElementById('nueva-presentacion').value.trim(),
            unidad_sugerida: 'unidades'
          }]
        };
        const res = await apiFetch('/api/catalogo', { method: 'POST', body: JSON.stringify(payload) });
        this._mostrarMensaje('✅ Insumo creado con categoría', 'exito');
        await this._seleccionarItem(res.data.id);
      } catch (err) {
        this._mostrarMensaje('❌ ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '➕ Crear y agregar';
      }
    });
  }
};
