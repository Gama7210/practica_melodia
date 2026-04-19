import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import nodemailer from 'nodemailer';
import bd from '../config/bd.js';

const crearToken = (u) => jwt.sign(
  { id: u.id, correo: u.correo, rol: u.rol, nombre: u.nombre },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const transporte = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function registrar(req, res) {
  try {
    const { nombre, correo, contrasena } = req.body;
    if (!nombre?.trim() || !correo?.trim() || !contrasena)
      return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
    if (contrasena.length < 6)
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    const [existe] = await bd.execute('SELECT id FROM usuarios WHERE correo = ?', [correo.toLowerCase()]);
    if (existe.length) return res.status(409).json({ mensaje: 'El correo ya está registrado' });
    const hash = await bcrypt.hash(contrasena, 12);
    const [r] = await bd.execute('INSERT INTO usuarios (nombre, correo, contrasena_hash) VALUES (?, ?, ?)', [nombre.trim(), correo.toLowerCase(), hash]);
    const u = { id: r.insertId, correo: correo.toLowerCase(), rol: 'cliente', nombre: nombre.trim() };
    res.status(201).json({ token: crearToken(u), usuario: u, nuevo: true });
  } catch (e) { console.error('registrar:', e); res.status(500).json({ mensaje: 'Error al registrar' }); }
}

export async function iniciarSesion(req, res) {
  try {
    const { correo, contrasena } = req.body;
    const [filas] = await bd.execute('SELECT * FROM usuarios WHERE correo = ?', [correo?.toLowerCase()?.trim()]);
    const u = filas[0];
    if (!u || !u.contrasena_hash) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    if (!await bcrypt.compare(contrasena, u.contrasena_hash)) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    if (!u.esta_activo) return res.status(403).json({ mensaje: 'Cuenta desactivada' });
    await bd.execute('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [u.id]);
    const datos = { id: u.id, correo: u.correo, rol: u.rol, nombre: u.nombre, avatar_url: u.avatar_url };
    res.json({ token: crearToken(datos), usuario: datos });
  } catch (e) { res.status(500).json({ mensaje: 'Error al iniciar sesión' }); }
}

export async function solicitarRecuperacion(req, res) {
  try {
    const correo = req.body.correo?.toLowerCase().trim();
    const [filas] = await bd.execute('SELECT id, nombre FROM usuarios WHERE correo = ?', [correo]);
    if (!filas.length) return res.json({ mensaje: 'Si el correo existe recibirás el enlace' });
    const token = uuid();
    const expira = new Date(Date.now() + 3600000);
    await bd.execute('INSERT INTO recuperacion_contrasena (usuario_id, token, expira_en) VALUES (?, ?, ?)', [filas[0].id, token, expira]);
    await transporte.sendMail({
      from: '"Melodia" <' + process.env.SMTP_USER + '>',
      to: correo,
      subject: 'Recupera tu contraseña en Melodía',
      html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#121212;color:#fff;padding:40px;border-radius:16px"><div style="text-align:center;margin-bottom:32px"><div style="font-size:48px">🎵</div><h1 style="color:#1db954">Melodía</h1></div><h2>Hola ' + filas[0].nombre + ' 👋</h2><p style="color:#b3b3b3;margin:16px 0">Haz clic para restablecer tu contraseña:</p><div style="text-align:center"><a href="' + process.env.CLIENT_URL + '/restablecer/' + token + '" style="background:#1db954;color:#000;padding:14px 32px;border-radius:500px;text-decoration:none;font-weight:700;display:inline-block">Restablecer contraseña</a></div><p style="color:#535353;font-size:12px;text-align:center;margin-top:24px">Expira en 1 hora.</p></div>',
    });
    res.json({ mensaje: 'Si el correo existe recibirás el enlace' });
  } catch (e) { console.error('recuperacion:', e); res.status(500).json({ mensaje: 'Error al enviar correo' }); }
}

export async function restablecerContrasena(req, res) {
  try {
    const { token, nuevaContrasena } = req.body;
    if (!token || !nuevaContrasena || nuevaContrasena.length < 6) return res.status(400).json({ mensaje: 'Datos inválidos' });
    const [filas] = await bd.execute('SELECT * FROM recuperacion_contrasena WHERE token = ? AND usado = FALSE AND expira_en > NOW()', [token]);
    if (!filas.length) return res.status(400).json({ mensaje: 'Token inválido o expirado' });
    const hash = await bcrypt.hash(nuevaContrasena, 12);
    await bd.execute('UPDATE usuarios SET contrasena_hash = ? WHERE id = ?', [hash, filas[0].usuario_id]);
    await bd.execute('UPDATE recuperacion_contrasena SET usado = TRUE WHERE token = ?', [token]);
    res.json({ mensaje: 'Contraseña restablecida' });
  } catch (e) { res.status(500).json({ mensaje: 'Error al restablecer' }); }
}

export async function cambiarContrasena(req, res) {
  try {
    const { contrasenaActual, nuevaContrasena } = req.body;
    if (!contrasenaActual || !nuevaContrasena || nuevaContrasena.length < 6) return res.status(400).json({ mensaje: 'Mínimo 6 caracteres' });
    const [filas] = await bd.execute('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (!filas.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    if (!await bcrypt.compare(contrasenaActual, filas[0].contrasena_hash || '')) return res.status(401).json({ mensaje: 'Contraseña actual incorrecta' });
    const hash = await bcrypt.hash(nuevaContrasena, 12);
    await bd.execute('UPDATE usuarios SET contrasena_hash = ? WHERE id = ?', [hash, req.usuario.id]);
    res.json({ mensaje: '✅ Contraseña actualizada correctamente' });
  } catch (e) { res.status(500).json({ mensaje: 'Error al cambiar contraseña' }); }
}

export async function obtenerPerfil(req, res) {
  try {
    const [filas] = await bd.execute('SELECT id, nombre, correo, avatar_url, rol, creado_en FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (!filas.length) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json({ usuario: filas[0] });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

export async function obtenerUsuarios(req, res) {
  try {
    const [usuarios] = await bd.execute('SELECT id, nombre, correo, rol, esta_activo, creado_en, ultimo_acceso FROM usuarios ORDER BY creado_en DESC');
    res.json({ usuarios });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}
