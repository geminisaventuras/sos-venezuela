// @build: 2026-06-29.21-00-00 | id: B4-ENT-SCHEMA-FIX | desc: Esquema de entrega que acepta donacion_id opcional sin necesidad_id obligatorio
const { z } = require('zod');

const crearEntregaSchema = z.object({
  idempotencyKey: z.string().uuid(),
  voluntario_telefono: z.string().regex(/^[0-9]{7,15}$/),
  necesidad_id: z.string().uuid().optional(),
  donacion_id: z.string().uuid().optional()
}).refine(data => data.necesidad_id || data.donacion_id, {
  message: "Debe proporcionar necesidad_id o donacion_id"
});

const actualizarEstadoSchema = z.object({
  estado: z.enum(['en_camino', 'entregada', 'cancelada']),
});

module.exports = { crearEntregaSchema, actualizarEstadoSchema };