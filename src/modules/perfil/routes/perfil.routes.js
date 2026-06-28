const express = require('express');
const router = express.Router();
const PerfilRepository = require('../repositories/perfil.repository');
const PerfilService = require('../services/perfil.service');
const PerfilController = require('../controllers/perfil.controller');
const { authMiddleware } = require('../../../middleware/auth.middleware');

const repository = new PerfilRepository();
const service = new PerfilService(repository);
const controller = new PerfilController(service);

router.get('/', authMiddleware, (req, res, next) => controller.obtener(req, res, next));
router.post('/', authMiddleware, (req, res, next) => controller.guardar(req, res, next));

module.exports = router;