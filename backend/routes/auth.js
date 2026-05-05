const express = require('express');
const router = express.Router();
const { login, changePassword, solicitarRecuperacion, restablecerPassword } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { registrarAccionFrontend } = require('../controllers/auditController');


// POST /api/auth/login
router.post('/login', login);

router.post('/auditoria/frontend', verificarToken, registrarAccionFrontend); 

// POST /api/auth/change-password
router.post('/change-password', verificarToken, changePassword);

// POST /api/auth/forgot-password (Solicitar el código al correo)
router.post('/forgot-password', solicitarRecuperacion);

// POST /api/auth/reset-password (Validar código y guardar nueva clave)
router.post('/reset-password', restablecerPassword);

module.exports = router;
