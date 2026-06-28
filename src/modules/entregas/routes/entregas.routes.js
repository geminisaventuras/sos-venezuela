// @build: 2026-06-26.23-00-00 | id: B4-ENTv2 | desc: Rutas entregas protegidas
const express = require('express');
const router = express.Router();
const EntregaRepository = require('../repositories/entrega.repository');
const EntregaService = require('../services/entrega.service');
const EntregaController = require('../controllers/entrega.controller');
const { authMiddleware, roleMiddleware } = require('../../../middleware/auth.middleware');

const repo = new EntregaRepository();
const service = new EntregaService(repo);
const controller = new EntregaController(service);

router.post('/', authMiddleware, roleMiddleware('voluntario', 'centro_acopio'), (req, res, next) => controller.crear(req, res, next));
router.patch('/:id', authMiddleware, roleMiddleware('voluntario', 'centro_acopio'), (req, res, next) => controller.actualizar(req, res, next));
router.get('/', authMiddleware, roleMiddleware('voluntario', 'centro_acopio'), (req, res, next) => controller.listar(req, res, next));

module.exports = router;
