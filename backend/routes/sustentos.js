const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { subirSustentoPDF, obtenerSustentos, eliminarSustento } = require('../controllers/sustentoController');

// Endpoint POST para subir el archivo
router.post('/upload', upload.single('archivoPdf'), subirSustentoPDF);

// Endpoint GET para listar los archivos de un trimestre
router.get('/', obtenerSustentos);

// Endpoint DELETE para borrar un archivo (base de datos y físico)
router.delete('/:id', eliminarSustento);

module.exports = router;