// @build: 2026-06-29.06-00-00 | id: B6-CAT-SCHEMA-V3 | desc: Schema con categoria_id obligatorio en creación
const { z } = require('zod');

const crearItemSchema = z.object({
  nombre_generico: z.string().min(3).max(100).transform(v => v.trim().replace(/<[^>]*>/g, '')),
  categoria_id: z.string().uuid(), // Obligatorio: todo ítem debe tener categoría
  requiere_vencimiento: z.boolean().optional(),
  presentaciones: z.array(z.object({
    tipo: z.enum(['presentacion', 'especificacion', 'medida']),
    valor: z.string().min(1).max(100),
    unidad_sugerida: z.string().max(20)
  })).min(1)
});

const buscarQuerySchema = z.object({
  q: z.string().min(2).max(100).optional(),
  id: z.string().uuid().optional(),
  categoria_id: z.string().uuid().optional(),
  modulo: z.enum(['medico', 'alimentos', 'agua', 'logistica', 'ropa_calzado', 'higiene', 'otros']).optional()
});

module.exports = { crearItemSchema, buscarQuerySchema };