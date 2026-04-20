const express = require('express');
const {
  listarMovimientos,
  guardarMovimientos,
  obtenerCierreTrimestral,
  cerrarTrimestre,
  obtenerSaldosBanco,
  guardarSaldosBanco
} = require('../controllers/movimientosController');

const router = express.Router();

router.get('/cierres/estado', obtenerCierreTrimestral);
router.post('/cierres', cerrarTrimestre);

router.get('/saldos-banco', obtenerSaldosBanco);
router.post('/saldos-banco', guardarSaldosBanco);

router.get('/:tipo', listarMovimientos);
router.post('/:tipo/replace-range', guardarMovimientos);

module.exports = router;
