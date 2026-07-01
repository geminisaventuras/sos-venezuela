// @build: 2026-06-28.07-00-00 | id: B3-DON-SCHEMA-V2 | desc: Esquemas de donación con confirmación de recepción
const { z } = require('zod');

const itemSchema = z.object({
  tipo: z.enum(['agua_potable', 'alimentos_no_perecibles', 'medicinas', 'colchonetas', 'ropa', 'otros']),
  cantidad: z.number().positive(),
  unidad: z.string().min(1).max(20),
  detalle: z.string().max(200).optional(),
  descripcion: z.string().optional().nullable(),  // ← NUEVO: texto amigable
  formula: z.object({}).optional().nullable()    // ← NUEVO: datos de la fórmula
});

const crearDonacionSchema = z.object({
  idempotencyKey: z.string().uuid(),
  centro_acopio: z.object({ nombre: z.string().min(3).max(100).transform(v => v.trim()), lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }),
  items: z.array(itemSchema).min(1),
  donante: z.string().max(100).optional().transform(v => v?.trim()),
});

const confirmarRecepcionSchema = z.object({
  cantidad_rechazada: z.number().min(0).optional().default(0),
  motivo_rechazo: z.string().max(300).optional()
});

module.exports = { crearDonacionSchema, confirmarRecepcionSchema, itemSchema };