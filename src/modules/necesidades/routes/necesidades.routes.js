// @build: 2026-06-27.04-00-00 | id: B1-NECv4 | desc: Rutas necesidades con acceso para refugio/centro_salud
const express = require('express');
const router = express.Router();
const NecesidadRepository = require('../repositories/necesidad.repository');
const NecesidadService = require('../services/necesidad.service');
const NecesidadController = require('../controllers/necesidad.controller');
const { authMiddleware, roleMiddleware } = require('../../../middleware/auth.middleware');

const repo = new NecesidadRepository();
const service = new NecesidadService(repo);
const controller = new NecesidadController(service);

router.post('/', authMiddleware, roleMiddleware('refugio', 'centro_salud', 'centro_acopio'), (req, res, next) => controller.crear(req, res, next));
// Ahora refugio y centro_salud también pueden listar (solo sus necesidades)
router.get('/', authMiddleware, roleMiddleware('refugio', 'centro_salud', 'centro_acopio'), (req, res, next) => controller.listar(req, res, next));

module.exports = router;
