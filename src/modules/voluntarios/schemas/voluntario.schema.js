// @build: 2026-06-26.18-30-00 | id: B2-VOL | backup: voluntario.schema.js.backup-20260626-183000 | desc: Esquema Zod para voluntarios
const { z } = require('zod');

const voluntarioSchema = z.object({
  telefono: z.string().regex(/^[0-9]{7,15}$/),
  nombre: z.string().min(3).max(100).transform(v => v.trim()),
  tipo_vehiculo: z.enum(['moto', 'carro', 'camioneta', 'bicicleta', 'a_pie']),
  capacidad_carga: z.string().max(50).optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  activo: z.boolean().default(true),
});

module.exports = { voluntarioSchema };