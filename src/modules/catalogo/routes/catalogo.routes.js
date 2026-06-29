// @build: 2026-06-29.06-00-00 | id: B6-CAT-ROUTES-V3 | desc: Rutas con endpoint de categorías
const express = require('express');
const router = express.Router();
const CatalogoRepository = require('../repositories/catalogo.repository');
const CatalogoService = require('../services/catalogo.service');
const CatalogoController = require('../controllers/catalogo.controller');
const { authMiddleware } = require('../../../middleware/auth.middleware');

const repo = new CatalogoRepository();
const service = new CatalogoService(repo);
const controller = new CatalogoController(service);

// Endpoint de categorías (debe ir antes de la ruta genérica GET /)
router.get('/categorias', authMiddleware, (req, res, next) => controller.listarCategorias(req, res, next));

// Búsqueda pública
router.get('/', authMiddleware, (req, res, next) => controller.buscar(req, res, next));

// Crear nuevo ítem
router.post('/', authMiddleware, (req, res, next) => controller.crear(req, res, next));

module.exports = router;