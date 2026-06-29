// @build: 2026-06-30.17-00-00 | id: B3-DON-ROUTES-ORDEN-V2 | desc: Rutas donaciones con GET /historial antes de rutas parametrizadas
const express = require('express');
const router = express.Router();
const DonacionRepository = require('../repositories/donacion.repository');
const DonacionService = require('../services/donacion.service');
const DonacionController = require('../controllers/donacion.controller');
const { authMiddleware, roleMiddleware } = require('../../../middleware/auth.middleware');
const InventarioRepository = require('../../inventario/repositories/inventario.repository');

const donacionRepo = new DonacionRepository();
const inventarioRepo = new InventarioRepository();
const service = new DonacionService(donacionRepo, inventarioRepo);
const controller = new DonacionController(service);

router.post('/', authMiddleware, roleMiddleware('centro_acopio', 'donante'), (req, res, next) => controller.crear(req, res, next));
router.get('/', authMiddleware, roleMiddleware('centro_acopio', 'super_admin'), (req, res, next) => controller.listarPorAcopio(req, res, next));

// Ruta estática ANTES de las parametrizadas
router.get('/historial', authMiddleware, roleMiddleware('donante'), (req, res, next) => controller.listarHistorial(req, res, next));

// Rutas específicas (antes que PATCH /:id genérico)
router.patch('/:id/confirmar', authMiddleware, roleMiddleware('centro_acopio', 'super_admin'), (req, res, next) => controller.confirmarRecepcion(req, res, next));
router.patch('/:id/recoger', authMiddleware, roleMiddleware('voluntario'), (req, res, next) => controller.recoger(req, res, next));
router.patch('/:id/cancelar', authMiddleware, roleMiddleware('donante'), (req, res, next) => controller.cancelar(req, res, next));
router.get('/:id/trazabilidad', authMiddleware, (req, res, next) => controller.trazabilidad(req, res, next));

// Ruta genérica PATCH /:id al FINAL
router.patch('/:id', authMiddleware, roleMiddleware('donante'), (req, res, next) => controller.modificar(req, res, next));

module.exports = router;