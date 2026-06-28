const { z } = require('zod');

const perfilEsquema = z.object({
  rol: z.enum(['super_admin', 'donante', 'refugio', 'centro_salud', 'centro_acopio', 'voluntario']),
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