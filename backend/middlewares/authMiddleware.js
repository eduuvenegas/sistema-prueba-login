const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  // 1. Obtener el token desde las cabeceras (headers)
  const authHeader = req.headers['authorization'];
  
  // El formato estándar es "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. No se proporcionó un token de seguridad.'
    });
  }

  try {
    // 2. Verificar si el token es válido y no ha expirado
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'firma_secreta_ugel_2026'
    );

    // 3. Si es válido, guardamos los datos del usuario en la petición
    // para que las siguientes rutas sepan quién está haciendo la acción
    req.usuario = decoded;
    
    // 4. Dejarlo pasar
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'El token de sesión es inválido o ha expirado. Por favor, inicie sesión nuevamente.'
    });
  }
};

module.exports = { verificarToken };