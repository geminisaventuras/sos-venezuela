// @build: 2026-06-29.11-00-00 | id: B3-DON-ROUTES-FIX | desc: Permitir que donantes también creen donaciones
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

// Se agrega 'donante' para que los donantes puedan registrar sus donaciones
router.post('/', authMiddleware, roleMiddleware('centro_acopio', 'donante'), (req, res, next) => controller.crear(req, res, next));
router.get('/', authMiddleware, roleMiddleware('centro_acopio', 'super_admin'), (req, res, next) => controller.listarPorAcopio(req, res, next));
router.patch('/:id/confirmar', authMiddleware, roleMiddleware('centro_acopio', 'super_admin'), (req, res, next) => controller.confirmarRecepcion(req, res, next));
router.get('/:id/trazabilidad', authMiddleware, (req, res, next) => controller.trazabilidad(req, res, next));
// @build: 2026-06-30.09-00-00 | id: B3-DON-ROUTES-RECOGER | desc: Rutas con endpoint de recogida
router.patch('/:id/recoger', authMiddleware, roleMiddleware('voluntario'), (req, res, next) => controller.recoger(req, res, next));
module.exports = router;