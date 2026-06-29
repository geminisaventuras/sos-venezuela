// @build: 2026-06-28.20-15-00 | id: B30-PERFIL-SCHEMA-R3 | backup: perfil.schema.js.backup-20260628-201500 | desc: Eliminado campo 'rol' del esquema para prevenir escalación (R3)
const { z } = require('zod');

const perfilEsquema = z.object({
  // 'rol' se eliminó del esquema. Lo asigna el servidor basado en el token verificado.
  nombre: z.string().min(1).max(100).optional(),
  nombre_punto: z.string().min(1).max(100).optional(),
  tipo_punto: z.string().optional().nullable(),
  telefono: z.string().min(7).max(15).optional().nullable(),
  vehiculo: z.enum(['moto', 'carro', 'camioneta', 'bicicleta', 'a_pie']).optional().nullable(),
  capacidad_kg: z.number().optional().nullable(),
  lat: z.number().optional().nullable(),
  lon: z.number().optional().nullable(),
  estado: z.string().optional().nullable(),
  municipio: z.string().optional().nullable(),
  direccion_exacta: z.string().optional().nullable(),
  cedula_rif: z.string().optional().nullable()
});

module.exports = { perfilEsquema };