
CREATE DATABASE melodia_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE melodia_app;

-- ── Usuarios ─────────────────────────────────────────────────────
CREATE TABLE usuarios (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(100) NOT NULL,
  correo           VARCHAR(150) NOT NULL UNIQUE,
  contrasena_hash  VARCHAR(255) DEFAULT NULL,
  avatar_url       VARCHAR(500) DEFAULT NULL,
  rol              ENUM('admin','cliente') DEFAULT 'cliente',
  esta_activo      BOOLEAN DEFAULT TRUE,
  ultimo_acceso    DATETIME DEFAULT NULL,
  creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_correo (correo)
);

-- ── Géneros musicales ─────────────────────────────────────────────
CREATE TABLE generos (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(80) NOT NULL UNIQUE,
  icono     VARCHAR(10) DEFAULT '🎵',
  color     VARCHAR(7)  DEFAULT '#7c3aed',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO generos (nombre, icono, color) VALUES
('Banda',                '🎺', '#c0392b'),
('Corridos',             '🤠', '#8e44ad'),
('Regional Mexicano',    '🇲🇽', '#27ae60'),
('Pop',                  '🎤', '#2980b9'),
('Reggaeton',            '🔥', '#e67e22'),
('Hip-Hop/Rap',          '🎧', '#f39c12'),
('Electrónica',          '🎛️', '#16a085'),
('Rock',                 '🎸', '#c0392b'),
('Cumbia',               '💃', '#d35400'),
('Balada/Pop Romántico', '❤️', '#8e44ad');

-- ── Artistas ──────────────────────────────────────────────────────
CREATE TABLE artistas (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(150) NOT NULL UNIQUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Álbumes ───────────────────────────────────────────────────────
CREATE TABLE albumes (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(200) NOT NULL,
  artista_id        INT UNSIGNED DEFAULT NULL,
  genero_id         INT UNSIGNED DEFAULT NULL,
  fecha_lanzamiento DATE DEFAULT NULL,
  creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE SET NULL,
  FOREIGN KEY (genero_id)  REFERENCES generos(id)  ON DELETE SET NULL
);

-- ── Canciones ─────────────────────────────────────────────────────
-- fuente: 'local' = MP3 subido, 'youtube' = URL YouTube, 'deezer' = API Deezer, 'jamendo' = API Jamendo
CREATE TABLE canciones (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(200) NOT NULL,
  artista_id        INT UNSIGNED DEFAULT NULL,
  album_id          INT UNSIGNED DEFAULT NULL,
  genero_id         INT UNSIGNED DEFAULT NULL,
  duracion_segundos INT UNSIGNED DEFAULT 0,
  imagen_url        VARCHAR(800) DEFAULT NULL,
  fuente            ENUM('local','youtube','deezer','jamendo') DEFAULT 'local',
  archivo_url       VARCHAR(800) DEFAULT NULL,
  preview_url       VARCHAR(800) DEFAULT NULL,
  deezer_id         VARCHAR(50)  DEFAULT NULL,
  jamendo_id        VARCHAR(50)  DEFAULT NULL,
  reproducciones    INT UNSIGNED DEFAULT 0,
  esta_activa       BOOLEAN DEFAULT TRUE,
  subida_por        INT UNSIGNED DEFAULT NULL,
  creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artista_id) REFERENCES artistas(id)  ON DELETE SET NULL,
  FOREIGN KEY (album_id)   REFERENCES albumes(id)   ON DELETE SET NULL,
  FOREIGN KEY (genero_id)  REFERENCES generos(id)   ON DELETE SET NULL,
  FOREIGN KEY (subida_por) REFERENCES usuarios(id)  ON DELETE SET NULL,
  INDEX idx_fuente         (fuente),
  INDEX idx_genero         (genero_id),
  INDEX idx_reproducciones (reproducciones)
);

-- ── Playlists ─────────────────────────────────────────────────────
CREATE TABLE playlists (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(200) NOT NULL,
  descripcion    TEXT DEFAULT NULL,
  usuario_id     INT UNSIGNED NOT NULL,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id)
);

-- ── Canciones en playlist ─────────────────────────────────────────
CREATE TABLE playlist_canciones (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  playlist_id INT UNSIGNED NOT NULL,
  cancion_id  INT UNSIGNED NOT NULL,
  posicion    INT UNSIGNED DEFAULT 0,
  agregado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pl_cancion (playlist_id, cancion_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id)  ON DELETE CASCADE,
  FOREIGN KEY (cancion_id)  REFERENCES canciones(id)  ON DELETE CASCADE
);

-- ── Favoritos ─────────────────────────────────────────────────────
CREATE TABLE favoritos (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  cancion_id INT UNSIGNED NOT NULL,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fav (usuario_id, cancion_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)  ON DELETE CASCADE,
  FOREIGN KEY (cancion_id) REFERENCES canciones(id) ON DELETE CASCADE
);

-- ── Gustos del usuario (onboarding) ──────────────────────────────
CREATE TABLE gustos_usuario (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  genero_id  INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_gusto (usuario_id, genero_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (genero_id)  REFERENCES generos(id)  ON DELETE CASCADE
);

-- ── Historial de reproducciones ───────────────────────────────────
CREATE TABLE historial_reproducciones (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id         INT UNSIGNED NOT NULL,
  cancion_id         INT UNSIGNED NOT NULL,
  reproducido_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duracion_escuchada INT UNSIGNED DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)  ON DELETE CASCADE,
  FOREIGN KEY (cancion_id) REFERENCES canciones(id) ON DELETE CASCADE,
  INDEX idx_usuario_hist (usuario_id),
  INDEX idx_fecha        (reproducido_en)
);

-- ── Recuperación de contraseña ────────────────────────────────────
CREATE TABLE recuperacion_contrasena (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expira_en  DATETIME NOT NULL,
  usado      BOOLEAN DEFAULT FALSE,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_token (token)
);

-- ── Admin por defecto ─────────────────────────────────────────────
-- Contraseña: password
INSERT INTO usuarios (nombre, correo, contrasena_hash, rol) VALUES
('Administrador', 'admin@melodia.com',
 '$2b$12$Q0tvi2VDQ5HzAbJXq.nwMOnkENS69PBhODS2w6qUxxXgjbXokbh5C',
 'admin');

-- ── Verificar ─────────────────────────────────────────────────────
SELECT table_name AS 'Tabla' FROM information_schema.tables
WHERE table_schema = 'melodia_app' ORDER BY table_name;


-- Verificar si la columna ya existe
SELECT COLUMN_NAME FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'melodia_app' AND TABLE_NAME = 'playlists' AND COLUMN_NAME = 'es_publica';
 USE melodia_app;
ALTER TABLE playlists ADD COLUMN es_publica BOOLEAN DEFAULT FALSE;
-- Agregar la columna si no existe

 
-- Verificar estructura final
DESCRIBE playlists;