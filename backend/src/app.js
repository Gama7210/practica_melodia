import express      from 'express';
import cors         from 'cors';
import path         from 'path';
import fs           from 'fs';
import { fileURLToPath } from 'url';
import rateLimit    from 'express-rate-limit';
import multer       from 'multer';
import { v4 as uuid } from 'uuid';
import dotenv       from 'dotenv';
dotenv.config();

['uploads', 'uploads/canciones', 'uploads/imagenes'].forEach(dir => {
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); console.log('📁 Carpeta creada:', dir); }
});

import { verificarToken, soloAdmin } from './middlewares/auth.js';
import { registrar, iniciarSesion, solicitarRecuperacion, restablecerContrasena, cambiarContrasena, obtenerPerfil, obtenerUsuarios } from './controllers/authController.js';
import { buscarDeezer, buscarJamendo, tendenciasDeezer, obtenerCanciones, subirCancion, actualizarCancion, eliminarCancion, registrarReproduccion, obtenerEstadisticas } from './controllers/cancionesController.js';
import { misPlaylists, crearPlaylist, obtenerPlaylist, agregarCancion, quitarCancion, eliminarPlaylist, renombrarPlaylist, obtenerFavoritos, toggleFavorito, esFavorito, obtenerGeneros, guardarGustos, obtenerRecomendaciones, obtenerHistorial, compartirPlaylist, obtenerPlaylistPublica, buscarLetra } from './controllers/playlistsController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

const almacen = multer.diskStorage({
  destination: (req, file, cb) => cb(null, file.fieldname === 'archivo' ? 'uploads/canciones' : 'uploads/imagenes'),
  filename: (req, file, cb) => cb(null, uuid() + path.extname(file.originalname)),
});
const subida = multer({ storage: almacen, limits: { fileSize: 100 * 1024 * 1024 } });

// AUTH
app.post('/api/auth/registrar',          registrar);
app.post('/api/auth/iniciar-sesion',     iniciarSesion);
app.post('/api/auth/recuperar',          solicitarRecuperacion);
app.post('/api/auth/restablecer',        restablecerContrasena);
app.post('/api/auth/cambiar-contrasena', verificarToken, cambiarContrasena);
app.get ('/api/auth/perfil',             verificarToken, obtenerPerfil);
app.get ('/api/auth/usuarios',           verificarToken, soloAdmin, obtenerUsuarios);

// CANCIONES
app.get   ('/api/canciones',                verificarToken, obtenerCanciones);
app.post  ('/api/canciones',                verificarToken, soloAdmin, subida.fields([{ name:'archivo', maxCount:1 }, { name:'imagen', maxCount:1 }]), subirCancion);
app.post  ('/api/canciones/reproduccion',   verificarToken, registrarReproduccion);
app.get   ('/api/canciones/estadisticas',   verificarToken, soloAdmin, obtenerEstadisticas);
app.get   ('/api/canciones/tendencias',     verificarToken, tendenciasDeezer);
app.get   ('/api/canciones/buscar/deezer',  verificarToken, buscarDeezer);
app.get   ('/api/canciones/buscar/jamendo', verificarToken, buscarJamendo);
app.put   ('/api/canciones/:id',            verificarToken, soloAdmin, subida.fields([{ name:'imagen', maxCount:1 }]), actualizarCancion);
app.delete('/api/canciones/:id',            verificarToken, soloAdmin, eliminarCancion);

// LETRA
app.get('/api/letra', verificarToken, buscarLetra);

// PLAYLISTS
app.get   ('/api/playlists',                            verificarToken, misPlaylists);
app.post  ('/api/playlists',                            verificarToken, crearPlaylist);
app.get   ('/api/playlists/:id',                        verificarToken, obtenerPlaylist);
app.put   ('/api/playlists/:id',                        verificarToken, renombrarPlaylist);
app.delete('/api/playlists/:id',                        verificarToken, eliminarPlaylist);
app.post  ('/api/playlists/:id/compartir',              verificarToken, compartirPlaylist);
app.post  ('/api/playlists/:id/canciones',              verificarToken, agregarCancion);
app.delete('/api/playlists/:id/canciones/:cancion_id',  verificarToken, quitarCancion);

// PLAYLIST PÚBLICA (sin autenticación)
app.get('/api/publica/playlist/:id', obtenerPlaylistPublica);

// FAVORITOS
app.get ('/api/favoritos',      verificarToken, obtenerFavoritos);
app.post('/api/favoritos',      verificarToken, toggleFavorito);
app.get ('/api/favoritos/:id',  verificarToken, esFavorito);

// EXTRAS
app.get ('/api/generos',         verificarToken, obtenerGeneros);
app.post('/api/gustos',          verificarToken, guardarGustos);
app.get ('/api/recomendaciones', verificarToken, obtenerRecomendaciones);
app.get ('/api/historial',       verificarToken, obtenerHistorial);

app.get('/api/salud', (_, res) => res.json({ ok: true, version: 'final' }));
app.use((err, req, res, next) => { console.error('Error:', err.message); res.status(500).json({ mensaje: err.message || 'Error interno' }); });

const PUERTO = process.env.PORT || 4000;
app.listen(PUERTO, () => console.log(`🎵 Melodía corriendo en http://localhost:${PUERTO}`));