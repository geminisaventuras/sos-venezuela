// @build: 2026-06-30.12-00-00 | id: B11-DESP-ROUTES-FINAL | desc: Rutas de despachos
const express = require('express');
const router = express.Router();
const repo = new (require('../repositories/despacho.repository'))();
const service = new (require('../services/despacho.service'))(repo);
const controller = new (require('../controllers/despacho.controller'))(service);
const { authMiddleware, roleMiddleware } = require('../../../middleware/auth.middleware');

router.post('/', authMiddleware, roleMiddleware('centro_acopio', 'super_admin'), (req, res, next) => controller.crear(req, res, next));
router.patch('/:id', authMiddleware, roleMiddleware('voluntario', 'centro_acopio', 'super_admin'), (req, res, next) => controller.actualizar(req, res, next));
router.get('/voluntario', authMiddleware, roleMiddleware('voluntario'), (req, res, next) => controller.listarVoluntario(req, res, next));
router.get('/pendientes', authMiddleware, roleMiddleware('centro_acopio', 'super_admin', 'voluntario'), (req, res, next) => controller.listarPendientes(req, res, next));

module.exports = router;