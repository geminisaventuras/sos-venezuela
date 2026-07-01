-- // @build: 2026-06-29.23-00-00 | id: DB-SCHEMA-POST-PURGE | desc: Estructura limpia post-purga de tablas, columnas y políticas RLS innecesarias
-- Base de datos: sistemasosvenezuela (Supabase)
-- Esquema documentado: public
-- Fecha de extracción original: 2026-06-29 | Purga aplicada: 2026-06-29

-- ============================================================================
-- EXTENSIONES REQUERIDAS
-- ============================================================================
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "postgis";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================================
-- TABLA: catalogo_categorias
-- ============================================================================
CREATE TABLE public.catalogo_categorias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    modulo text NOT NULL,
    orden integer DEFAULT 0,
    CONSTRAINT catalogo_categorias_pkey PRIMARY KEY (id),
    CONSTRAINT catalogo_categorias_nombre_key UNIQUE (nombre),
    CONSTRAINT catalogo_categorias_modulo_check CHECK (modulo = ANY (ARRAY['medico'::text, 'alimentos'::text, 'agua'::text, 'logistica'::text, 'ropa_calzado'::text, 'higiene'::text, 'otros'::text]))
);
CREATE UNIQUE INDEX catalogo_categorias_nombre_key ON public.catalogo_categorias USING btree (nombre);

-- ============================================================================
-- TABLA: catalogo_items
-- ============================================================================
CREATE TABLE public.catalogo_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    categoria_id uuid,
    nombre_generico text NOT NULL,
    nombre_normalizado text NOT NULL,
    requiere_vencimiento boolean DEFAULT false,
    creado_por uuid,
    verificado boolean DEFAULT false,
    activo boolean DEFAULT true,
    creado_en timestamp with time zone DEFAULT now(),
    CONSTRAINT catalogo_items_pkey PRIMARY KEY (id),
    CONSTRAINT catalogo_items_nombre_normalizado_key UNIQUE (nombre_normalizado),
    CONSTRAINT catalogo_items_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.catalogo_categorias(id) ON DELETE SET NULL,
    CONSTRAINT catalogo_items_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.perfiles(user_id) ON DELETE SET NULL
);
CREATE INDEX idx_catalogo_items_categoria ON public.catalogo_items USING btree (categoria_id);
CREATE INDEX idx_catalogo_items_norm ON public.catalogo_items USING btree (nombre_normalizado);

-- ============================================================================
-- TABLA: catalogo_presentaciones
-- ============================================================================
CREATE TABLE public.catalogo_presentaciones (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    item_id uuid,
    tipo text NOT NULL DEFAULT 'presentacion'::text,
    valor text NOT NULL,
    unidad_sugerida text,
    orden integer DEFAULT 0,
    CONSTRAINT catalogo_presentaciones_pkey PRIMARY KEY (id),
    CONSTRAINT catalogo_presentaciones_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.catalogo_items(id) ON DELETE CASCADE
);
CREATE INDEX idx_catalogo_presentaciones_item ON public.catalogo_presentaciones USING btree (item_id);

-- ============================================================================
-- TABLA: perfiles
-- ============================================================================
CREATE TABLE public.perfiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    telefono character varying(15),
    rol character varying(20) NOT NULL,
    nombre_punto character varying(100),
    tipo_punto character varying(20),
    lat numeric,
    lon numeric,
    creado_en timestamp with time zone DEFAULT now(),
    cedula_rif text,
    estado text,
    municipio text,
    direccion_exacta text,
    activo boolean DEFAULT true,
    CONSTRAINT perfiles_pkey PRIMARY KEY (id),
    CONSTRAINT perfiles_user_id_key UNIQUE (user_id),
    CONSTRAINT perfiles_cedula_rif_key UNIQUE (cedula_rif)
);

-- ============================================================================
-- TABLA: voluntarios
-- ============================================================================
CREATE TABLE public.voluntarios (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    telefono character varying(15) NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo_vehiculo character varying(20),
    capacidad_carga character varying(50),
    lat numeric NOT NULL,
    lon numeric NOT NULL,
    activo boolean DEFAULT true,
    actualizado_en timestamp with time zone DEFAULT now(),
    user_id uuid,
    CONSTRAINT voluntarios_pkey PRIMARY KEY (id),
    CONSTRAINT voluntarios_telefono_key UNIQUE (telefono)
);
CREATE UNIQUE INDEX idx_voluntarios_user_id ON public.voluntarios USING btree (user_id);

-- ============================================================================
-- TABLA: necesidades
-- ============================================================================
CREATE TABLE public.necesidades (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    solicitante_id uuid,
    tipo_punto text NOT NULL,
    prioridad text NOT NULL,
    estado text NOT NULL DEFAULT 'pendiente'::text,
    items jsonb NOT NULL,
    punto text NOT NULL,
    lat numeric NOT NULL,
    lon numeric NOT NULL,
    contacto text,
    idempotency_key uuid NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    CONSTRAINT necesidades_pkey PRIMARY KEY (id),
    CONSTRAINT necesidades_idempotency_key_key UNIQUE (idempotency_key),
    CONSTRAINT necesidades_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES public.perfiles(user_id) ON DELETE RESTRICT,
    CONSTRAINT necesidades_tipo_punto_check CHECK (tipo_punto = ANY (ARRAY['refugio'::text, 'hospital'::text])),
    CONSTRAINT necesidades_prioridad_check CHECK (prioridad = ANY (ARRAY['alta'::text, 'media'::text, 'baja'::text])),
    CONSTRAINT necesidades_estado_check CHECK (estado = ANY (ARRAY['pendiente'::text, 'en_proceso'::text, 'en_camino'::text, 'cubierta'::text, 'cancelacion_parcial'::text]))
);

-- ============================================================================
-- TABLA: donaciones
-- ============================================================================
CREATE TABLE public.donaciones (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    donante_id uuid,
    acopio_destino_id uuid,
    modo_entrega text NOT NULL,
    direccion_recogida text,
    lat_recogida numeric,
    lon_recogida numeric,
    estado text NOT NULL DEFAULT 'ofrecida'::text,
    voluntario_recoleccion_id uuid,
    cantidad_rechazada numeric DEFAULT 0,
    motivo_rechazo text,
    fecha_recibida timestamp with time zone,
    creado_en timestamp with time zone DEFAULT now(),
    idempotency_key uuid,
    CONSTRAINT donaciones_pkey PRIMARY KEY (id),
    CONSTRAINT donaciones_idempotency_key_key UNIQUE (idempotency_key),
    CONSTRAINT donaciones_donante_id_fkey FOREIGN KEY (donante_id) REFERENCES public.perfiles(user_id) ON DELETE RESTRICT,
    CONSTRAINT donaciones_acopio_destino_id_fkey FOREIGN KEY (acopio_destino_id) REFERENCES public.perfiles(user_id) ON DELETE RESTRICT,
    CONSTRAINT donaciones_voluntario_recoleccion_id_fkey FOREIGN KEY (voluntario_recoleccion_id) REFERENCES public.perfiles(user_id) ON DELETE SET NULL,
    CONSTRAINT donaciones_estado_check CHECK (estado = ANY (ARRAY['ofrecida'::text, 'asignada'::text, 'en_transito_a_acopio'::text, 'recibida'::text, 'entregada'::text, 'cancelada'::text, 'totalmente_rechazada'::text, 'disponible'::text, 'reservada'::text])),
    CONSTRAINT donaciones_modo_entrega_check CHECK (modo_entrega = ANY (ARRAY['propia'::text, 'recogida'::text]))
);

-- ============================================================================
-- TABLA: detalle_donacion
-- ============================================================================
CREATE TABLE public.detalle_donacion (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    donacion_id uuid,
    insumo_id uuid,
    cantidad numeric NOT NULL,
    fecha_vencimiento date,
    unidad text NOT NULL,
    CONSTRAINT detalle_donacion_pkey PRIMARY KEY (id),
    CONSTRAINT detalle_donacion_cantidad_check CHECK (cantidad > 0::numeric),
    CONSTRAINT detalle_donacion_donacion_id_fkey FOREIGN KEY (donacion_id) REFERENCES public.donaciones(id) ON DELETE CASCADE,
    CONSTRAINT detalle_donacion_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES public.catalogo_items(id) ON DELETE RESTRICT
);

-- ============================================================================
-- TABLA: inventario_acopio
-- ============================================================================
CREATE TABLE public.inventario_acopio (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    acopio_id uuid,
    insumo_id uuid,
    tipo text NOT NULL,
    detalle text NOT NULL,
    unidad text NOT NULL,
    cantidad numeric NOT NULL,
    fecha_vencimiento date,
    lote_id uuid,
    creado_en timestamp with time zone DEFAULT now(),
    actualizado_en timestamp with time zone DEFAULT now(),
    CONSTRAINT inventario_acopio_pkey PRIMARY KEY (id),
    CONSTRAINT inventario_acopio_acopio_id_insumo_id_lote_id_key UNIQUE (acopio_id, insumo_id, lote_id),
    CONSTRAINT inventario_acopio_cantidad_check CHECK (cantidad >= 0::numeric),
    CONSTRAINT inventario_acopio_acopio_id_fkey FOREIGN KEY (acopio_id) REFERENCES public.perfiles(user_id) ON DELETE RESTRICT
);
CREATE INDEX idx_inventario_acopio ON public.inventario_acopio USING btree (acopio_id);
CREATE INDEX idx_inventario_vencimiento ON public.inventario_acopio USING btree (fecha_vencimiento);

-- ============================================================================
-- TABLA: despachos
-- ============================================================================
CREATE TABLE public.despachos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    necesidad_id uuid,
    acopio_id uuid,
    voluntario_id uuid,
    items_despachados jsonb NOT NULL,
    lote_id_origen uuid,
    estado text NOT NULL DEFAULT 'preparando'::text,
    ultima_actualizacion timestamp with time zone DEFAULT now(),
    foto_evidencia text,
    fecha_salida timestamp with time zone,
    fecha_llegada timestamp with time zone,
    fecha_confirmacion timestamp with time zone,
    idempotency_key uuid NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    CONSTRAINT despachos_pkey PRIMARY KEY (id),
    CONSTRAINT despachos_idempotency_key_key UNIQUE (idempotency_key),
    CONSTRAINT despachos_necesidad_id_fkey FOREIGN KEY (necesidad_id) REFERENCES public.necesidades(id) ON DELETE RESTRICT,
    CONSTRAINT despachos_acopio_id_fkey FOREIGN KEY (acopio_id) REFERENCES public.perfiles(user_id) ON DELETE RESTRICT,
    CONSTRAINT despachos_voluntario_id_fkey FOREIGN KEY (voluntario_id) REFERENCES public.perfiles(user_id) ON DELETE SET NULL,
    CONSTRAINT despachos_estado_check CHECK (estado = ANY (ARRAY['preparando'::text, 'en_transito_a_destino'::text, 'entregado_pendiente_firma'::text, 'entregado'::text, 'cancelado'::text]))
);
CREATE INDEX idx_despachos_necesidad ON public.despachos USING btree (necesidad_id);
CREATE INDEX idx_despachos_voluntario ON public.despachos USING btree (voluntario_id) WHERE (voluntario_id IS NOT NULL);

-- ============================================================================
-- TABLA: entregas
-- ============================================================================
CREATE TABLE public.entregas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    idempotency_key uuid NOT NULL,
    voluntario_telefono character varying(15) NOT NULL,
    necesidad_id uuid,
    donacion_id uuid,
    estado character varying(20) DEFAULT 'asignada'::character varying,
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone DEFAULT now(),
    CONSTRAINT entregas_pkey PRIMARY KEY (id),
    CONSTRAINT entregas_idempotency_key_key UNIQUE (idempotency_key),
    CONSTRAINT entregas_estado_check CHECK (estado::text = ANY (ARRAY['asignada'::text, 'en_camino'::text, 'entregada'::text, 'cancelada'::text]))
);

-- ============================================================================
-- TABLA: incidencias
-- ============================================================================
CREATE TABLE public.incidencias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    despacho_id uuid,
    reportado_por uuid,
    tipo text NOT NULL DEFAULT 'otro'::text,
    descripcion text NOT NULL,
    resuelta boolean DEFAULT false,
    creado_en timestamp with time zone DEFAULT now(),
    entrega_id uuid,
    CONSTRAINT incidencias_pkey PRIMARY KEY (id),
    CONSTRAINT incidencias_despacho_id_fkey FOREIGN KEY (despacho_id) REFERENCES public.despachos(id) ON DELETE CASCADE,
    CONSTRAINT incidencias_reportado_por_fkey FOREIGN KEY (reportado_por) REFERENCES public.perfiles(user_id) ON DELETE NO ACTION,
    CONSTRAINT incidencias_entrega_id_fkey FOREIGN KEY (entrega_id) REFERENCES public.entregas(id) ON DELETE CASCADE
);

-- ============================================================================
-- FUNCIONES (RPCs de negocio)
-- ============================================================================

-- Función: crear_necesidad_transaccion (sobrecarga 1)
CREATE OR REPLACE FUNCTION public.crear_necesidad_transaccion(
    _idempotency_key uuid,
    _punto text,
    _lat double precision,
    _lon double precision,
    _items jsonb,
    _prioridad text,
    _contacto text,
    _tipo_punto text DEFAULT 'refugio'::text
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
    nuevo_id UUID;
BEGIN
    INSERT INTO necesidades (idempotency_key, punto, lat, lon, items, prioridad, contacto, tipo_punto)
    VALUES (_idempotency_key, _punto, _lat, _lon, _items, _prioridad, _contacto, _tipo_punto)
    RETURNING id INTO nuevo_id;
    RETURN nuevo_id;
END;
$$;

-- Función: crear_necesidad_transaccion (sobrecarga 2)
CREATE OR REPLACE FUNCTION public.crear_necesidad_transaccion(
    _idempotency_key uuid,
    _punto text,
    _lat double precision,
    _lon double precision,
    _items jsonb,
    _prioridad text,
    _contacto text
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
    nuevo_id UUID;
BEGIN
    INSERT INTO necesidades (idempotency_key, punto, lat, lon, items, prioridad, contacto)
    VALUES (_idempotency_key, _punto, _lat, _lon, _items, _prioridad, _contacto)
    RETURNING id INTO nuevo_id;
    RETURN nuevo_id;
END;
$$;

-- Función: crear_despacho_atomico
CREATE OR REPLACE FUNCTION public.crear_despacho_atomico(
    _idempotency_key uuid,
    _necesidad_id uuid,
    _acopio_id uuid,
    _items jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    existing_id UUID;
    need_record RECORD;
    item RECORD;
    inv_record RECORD;
    new_qty NUMERIC;
    new_despacho_id UUID;
BEGIN
    SELECT id INTO existing_id FROM despachos WHERE idempotency_key = _idempotency_key;
    IF existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('idempotente', true, 'id', existing_id);
    END IF;

    SELECT estado, punto INTO need_record FROM necesidades WHERE id = _necesidad_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Necesidad no encontrada';
    END IF;
    IF need_record.estado IN ('cubierta', 'cancelacion_parcial') THEN
        RAISE EXCEPTION 'La necesidad ya está cubierta o cancelada';
    END IF;

    FOR item IN SELECT * FROM jsonb_to_recordset(_items) AS x(inventario_id UUID, cantidad NUMERIC)
    LOOP
        SELECT cantidad, detalle INTO inv_record
        FROM inventario_acopio
        WHERE id = item.inventario_id AND acopio_id = _acopio_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Item de inventario no encontrado: %', item.inventario_id;
        END IF;

        new_qty := inv_record.cantidad - item.cantidad;
        IF new_qty < 0 THEN
            RAISE EXCEPTION 'Stock insuficiente para %: actual %, solicitado %',
                inv_record.detalle, inv_record.cantidad, item.cantidad;
        END IF;

        UPDATE inventario_acopio
        SET cantidad = new_qty, actualizado_en = now()
        WHERE id = item.inventario_id;
    END LOOP;

    INSERT INTO despachos (idempotency_key, necesidad_id, acopio_id, items_despachados, estado, creado_en)
    VALUES (_idempotency_key, _necesidad_id, _acopio_id, _items, 'preparando', now())
    RETURNING id INTO new_despacho_id;

    UPDATE necesidades SET estado = 'en_camino' WHERE id = _necesidad_id;

    RETURN jsonb_build_object('idempotente', false, 'id', new_despacho_id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en despacho: %', SQLERRM;
END;
$$;

-- Función: crear_entrega_atomica
CREATE OR REPLACE FUNCTION public.crear_entrega_atomica(
    _idempotency_key uuid,
    _voluntario_telefono character varying,
    _necesidad_id uuid DEFAULT NULL::uuid,
    _donacion_id uuid DEFAULT NULL::uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    existing_id UUID;
    voluntario_user_id UUID;
    new_entrega_id UUID;
BEGIN
    SELECT id INTO existing_id FROM entregas WHERE idempotency_key = _idempotency_key;
    IF existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('idempotente', true, 'id', existing_id);
    END IF;

    SELECT user_id INTO voluntario_user_id FROM voluntarios WHERE telefono = _voluntario_telefono;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Voluntario no encontrado';
    END IF;

    INSERT INTO entregas (idempotency_key, voluntario_telefono, necesidad_id, donacion_id, estado, fecha_creacion)
    VALUES (_idempotency_key, _voluntario_telefono, _necesidad_id, _donacion_id, 'asignada', now())
    RETURNING id INTO new_entrega_id;

    IF _donacion_id IS NOT NULL THEN
        UPDATE donaciones
        SET estado = 'asignada', voluntario_recoleccion_id = voluntario_user_id
        WHERE id = _donacion_id;
    END IF;

    IF _necesidad_id IS NOT NULL THEN
        UPDATE despachos
        SET voluntario_id = voluntario_user_id, estado = 'en_transito_a_destino'
        WHERE necesidad_id = _necesidad_id AND estado = 'preparando';
    END IF;

    RETURN jsonb_build_object('idempotente', false, 'id', new_entrega_id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en entrega: %', SQLERRM;
END;
$$;

-- Función: crear_item_catalogo
CREATE OR REPLACE FUNCTION public.crear_item_catalogo(
    _nombre_generico text,
    _nombre_normalizado text,
    _categoria_id uuid,
    _requiere_vencimiento boolean,
    _creado_por uuid,
    _presentaciones jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    nuevo_id UUID;
BEGIN
    INSERT INTO catalogo_items (nombre_generico, nombre_normalizado, categoria_id, requiere_vencimiento, creado_por)
    VALUES (_nombre_generico, _nombre_normalizado, _categoria_id, _requiere_vencimiento, _creado_por)
    RETURNING id INTO nuevo_id;

    INSERT INTO catalogo_presentaciones (item_id, tipo, valor, unidad_sugerida)
    SELECT nuevo_id, p->>'tipo', p->>'valor', p->>'unidad_sugerida'
    FROM jsonb_array_elements(_presentaciones) AS p;

    RETURN jsonb_build_object('id', nuevo_id);
END;
$$;

-- Función: buscar_similares
CREATE OR REPLACE FUNCTION public.buscar_similares(termino text)
RETURNS TABLE(id uuid, nombre_generico text, nombre_normalizado text, sim real)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT ci.id, ci.nombre_generico, ci.nombre_normalizado, similarity(ci.nombre_normalizado, termino) AS sim
    FROM catalogo_items ci
    WHERE ci.activo = true AND ci.nombre_normalizado % termino
    ORDER BY sim DESC
    LIMIT 3;
END;
$$;

-- Función: buscar_acopios_cercanos
CREATE OR REPLACE FUNCTION public.buscar_acopios_cercanos(
    lat_consulta numeric,
    lon_consulta numeric,
    radio_km numeric DEFAULT 50
) RETURNS TABLE(
    id uuid, user_id uuid, rol character varying, nombre_punto character varying,
    lat numeric, lon numeric, telefono character varying, estado text,
    municipio text, direccion_exacta text, cedula_rif text, activo boolean,
    distancia numeric
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.user_id, p.rol, p.nombre_punto, p.lat, p.lon,
        p.telefono, p.estado, p.municipio, p.direccion_exacta,
        p.cedula_rif, p.activo,
        (ST_DistanceSphere(
            ST_MakePoint(p.lon::DOUBLE PRECISION, p.lat::DOUBLE PRECISION),
            ST_MakePoint(lon_consulta::DOUBLE PRECISION, lat_consulta::DOUBLE PRECISION)
        ) / 1000.0)::NUMERIC AS distancia
    FROM perfiles p
    WHERE p.rol = 'centro_acopio'
        AND p.activo = true
        AND p.lat IS NOT NULL
        AND p.lon IS NOT NULL
        AND ST_DistanceSphere(
                ST_MakePoint(p.lon::DOUBLE PRECISION, p.lat::DOUBLE PRECISION),
                ST_MakePoint(lon_consulta::DOUBLE PRECISION, lat_consulta::DOUBLE PRECISION)
            ) / 1000.0 <= radio_km
    ORDER BY distancia;
END;
$$;

-- Función: actualizar_estado_entrega
CREATE OR REPLACE FUNCTION public.actualizar_estado_entrega(
    _entrega_id uuid,
    _nuevo_estado character varying
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    v_necesidad_id UUID;
    v_donacion_id UUID;
    v_estado_actual VARCHAR;
BEGIN
    SELECT necesidad_id, donacion_id, estado INTO v_necesidad_id, v_donacion_id, v_estado_actual
    FROM entregas WHERE id = _entrega_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entrega no encontrada';
    END IF;

    IF v_estado_actual = 'cancelada' OR v_estado_actual = 'entregada' THEN
        RAISE EXCEPTION 'No se puede cambiar un estado final';
    END IF;

    UPDATE entregas SET estado = _nuevo_estado, fecha_actualizacion = NOW() WHERE id = _entrega_id;

    IF _nuevo_estado = 'entregada' THEN
        UPDATE necesidades SET estado = 'cubierta' WHERE id = v_necesidad_id;
        IF v_donacion_id IS NOT NULL THEN
            UPDATE donaciones SET estado = 'entregada' WHERE id = v_donacion_id;
        END IF;
    ELSIF _nuevo_estado = 'cancelada' THEN
        UPDATE necesidades SET estado = 'pendiente' WHERE id = v_necesidad_id;
        IF v_donacion_id IS NOT NULL THEN
            UPDATE donaciones SET estado = 'disponible' WHERE id = v_donacion_id;
        END IF;
    END IF;
END;
$$;

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS en tablas
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_donacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.necesidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_acopio ENABLE ROW LEVEL SECURITY;

-- perfiles
CREATE POLICY "Usuarios pueden leer su perfil" ON public.perfiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden crear su perfil" ON public.perfiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden actualizar su perfil" ON public.perfiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Leer perfiles" ON public.perfiles FOR SELECT TO authenticated USING (true);

-- donaciones
CREATE POLICY "donaciones_insert" ON public.donaciones FOR INSERT TO public WITH CHECK (auth.role() = 'authenticated'::text);
CREATE POLICY "donaciones_select" ON public.donaciones FOR SELECT TO public USING (
    (auth.uid() = donante_id) OR 
    ((modo_entrega = 'recogida'::text) AND (estado = 'ofrecida'::text)) OR 
    (auth.role() = 'authenticated'::text)
);

-- detalle_donacion
CREATE POLICY "detalle_donacion_insert" ON public.detalle_donacion FOR INSERT TO public WITH CHECK (auth.role() = 'authenticated'::text);
CREATE POLICY "detalle_donacion_select" ON public.detalle_donacion FOR SELECT TO public USING (
    auth.uid() IN (SELECT donaciones.donante_id FROM donaciones WHERE donaciones.id = detalle_donacion.donacion_id)
);

-- necesidades
CREATE POLICY "necesidades_select" ON public.necesidades FOR SELECT TO public USING (auth.role() = 'authenticated'::text);

-- despachos
CREATE POLICY "despachos_select_voluntario" ON public.despachos FOR SELECT TO public USING (
    (auth.role() = 'authenticated'::text) AND (estado = 'preparando'::text)
);

-- inventario_acopio
-- (sin políticas públicas de lectura tras la purga; se accede solo via API autenticada)