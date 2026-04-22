const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * LOGIN
 * Valida contra la tabla usuarios de MySQL usando bcrypt
 * POST /api/auth/login
 * Body: { correo: "director@colegio.edu.pe", password: "contraseña" }
 */
const login = async (req, res) => {
  const { correo, password } = req.body;

  console.log('📝 Intento de login con correo:', correo);

  // Validar que se enviaron los campos
  if (!correo || !password) {
    console.warn('⚠️ Faltaron campos: correo o password');
    return res.status(400).json({ 
      success: false, 
      message: 'Correo y contraseña son requeridos.' 
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Conexión a BD establecida');

    // Buscar usuario en la tabla usuarios por email
    console.log('🔍 Buscando usuario con email:', correo.trim());
    const [usuarios] = await connection.execute(
      'SELECT id, email, password_hash, rol, director_id FROM usuarios WHERE email = ?',
      [correo.trim()]
    );

    console.log('📊 Resultados de búsqueda:', usuarios.length, 'usuario(s) encontrado(s)');

    if (usuarios.length === 0) {
      console.warn('❌ Usuario no encontrado:', correo.trim());
      return res.status(401).json({ 
        success: false, 
        message: 'Correo o contraseña incorrectos.' 
      });
    }

    const usuario = usuarios[0];
    console.log('👤 Usuario encontrado:', {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      director_id: usuario.director_id
    });

    // Verificar la contraseña con bcrypt
    console.log('🔐 Verificando contraseña...');
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    console.log('🔐 Contraseña válida:', passwordValida);

    if (!passwordValida) {
      console.warn('❌ Contraseña incorrecta para:', correo.trim());
      return res.status(401).json({ 
        success: false, 
        message: 'Correo o contraseña incorrectos.' 
      });
    }

    // Si es director, obtener sus datos
    let directorData = null;
    if (usuario.director_id) {
      console.log('🎓 Buscando datos del director con id:', usuario.director_id);
      const [directores] = await connection.execute(
        'SELECT d.id, d.dni, d.nombres, d.apellido_paterno, d.apellido_materno, d.celular, d.email, d.institucion_id, ie.nombre_ie FROM directores d JOIN instituciones_educativas ie ON d.institucion_id = ie.id WHERE d.id = ?',
        [usuario.director_id]
      );

      if (directores.length > 0) {
        directorData = directores[0];
        console.log('🎓 Director encontrado:', directorData.nombres, '-', directorData.nombre_ie);
      } else {
        console.warn('⚠️ Director con id', usuario.director_id, 'no encontrado en la tabla directores');
      }
    }

    connection.release();

    // Generar el Token JWT ahora que ya tenemos todos los datos
    const token = jwt.sign(
      { id: usuario.id, correo: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET || 'firma_secreta_ugel_2026', // Idealmente pon esto en tu .env
      { expiresIn: '8h' }
    );

    // Login exitoso — devolver datos seguros (sin contraseña)
    console.log('✅ Login exitoso para:', correo.trim());
    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token: token, // ¡Enviamos el token al frontend!
      user: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        director: directorData ? {
          id: directorData.id,
          dni: directorData.dni,
          nombres: directorData.nombres,
          apellido_paterno: directorData.apellido_paterno,
          apellido_materno: directorData.apellido_materno,
          celular: directorData.celular,
          email: directorData.email,
          school: directorData.nombre_ie,
          institucion_id: directorData.institucion_id
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error.message);
    console.error('Error completo:', error);
    if (connection) connection.release();
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * CAMBIO DE CONTRASEÑA
 * Permite cambiar la contraseña del usuario
 * POST /api/auth/change-password
 * Body: { email: "director@colegio.edu.pe", currentPassword: "contraseña_actual", newPassword: "nueva_clave" }
 */
const changePassword = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email, contraseña actual y nueva contraseña son requeridos.' 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'La nueva contraseña debe tener al menos 6 caracteres.' 
    });
  }

  const connection = await pool.getConnection();

  try {
    // Buscar usuario por email
    const [usuarios] = await connection.execute(
      'SELECT id, password_hash FROM usuarios WHERE email = ?',
      [email.trim()]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const usuario = usuarios[0];

    // Verificar que la contraseña actual es correcta
    const passwordValida = await bcrypt.compare(currentPassword, usuario.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta.'
      });
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar password_hash en la tabla usuarios
    const [result] = await connection.execute(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [hashedPassword, usuario.id]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar la contraseña.'
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Contraseña actualizada correctamente.' 
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    connection.release();
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor.' 
    });
  }
};

module.exports = { login, changePassword };
