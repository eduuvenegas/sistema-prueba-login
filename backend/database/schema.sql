-- ============================================
-- UGEL: Schema SQL Normalizado para MySQL
-- Sistema de Gestión Financiera Educativa
-- ============================================

-- 1. Crear la base de datos (ejecutar solo una vez)
CREATE DATABASE IF NOT EXISTS ugel_db;
USE ugel_db;

-- ============================================
-- TABLA 1: instituciones_educativas
-- Descripción: Almacena datos de colegios/institutos
-- ============================================
CREATE TABLE IF NOT EXISTS instituciones_educativas (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  codigo_modular          VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código MINEDU único',
  nombre_ie               VARCHAR(200) NOT NULL COMMENT 'Nombre completo de la institución',
  nivel_educativo         ENUM('inicial', 'primaria', 'secundaria', 'técnico', 'superior') NOT NULL,
  modalidad               ENUM('regular', 'especial', 'alternativa') NOT NULL,
  provincia               VARCHAR(100) NOT NULL,
  distrito                VARCHAR(100) NOT NULL,
  creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_codigo_modular (codigo_modular),
  INDEX idx_provincia_distrito (provincia, distrito)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabla de instituciones educativas';

-- ============================================
-- TABLA 2: directores
-- Descripción: Almacena datos personales de directores
-- Relación: Un director pertenece a UNA institución
-- ============================================
CREATE TABLE IF NOT EXISTS directores (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  dni                     VARCHAR(8) UNIQUE NOT NULL COMMENT 'DNI peruano (8 dígitos)',
  nombres                 VARCHAR(100) NOT NULL,
  apellido_paterno        VARCHAR(100) NOT NULL,
  apellido_materno        VARCHAR(100),
  celular                 VARCHAR(20),
  email                   VARCHAR(150) UNIQUE NOT NULL,
  institucion_id          INT NOT NULL COMMENT 'Institución donde es director',
  creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_directores_institucion 
    FOREIGN KEY (institucion_id) 
    REFERENCES instituciones_educativas(id) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE,
  
  INDEX idx_dni (dni),
  INDEX idx_email (email),
  INDEX idx_institucion (institucion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabla de directores de instituciones educativas';

-- ============================================
-- TABLA 3: usuarios
-- Descripción: Tabla de login/autenticación para el sistema
-- Relación: Un usuario puede ser director (opcionalmente) o especialista
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  email                   VARCHAR(150) UNIQUE NOT NULL COMMENT 'Email para login',
  password_hash           VARCHAR(255) NOT NULL COMMENT 'Contraseña hasheada con bcrypt',
  rol                     ENUM('director', 'especialista', 'admin') NOT NULL DEFAULT 'director',
  director_id             INT UNIQUE COMMENT 'FK opcional: si es director, referencia a tabla directores',
  estado                  ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
  ultimo_login            TIMESTAMP NULL COMMENT 'Últimas fecha/hora de login',
  creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_usuarios_director 
    FOREIGN KEY (director_id) 
    REFERENCES directores(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE,
  
  INDEX idx_email (email),
  INDEX idx_rol (rol),
  INDEX idx_estado (estado),
  INDEX idx_director_id (director_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabla de usuarios para autenticación en el sistema';

-- ============================================
-- TABLA 4: login_logs
-- Descripción: Auditoría de intentos de login
-- Propósito: Registrar accesos exitosos y fallidos
-- ============================================
CREATE TABLE IF NOT EXISTS login_logs (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id              INT COMMENT 'FK a tabla usuarios (si login fue exitoso)',
  email                   VARCHAR(150) NOT NULL COMMENT 'Email intentado',
  fecha_hora              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exitoso                 BOOLEAN DEFAULT FALSE,
  razon_fallo             VARCHAR(255) COMMENT 'Motivo del fallo (contraseña incorrecta, usuario no existe, etc)',
  ip_address              VARCHAR(45) COMMENT 'Dirección IP del cliente',
  user_agent              VARCHAR(500) COMMENT 'Navegador/cliente usado',
  
  CONSTRAINT fk_login_logs_usuario 
    FOREIGN KEY (usuario_id) 
    REFERENCES usuarios(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE,
  
  INDEX idx_fecha_hora (fecha_hora),
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_email (email),
  INDEX idx_exitoso (exitoso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Auditoría de logins - histórico de accesos';

-- ============================================
-- TABLA 5: ingresos
-- DescripciÃ³n: Movimientos de ingresos por director
-- DiseÃ±o: Tabla normalizada, sin columnas por mes ni totales almacenados
-- ============================================
CREATE TABLE IF NOT EXISTS ingresos (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  director_id             INT NOT NULL COMMENT 'FK al director responsable del registro',
  fecha                   DATE NOT NULL,
  tipo_comprobante        VARCHAR(100) NOT NULL,
  numero_comprobante      VARCHAR(100) NOT NULL,
  concepto                VARCHAR(255) NOT NULL,
  monto                   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ingresos_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  INDEX idx_ingresos_director_id (director_id),
  INDEX idx_ingresos_fecha (fecha),
  INDEX idx_ingresos_director_fecha (director_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ingresos registrados por directores';

-- ============================================
-- TABLA 6: egresos
-- DescripciÃ³n: Movimientos de egresos por director
-- DiseÃ±o: Tabla normalizada, sin columnas por mes ni totales almacenados
-- ============================================
CREATE TABLE IF NOT EXISTS egresos (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  director_id             INT NOT NULL COMMENT 'FK al director responsable del registro',
  fecha                   DATE NOT NULL,
  tipo_comprobante        VARCHAR(100) NOT NULL,
  numero_comprobante      VARCHAR(100) NOT NULL,
  concepto                VARCHAR(255) NOT NULL,
  monto                   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_egresos_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  INDEX idx_egresos_director_id (director_id),
  INDEX idx_egresos_fecha (fecha),
  INDEX idx_egresos_director_fecha (director_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Egresos registrados por directores';

-- ============================================
-- TABLA 7: cierres_trimestrales
-- Descripcion: Bloquea cambios por director, anio y trimestre
-- ============================================
CREATE TABLE IF NOT EXISTS cierres_trimestrales (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  director_id             INT NOT NULL,
  anio                    INT NOT NULL,
  trimestre               TINYINT NOT NULL,
  cerrado_en              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_cierres_trimestrales_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT chk_cierres_trimestrales_trimestre
    CHECK (trimestre BETWEEN 1 AND 4),

  UNIQUE KEY uk_cierre_trimestre (director_id, anio, trimestre),
  INDEX idx_cierres_trimestrales_director (director_id, anio, trimestre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Trimestres cerrados por director';

-- ============================================
-- TABLA 8: sustentos_pdf
-- Descripción: Almacena los metadatos y rutas de los archivos PDF subidos
-- ============================================
CREATE TABLE IF NOT EXISTS sustentos_pdf (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  director_id             INT NOT NULL COMMENT 'FK al director que subió el archivo',
  nombre_original         VARCHAR(255) NOT NULL COMMENT 'Ej: Reporte_Marzo.pdf',
  ruta_archivo            VARCHAR(500) NOT NULL COMMENT 'Ruta física en el servidor',
  tamanio_bytes           INT COMMENT 'Tamaño del archivo en bytes',
  anio                    INT NOT NULL,
  trimestre               TINYINT,
  subido_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_sustentos_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  INDEX idx_sustentos_director (director_id),
  INDEX idx_sustentos_anio_trimestre (anio, trimestre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Metadatos de los PDFs de sustento subidos por directores';

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Insertar instituciones educativas
INSERT INTO instituciones_educativas (codigo_modular, nombre_ie, nivel_educativo, modalidad, provincia, distrito) VALUES
('0359323', 'FE Y ALEGRIA 42', 'primaria', 'especial', 'SANTA', 'CHIMBOTE'),
('0495234', 'FE Y ALEGRIA 14', 'secundaria', 'regular', 'SANTA', 'CHIMBOTE'),
('0577098', 'FE Y ALEGRIA 16', 'secundaria', 'regular', 'SANTA', 'CHIMBOTE'),
('0686600', '88227 PEDRO PABLO ATUSPARIA', 'secundaria', 'regular', 'SANTA', 'NUEVO CHIMBOTE'),
('0359356', 'INMACULADA DE LA MERCED', 'secundaria', 'regular', 'SANTA', 'CHIMBOTE'),
('0570226', '01 CHIMBOTE', 'primaria', 'especial', 'SANTA', 'CHIMBOTE');

-- Insertar directores
INSERT INTO directores (dni, nombres, apellido_paterno, apellido_materno, celular, email, institucion_id) VALUES
('32970728', 'SARAI REBECA', 'BERNABE', 'MAGUIÑA', '949833586', 'sariber19@hotmail.com', 1),
('87654321', 'EDEFIR CUSTODIO', 'VIERA', 'LOPEZ', '938107374', 'custodioviera1967@hotmail.com', 2),
('00000000', 'HAYDEE', 'SANCHEZ', 'PORTAL de TAPIA', '966854853', '', 3),
('32908230', 'ROSALBINA LIDIA', 'RODRIGUEZ', 'LUNA', '943810871', 'yedadero@hotmail.com', 4),
('22222222', 'CAROLINA VIRGINIA', 'ROSPIGLIOSI', 'LEYVA', '944661493', 'carolinarospigliosi@hotmail.com', 5),
('10126811', 'DARIA REINA', 'SANCHEZ', 'CHAVEZ', '949377272', 'daryexpaxmo@hotmail.com', 6);

-- Insertar usuarios (para login)
-- Contraseña por defecto: 123456 (hash bcrypt)
-- Los directores deben cambiar su contraseña en el primer login
INSERT INTO usuarios (email, password_hash, rol, director_id, estado) VALUES
('sariber19@hotmail.com', '$2a$10$slYQmyNdGzin7olVntoFreyUM4czQcUms/LewY5YsuqCqtiqWXXi', 'director', 1, 'activo'),
('custodioviera1967@hotmail.com', '$2a$10$slYQmyNdGzin7olVntoFreyUM4czQcUms/LewY5YsuqCqtiqWXXi', 'director', 2, 'activo'),
('', '$2a$10$slYQmyNdGzin7olVntoFreyUM4czQcUms/LewY5YsuqCqtiqWXXi', 'director', 3, 'activo'),
('yedadero@hotmail.com', '$2a$10$slYQmyNdGzin7olVntoFreyUM4czQcUms/LewY5YsuqCqtiqWXXi', 'director', 4, 'activo'),
('carolinarospigliosi@hotmail.com', '$2a$10$slYQmyNdGzin7olVntoFreyUM4czQcUms/LewY5YsuqCqtiqWXXi', 'director', 5, 'activo'),
('daryexpaxmo@hotmail.com', '$2a$10$slYQmyNdGzin7olVntoFreyUM4czQcUms/LewY5YsuqCqtiqWXXi', 'director', 6, 'activo'),
('especialista@ugel.edu.pe', '$2a$10$slYQmyNdGzin7olVntoFreyUM4czQcUms/LewY5YsuqCqtiqWXXi', 'especialista', NULL, 'activo');
