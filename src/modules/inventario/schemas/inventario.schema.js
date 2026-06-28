// @build: 2026-06-27.17-15-00 | id: B10-INV-SCHEMA | desc: Esquemas de validación Zod para inventario
const { z } = require('zod');

const ingresoInventarioSchema = z.object({
  acopio_id: z.string().uuid(),
  insumo_id: z.string().uuid(),
  tipo: z.string().min(1).max(50),
  detalle: z.string().min(1).max(200),
  unidad: z.string().min(1).max(20),
  cantidad: z.number().positive(),
  fecha_vencimiento: z.string().optional().nullable(),
  lote_id: z.string().uuid().optional(),
  donacion_id: z.string().uuid().optional()
});

const egresoInventarioSchema = z.object({
  acopio_id: z.string().uuid(),
  items: z.array(z.object({
    inventario_id: z.string().uuid(),
    cantidad: z.number().positive()
  }))
});

const consultaInventarioSchema = z.object({
  acopio_id: z.string().uuid()
});

module.exports = { ingresoInventarioSchema, egresoInventarioSchema, consultaInventarioSchema };