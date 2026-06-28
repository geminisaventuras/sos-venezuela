// @build: 2026-06-27.17-20-00 | id: B11-DESP-SCHEMA | desc: Esquemas Zod para despachos
const { z } = require('zod');

const itemDespachoSchema = z.object({
  inventario_id: z.string().uuid(),
  cantidad: z.number().positive()
});

const crearDespachoSchema = z.object({
  idempotencyKey: z.string().uuid(),
  necesidad_id: z.string().uuid(),
  acopio_id: z.string().uuid(),
  items: z.array(itemDespachoSchema).min(1)
});

const actualizarDespachoSchema = z.object({
  estado: z.enum(['en_transito_a_destino', 'entregado_pendiente_firma', 'entregado', 'cancelado']),
  foto_evidencia: z.string().url().optional(),
  incidencia: z.object({
    tipo: z.string().max(50),
    descripcion: z.string().max(500)
  }).optional()
});

module.exports = { crearDespachoSchema, actualizarDespachoSchema };