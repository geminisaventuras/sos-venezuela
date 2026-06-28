// @build: 2026-06-28.18-00-00 | id: B1-NECv3 | desc: Esquema necesidad con calzado incluido
const { z } = require('zod');

const itemSchema = z.object({
  tipo: z.enum(['agua_potable', 'alimentos_no_perecibles', 'medicinas', 'colchonetas', 'ropa', 'calzado', 'otros']),
  cantidad: z.number().positive(),
  unidad: z.string().min(1).max(20),
  detalle: z.string().max(200).optional()
});

const crearNecesidadSchema = z.object({
  idempotencyKey: z.string().uuid(),
  punto: z.string().min(3).max(100).transform(v => v.trim()),
  ubicacion: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  items: z.array(itemSchema).min(1),
  prioridad: z.enum(['alta', 'media', 'baja']),
  contacto: z.string().max(50).optional().transform(v => v?.trim()),
  tipo_punto: z.enum(['refugio', 'hospital']).default('refugio')
});

module.exports = { crearNecesidadSchema, itemSchema };