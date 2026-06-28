// @build: 2026-06-26.18-30-00 | id: B1-NEC | backup: necesidad.test.js.backup-20260626-183000 | desc: Pruebas unitarias de necesidades
const request = require('supertest');
const app = require('../../../app');
const supabase = require('../../../config/supabase');

jest.mock('../../../config/supabase', () => ({
  from: jest.fn(),
  rpc: jest.fn(),
}));

describe('POST /api/necesidades', () => {
  const basePayload = {
    idempotencyKey: '123e4567-e89b-12d3-a456-426614174000',
    punto: 'Refugio Esperanza',
    ubicacion: { lat: 10.4806, lon: -66.9036 },
    items: [{ tipo: 'agua_potable', cantidad: 100, unidad: 'litros' }],
    prioridad: 'alta',
    contacto: '0412-1234567',
  };

  test('Flujo feliz: 201 Created', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null }),
    });
    supabase.rpc.mockResolvedValue({ data: '550e8400-e29b-41d4-a716-446655440000', error: null });
    const res = await request(app).post('/api/necesidades').send(basePayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  test('Idempotencia: 200 con ID existente', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id: '550e8400-e29b-41d4-a716-446655440000' } }),
    });
    const res = await request(app).post('/api/necesidades').send(basePayload);
    expect(res.status).toBe(200);
    expect(res.body.data.idempotente).toBe(true);
  });

  test('Validación: 400 por datos inválidos', async () => {
    const invalid = { ...basePayload, ubicacion: { lat: 100 } };
    const res = await request(app).post('/api/necesidades').send(invalid);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});