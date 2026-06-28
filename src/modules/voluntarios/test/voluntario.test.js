// @build: 2026-06-26.18-30-00 | id: B2-VOL | backup: voluntario.test.js.backup-20260626-183000 | desc: Pruebas unitarias de voluntarios
const request = require('supertest');
const app = require('../../../app');
const supabase = require('../../../config/supabase');

jest.mock('../../../config/supabase', () => ({
  from: jest.fn(),
  rpc: jest.fn(),
}));

describe('POST /api/voluntarios', () => {
  const basePayload = {
    telefono: '04121234567',
    nombre: 'Carlos Pérez',
    tipo_vehiculo: 'moto',
    lat: 10.4806,
    lon: -66.9036,
    activo: true,
  };

  test('Flujo feliz: upsert exitoso', async () => {
    supabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'uuid-1', telefono: basePayload.telefono }, error: null }),
    });
    const res = await request(app).post('/api/voluntarios').send(basePayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Validación: 400 por teléfono inválido', async () => {
    const invalid = { ...basePayload, telefono: '123' };
    const res = await request(app).post('/api/voluntarios').send(invalid);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/voluntarios/necesidades-cercanas', () => {
  test('Flujo feliz: retorna lista', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const res = await request(app).get('/api/voluntarios/necesidades-cercanas?lat=10.48&lon=-66.90&radio=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});