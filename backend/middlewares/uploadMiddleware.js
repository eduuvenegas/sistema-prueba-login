const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Asegurarnos de que la carpeta exista
const uploadDir = path.join(__dirname, '../uploads/pdfs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configurar dónde y con qué nombre se guarda
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Guardar en backend/uploads/pdfs/
  },
  filename: function (req, file, cb) {
    // Generar un nombre único: Fecha-Aleatorio.pdf
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 3. Validar que sea un PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Formato inválido. Solo se permiten archivos PDF.'), false);
  }
};

// 4. Exportar la configuración con límite de 5MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 Megabytes
});

module.exports = upload;