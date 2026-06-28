CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. perfiles (actualizar existente)
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS direccion_exacta TEXT;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS cedula_rif TEXT;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- 2. catalogo_insumos
CREATE TABLE IF NOT EXISTS catalogo_insumos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_mostrar TEXT NOT NULL,
  nombre_normalizado TEXT NOT NULL UNIQUE,
  categoria TEXT NOT NULL CHECK (categoria IN ('medicinas','alimentos','agua','ropa','calzado','colchonetas','material_medico','equipos','higiene','otros')),
  tipo_general TEXT NOT NULL DEFAULT 'otros',
  unidad_sugerida TEXT NOT NULL DEFAULT 'unidades',
  requiere_vencimiento BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_catalogo_normalizado ON catalogo_insumos USING gin (unaccent(nombre_normalizado) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_catalogo_categoria ON catalogo_insumos(categoria);

-- 3. inventario_acopio
CREATE TABLE IF NOT EXISTS inventario_acopio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  acopio_id UUID REFERENCES perfiles(user_id) ON DELETE RESTRICT,
  insumo_id UUID REFERENCES catalogo_insumos(id) ON DELETE RESTRICT,
  tipo TEXT NOT NULL,
  detalle TEXT NOT NULL,
  unidad TEXT NOT NULL,
  cantidad NUMERIC NOT NULL CHECK (cantidad > 0),
  fecha_vencimiento DATE,
  lote_id UUID,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now(),
  UNIQUE(acopio_id, insumo_id, lote_id)
);
CREATE INDEX IF NOT EXISTS idx_inventario_acopio ON inventario_acopio(acopio_id);
CREATE INDEX IF NOT EXISTS idx_inventario_vencimiento ON inventario_acopio(fecha_vencimiento);

-- 4. donaciones
CREATE TABLE IF NOT EXISTS donaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donante_id UUID REFERENCES perfiles(user_id) ON DELETE RESTRICT,
  acopio_destino_id UUID REFERENCES perfiles(user_id) ON DELETE RESTRICT,
  modo_entrega TEXT NOT NULL CHECK (modo_entrega IN ('propia','recogida')),
  direccion_recogida TEXT,
  lat_recogida NUMERIC,
  lon_recogida NUMERIC,
  estado TEXT NOT NULL DEFAULT 'ofrecida' CHECK (estado IN ('ofrecida','en_transito_a_acopio','recibida','totalmente_rechazada')),
  voluntario_recoleccion_id UUID REFERENCES perfiles(user_id) ON DELETE SET NULL,
  cantidad_rechazada NUMERIC DEFAULT 0,
  motivo_rechazo TEXT,
  fecha_recibida TIMESTAMPTZ,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- 5. detalle_donacion
CREATE TABLE IF NOT EXISTS detalle_donacion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donacion_id UUID REFERENCES donaciones(id) ON DELETE CASCADE,
  insumo_id UUID REFERENCES catalogo_insumos(id) ON DELETE RESTRICT,
  cantidad NUMERIC NOT NULL CHECK (cantidad > 0),
  cantidad_rechazada NUMERIC DEFAULT 0,
  motivo_rechazo TEXT,
  fecha_vencimiento DATE,
  unidad TEXT NOT NULL
);

-- 6. necesidades
CREATE TABLE IF NOT EXISTS necesidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitante_id UUID REFERENCES perfiles(user_id) ON DELETE RESTRICT,
  tipo_punto TEXT NOT NULL CHECK (tipo_punto IN ('refugio','hospital')),
  prioridad TEXT NOT NULL CHECK (prioridad IN ('alta','media','baja')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','parcial','en_camino','cubierta','cancelacion_parcial')),
  items JSONB NOT NULL,
  punto TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lon NUMERIC NOT NULL,
  contacto TEXT,
  idempotency_key UUID UNIQUE NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- 7. despachos
CREATE TABLE IF NOT EXISTS despachos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  necesidad_id UUID REFERENCES necesidades(id) ON DELETE RESTRICT,
  acopio_id UUID REFERENCES perfiles(user_id) ON DELETE RESTRICT,
  voluntario_id UUID REFERENCES perfiles(user_id) ON DELETE SET NULL,
  items_despachados JSONB NOT NULL,
  lote_id_origen UUID,
  estado TEXT NOT NULL DEFAULT 'preparando' CHECK (estado IN ('preparando','en_transito_a_destino','entregado_pendiente_firma','entregado','cancelado')),
  estado_anterior TEXT,
  ultima_actualizacion TIMESTAMPTZ DEFAULT now(),
  foto_evidencia TEXT,
  fecha_salida TIMESTAMPTZ,
  fecha_llegada TIMESTAMPTZ,
  fecha_confirmacion TIMESTAMPTZ,
  idempotency_key UUID UNIQUE NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_despachos_voluntario ON despachos(voluntario_id) WHERE voluntario_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_despachos_necesidad ON despachos(necesidad_id);

-- 8. incidencias
CREATE TABLE IF NOT EXISTS incidencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  despacho_id UUID REFERENCES despachos(id) ON DELETE CASCADE,
  reportado_por UUID REFERENCES perfiles(user_id),
  tipo TEXT NOT NULL DEFAULT 'otro',
  descripcion TEXT NOT NULL,
  resuelta BOOLEAN DEFAULT false,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- Catálogo inicial de 50 insumos
INSERT INTO catalogo_insumos (nombre_mostrar, nombre_normalizado, categoria, tipo_general, unidad_sugerida, requiere_vencimiento) VALUES
('Paracetamol 500mg', 'paracetamol 500mg', 'medicinas', 'medicinas', 'unidades', true),
('Ibuprofeno 400mg', 'ibuprofeno 400mg', 'medicinas', 'medicinas', 'unidades', true),
('Amoxicilina 500mg', 'amoxicilina 500mg', 'medicinas', 'medicinas', 'unidades', true),
('Omeprazol 20mg', 'omeprazol 20mg', 'medicinas', 'medicinas', 'unidades', true),
('Loratadina 10mg', 'loratadina 10mg', 'medicinas', 'medicinas', 'unidades', true),
('Metformina 850mg', 'metformina 850mg', 'medicinas', 'medicinas', 'unidades', true),
('Losartán 50mg', 'losartán 50mg', 'medicinas', 'medicinas', 'unidades', true),
('Atorvastatina 20mg', 'atorvastatina 20mg', 'medicinas', 'medicinas', 'unidades', true),
('Insulina', 'insulina', 'medicinas', 'medicinas', 'dosis', true),
('Salbutamol inhalador', 'salbutamol inhalador', 'medicinas', 'medicinas', 'unidades', true),
('Sales de rehidratación oral', 'sales de rehidratacion oral', 'medicinas', 'medicinas', 'sobres', true),
('Ciprofloxacino', 'ciprofloxacino', 'medicinas', 'medicinas', 'unidades', true),
('Gasas estériles', 'gasas esteriles', 'material_medico', 'medicinas', 'unidades', false),
('Vendas elásticas', 'vendas elasticas', 'material_medico', 'medicinas', 'unidades', false),
('Alcohol antiséptico', 'alcohol antiseptico', 'material_medico', 'medicinas', 'litros', false),
('Yodopovidona', 'yodopovidona', 'material_medico', 'medicinas', 'unidades', false),
('Jeringas 5ml', 'jeringas 5ml', 'material_medico', 'medicinas', 'unidades', false),
('Jeringas 10ml', 'jeringas 10ml', 'material_medico', 'medicinas', 'unidades', false),
('Agujas hipodérmicas', 'agujas hipodermicas', 'material_medico', 'medicinas', 'unidades', false),
('Guantes de látex', 'guantes de latex', 'material_medico', 'medicinas', 'cajas', false),
('Mascarillas quirúrgicas', 'mascarillas quirurgicas', 'material_medico', 'medicinas', 'cajas', false),
('Termómetros digitales', 'termometros digitales', 'equipos', 'medicinas', 'unidades', false),
('Tensiómetros', 'tensiometros', 'equipos', 'medicinas', 'unidades', false),
('Oxímetros de pulso', 'oximetros de pulso', 'equipos', 'medicinas', 'unidades', false),
('Kit de curación', 'kit de curacion', 'material_medico', 'medicinas', 'unidades', false),
('Sutura', 'sutura', 'material_medico', 'medicinas', 'unidades', true),
('Algodón', 'algodon', 'material_medico', 'medicinas', 'unidades', false),
('Pañales para adulto', 'panales para adulto', 'higiene', 'otros', 'unidades', false),
('Pañales para bebé', 'panales para bebe', 'higiene', 'otros', 'unidades', false),
('Leche de fórmula', 'leche de formula', 'alimentos', 'alimentos_no_perecibles', 'kg', true),
('Botella de agua 500ml', 'botella de agua 500ml', 'agua', 'agua_potable', 'ml', true),
('Botella de agua 1L', 'botella de agua 1l', 'agua', 'agua_potable', 'litros', true),
('Botellón de agua 5L', 'botellon de agua 5l', 'agua', 'agua_potable', 'litros', true),
('Garrafón de agua 20L', 'garrafon de agua 20l', 'agua', 'agua_potable', 'litros', true),
('Arroz', 'arroz', 'alimentos', 'alimentos_no_perecibles', 'kg', true),
('Frijoles', 'frijoles', 'alimentos', 'alimentos_no_perecibles', 'kg', true),
('Pasta', 'pasta', 'alimentos', 'alimentos_no_perecibles', 'kg', true),
('Harina', 'harina', 'alimentos', 'alimentos_no_perecibles', 'kg', true),
('Azúcar', 'azucar', 'alimentos', 'alimentos_no_perecibles', 'kg', true),
('Aceite', 'aceite', 'alimentos', 'alimentos_no_perecibles', 'litros', true),
('Latas de atún', 'latas de atun', 'alimentos', 'alimentos_no_perecibles', 'unidades', true),
('Galletas', 'galletas', 'alimentos', 'alimentos_no_perecibles', 'paquetes', true),
('Sal', 'sal', 'alimentos', 'alimentos_no_perecibles', 'kg', false),
('Colchonetas individuales', 'colchonetas individuales', 'colchonetas', 'colchonetas', 'unidades', false),
('Colchonetas matrimoniales', 'colchonetas matrimoniales', 'colchonetas', 'colchonetas', 'unidades', false),
('Sacos de dormir', 'sacos de dormir', 'colchonetas', 'colchonetas', 'unidades', false),
('Camisetas', 'camisetas', 'ropa', 'ropa', 'unidades', false),
('Pantalones', 'pantalones', 'ropa', 'ropa', 'unidades', false),
('Ropa interior', 'ropa interior', 'ropa', 'ropa', 'unidades', false),
('Zapatos deportivos', 'zapatos deportivos', 'calzado', 'calzado', 'unidades', false)
ON CONFLICT (nombre_normalizado) DO NOTHING;

-- Políticas RLS
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS perfiles_select ON perfiles;
CREATE POLICY perfiles_select ON perfiles FOR SELECT USING (true);
DROP POLICY IF EXISTS perfiles_insert ON perfiles;
CREATE POLICY perfiles_insert ON perfiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS perfiles_update ON perfiles;
CREATE POLICY perfiles_update ON perfiles FOR UPDATE USING (auth.uid() = user_id);