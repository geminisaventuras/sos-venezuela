// @build: 2026-06-26.23-00-00 | id: B6-CAT | desc: Rutas de catálogo
const express = require('express');
const router = express.Router();
const CatalogoRepository = require('../repositories/catalogo.repository');
const CatalogoService = require('../services/catalogo.service');
const CatalogoController = require('../controllers/catalogo.controller');

const repo = new CatalogoRepository();
const service = new CatalogoService(repo);
const controller = new CatalogoController(service);

router.get('/', (req, res, next) => controller.obtener(req, res, next));

module.exports = router;
