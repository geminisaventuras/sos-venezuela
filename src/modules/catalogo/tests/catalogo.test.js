// @build: 2026-06-29.17-00-00 | id: TEST-CAT-03 | desc: Pruebas unitarias finales del módulo de catálogo (MEU)
const request = require('supertest');
const express = require('express');

// Mock de Supabase
jest.mock('../../../config/supabase', () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  const mockSupabase = {
    from: jest.fn().mockReturnValue(mockQuery),
    rpc: jest.fn().mockResolvedValue({ data: { id: 'new-item-id' }, error: null }),
  };
  return mockSupabase;
});

// Mock del middleware de autenticación
jest.mock('../../../middleware/auth.middleware', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { sub: 'test-user-id', email: 'test@test.com', rol: 'donante' };
    req.traceId = 'test-trace-id';
    next();
  },
  roleMiddleware: () => (req, res, next) => next(),
}));

const catalogoRoutes = require('../routes/catalogo.routes');

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.traceId = 'test-trace-id'; next(); });
app.use('/api/catalogo', catalogoRoutes);

const UUID_VALIDO = '123e4567-e89b-12d3-a456-426614174000';

describe('Módulo de Catálogo - Pruebas Unitarias (MEU)', () => {

  test('Flujo Feliz: GET /api/catalogo?q=paracetamol devuelve 200 y array', async () => {
    // Forzar que la consulta final (limit) devuelva un array vacío
    const mockSupabase = require('../../../config/supabase');
    const mockQuery = mockSupabase.from();
    mockQuery.limit.mockResolvedValueOnce({ data: [], error: null });

    const res = await request(app)
      .get('/api/catalogo?q=paracetamol')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('Falla de Validación: GET /api/catalogo?q=a devuelve 400 (mínimo 2 caracteres)', async () => {
    const res = await request(app)
      .get('/api/catalogo?q=a')
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Conflicto: POST /api/catalogo con nombre duplicado devuelve 409', async () => {
    const mockSupabase = require('../../../config/supabase');
    mockSupabase.from().maybeSingle.mockResolvedValueOnce({ data: { id: 'existing-id' }, error: null });

    const res = await request(app)
      .post('/api/catalogo')
      .send({
        nombre_generico: 'Paracetamol',
        categoria_id: UUID_VALIDO,
        presentaciones: [{ tipo: 'presentacion', valor: 'Tableta 500mg', unidad_sugerida: 'tabletas' }]
      })
      .expect('Content-Type', /json/)
      .expect(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

});