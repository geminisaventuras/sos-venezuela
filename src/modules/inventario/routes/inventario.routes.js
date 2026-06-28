// @build: 2026-06-27.17-15-00 | id: B10-INV-ROUTES | desc: Rutas de inventario
const express = require('express');
const router = express.Router();
const InventarioRepository = require('../repositories/inventario.repository');
const InventarioService = require('../services/inventario.service');
const InventarioController = require('../controllers/inventario.controller');
const { authMiddleware, roleMiddleware } = require('../../../middleware/auth.middleware');

const repo = new InventarioRepository();
const service = new InventarioService(repo);
const controller = new InventarioController(service);

router.post('/ingreso', authMiddleware, roleMiddleware('centro_acopio', 'super_admin'), (req, res, next) => controller.ingresar(req, res, next));
router.post('/egreso', authMiddleware, roleMiddleware('centro_acopio', 'super_admin'), (req, res, next) => controller.egresar(req, res, next));
router.get('/:acopio_id', authMiddleware, roleMiddleware('centro_acopio', 'super_admin'), (req, res, next) => controller.listar(req, res, next));
router.get('/nacional/consolidado', authMiddleware, roleMiddleware('super_admin'), (req, res, next) => controller.listarNacional(req, res, next));

module.exports = router;