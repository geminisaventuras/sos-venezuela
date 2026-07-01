// @build: 2026-06-29.16-30-00 | id: B2-VOL-ROUTES-DONACIONES | desc: Rutas de voluntarios con endpoint de donaciones pendientes
const express = require('express');
const router = express.Router();
const VoluntarioRepository = require('../repositories/voluntario.repository');
const VoluntarioService = require('../services/voluntario.service');
const VoluntarioController = require('../controllers/voluntario.controller');
const { authMiddleware, roleMiddleware } = require('../../../middleware/auth.middleware');

const repo = new VoluntarioRepository();
const service = new VoluntarioService(repo);
const controller = new VoluntarioController(service);

// Endpoint para liberar sesiones atrapadas (sin authMiddleware porque la sesión está bloqueada)
router.post('/liberar-sesion', (req, res, next) => controller.liberarSesion(req, res, next));

router.post('/', authMiddleware, roleMiddleware('voluntario'), (req, res, next) => controller.registrar(req, res, next));
router.get('/mi-perfil', authMiddleware, roleMiddleware('voluntario'), (req, res, next) => controller.miPerfil(req, res, next));
router.get('/necesidades-cercanas', authMiddleware, roleMiddleware('voluntario', 'centro_acopio'), (req, res, next) => controller.necesidadesCercanas(req, res, next));
router.get('/donaciones-pendientes', authMiddleware, roleMiddleware('voluntario'), (req, res, next) => controller.donacionesPendientes(req, res, next));

module.exports = router;