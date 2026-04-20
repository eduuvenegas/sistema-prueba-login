require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const movimientosRoutes = require('./routes/movimientos');
const sustentosRoutes = require('./routes/sustentos');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middlewares
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Servir los archivos PDFs estáticamente para poder descargarlos después
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/sustentos', sustentosRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API UGEL funcionando correctamente ✅' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
