const fetch = require('node-fetch');
const API = 'http://localhost:3000';
const TOKEN_MANUAL = process.env.E2E_TOKEN_DONANTE;
const ACOPIO_PASS = process.env.E2E_ACOPIO_PASS;
let tokenDonante, tokenAcopio, donacionId;
jest.setTimeout(30000);

describe('Flujo E2E Completo - SOS Venezuela', () => {
  test('F1: Obtener token del donante (manual)', async () => {
    if (!TOKEN_MANUAL) throw new Error('E2E_TOKEN_DONANTE no definido');
    tokenDonante = TOKEN_MANUAL;
    expect(tokenDonante).toBeDefined();
  });
  test('F2: Buscar insumo en catálogo', async () => {
    const res = await fetch(`${API}/api/catalogo?q=paracetamol`, {
      headers: { Authorization: `Bearer ${tokenDonante}` }
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
  test('F3: Crear una donación', async () => {
    const res = await fetch(`${API}/api/donaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDonante}` },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        centro_acopio: { nombre: 'Acopio Central', lat: 10.48, lon: -66.90 },
        items: [{ tipo: 'medicinas', detalle: 'Paracetamol', cantidad: 10, unidad: 'tabletas' }],
        donante: 'Juan Perez'
      })
    });
    const body = await res.json();
    expect(res.status).toBe(201);
    donacionId = body.data.id;
  });
  test('F6: Consultar trazabilidad de la donación', async () => {
    const res = await fetch(`${API}/api/donaciones/${donacionId}/trazabilidad`, {
      headers: { Authorization: `Bearer ${tokenDonante}` }
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.estado_actual).toBe('ofrecida');
  });
});