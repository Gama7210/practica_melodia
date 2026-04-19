import axios from 'axios';
import path  from 'path';
import fs    from 'fs/promises';
import bd    from '../config/bd.js';

function extraerYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const r of patterns) { const m = url.match(r); if (m) return m[1]; }
  return null;
}

export async function buscarDeezer(req, res) {
  try {
    const { q = '', limite = 25 } = req.query;
    if (!q.trim()) return res.json({ canciones: [] });
    const { data } = await axios.get('https://api.deezer.com/search?q=' + encodeURIComponent(q) + '&limit=' + limite);
    res.json({ canciones: (data.data || []).map(t => ({
      id: 'deezer_' + t.id, titulo: t.title,
      artista: t.artist?.name, album: t.album?.title,
      imagen_url: t.album?.cover_medium || t.album?.cover,
      preview_url: t.preview, duracion: t.duration,
      fuente: 'deezer', deezer_id: String(t.id),
    }))});
  } catch (e) { console.error('buscarDeezer:', e.message); res.status(500).json({ mensaje: 'Error Deezer' }); }
}

export async function tendenciasDeezer(req, res) {
  try {
    const { data } = await axios.get('https://api.deezer.com/chart/0/tracks?limit=30');
    res.json({ canciones: (data.data || []).map(t => ({
      id: 'deezer_' + t.id, titulo: t.title,
      artista: t.artist?.name, album: t.album?.title,
      imagen_url: t.album?.cover_medium,
      preview_url: t.preview, duracion: t.duration,
      fuente: 'deezer', deezer_id: String(t.id),
    }))});
  } catch (e) { console.error('tendenciasDeezer:', e.message); res.status(500).json({ mensaje: 'Error tendencias' }); }
}

export async function buscarJamendo(req, res) {
  try {
    const { q = '', limite = 25 } = req.query;
    const params = new URLSearchParams({ client_id: process.env.JAMENDO_CLIENT_ID || '', format: 'json', limit: limite, search: q, audioformat: 'mp32', include: 'musicinfo' });
    const { data } = await axios.get('https://api.jamendo.com/v3.0/tracks/?' + params);
    res.json({ canciones: (data.results || []).map(t => ({
      id: 'jamendo_' + t.id, titulo: t.name, artista: t.artist_name,
      imagen_url: t.album_image, preview_url: t.audio,
      duracion: t.duration, fuente: 'jamendo', jamendo_id: String(t.id),
    }))});
  } catch (e) { console.error('buscarJamendo:', e.message); res.status(500).json({ mensaje: 'Error Jamendo' }); }
}

export async function obtenerCanciones(req, res) {
  try {
    const pagina = Math.max(parseInt(req.query.pagina) || 1, 1);
    const limite = Math.min(parseInt(req.query.limite) || 30, 100);
    const offset = (pagina - 1) * limite;
    const { genero, buscar } = req.query;
    let where = 'WHERE c.esta_activa = TRUE';
    const params = [];
    if (genero) { where += ' AND c.genero_id = ?'; params.push(genero); }
    if (buscar) { where += ' AND (c.titulo LIKE ? OR a.nombre LIKE ?)'; params.push('%' + buscar + '%', '%' + buscar + '%'); }
    const sql = 'SELECT c.*, a.nombre AS nombre_artista, g.nombre AS nombre_genero, g.color AS color_genero, g.icono AS icono_genero FROM canciones c LEFT JOIN artistas a ON a.id = c.artista_id LEFT JOIN generos g ON g.id = c.genero_id ' + where + ' ORDER BY c.reproducciones DESC, c.creado_en DESC LIMIT ' + limite + ' OFFSET ' + offset;
    const [canciones] = await bd.execute(sql, params);
    const [[{ total }]] = await bd.execute('SELECT COUNT(*) AS total FROM canciones c LEFT JOIN artistas a ON a.id = c.artista_id ' + where, params);
    res.json({ canciones, total });
  } catch (e) { console.error('obtenerCanciones:', e.message); res.status(500).json({ mensaje: 'Error al obtener canciones' }); }
}

export async function subirCancion(req, res) {
  try {
    const { titulo, artista, genero_id, album, fecha_lanzamiento, duracion_segundos, imagen_url, youtube_url } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ mensaje: 'Título requerido' });

    let artista_id = null;
    if (artista?.trim()) {
      const [ex] = await bd.execute('SELECT id FROM artistas WHERE nombre = ?', [artista.trim()]);
      if (ex.length) { artista_id = ex[0].id; }
      else { const [r] = await bd.execute('INSERT INTO artistas (nombre) VALUES (?)', [artista.trim()]); artista_id = r.insertId; }
    }

    let album_id = null;
    if (album?.trim()) {
      const [ex] = await bd.execute('SELECT id FROM albumes WHERE titulo = ?', [album.trim()]);
      if (ex.length) { album_id = ex[0].id; }
      else { const [r] = await bd.execute('INSERT INTO albumes (titulo, artista_id, genero_id) VALUES (?, ?, ?)', [album.trim(), artista_id, genero_id || null]); album_id = r.insertId; }
    }

    let fuente = 'local', archivo_url_final = null, yt_id = null;

    if (req.files?.archivo?.[0]) {
      archivo_url_final = '/uploads/canciones/' + req.files.archivo[0].filename;
    }

    if (youtube_url?.trim()) {
      yt_id = extraerYoutubeId(youtube_url.trim());
      if (!yt_id) return res.status(400).json({ mensaje: 'URL de YouTube inválida. Usa: https://youtube.com/watch?v=XXXXXXXXXXX' });
      archivo_url_final = 'https://www.youtube.com/watch?v=' + yt_id;
      fuente = 'youtube';
    }

    if (!archivo_url_final) return res.status(400).json({ mensaje: 'Sube un MP3 o pega una URL de YouTube' });

    let img = imagen_url?.trim() || null;
    if (!img && req.files?.imagen?.[0]) img = '/uploads/imagenes/' + req.files.imagen[0].filename;
    if (!img && yt_id) img = 'https://img.youtube.com/vi/' + yt_id + '/hqdefault.jpg';

    const [r] = await bd.execute(
      'INSERT INTO canciones (titulo, artista_id, album_id, genero_id, duracion_segundos, imagen_url, archivo_url, fuente, subida_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [titulo.trim(), artista_id, album_id, genero_id || null, parseInt(duracion_segundos) || 0, img, archivo_url_final, fuente, req.usuario.id]
    );
    res.status(201).json({ mensaje: 'Canción subida correctamente', id: r.insertId });
  } catch (e) { console.error('subirCancion:', e); res.status(500).json({ mensaje: 'Error al subir', detalle: e.message }); }
}

export async function actualizarCancion(req, res) {
  try {
    const { id } = req.params;
    const { titulo, genero_id, duracion_segundos } = req.body;
    const imagen_url = req.files?.imagen?.[0] ? '/uploads/imagenes/' + req.files.imagen[0].filename : req.body.imagen_url_actual;
    await bd.execute('UPDATE canciones SET titulo = ?, genero_id = ?, duracion_segundos = ?, imagen_url = ? WHERE id = ?', [titulo, genero_id || null, duracion_segundos || 0, imagen_url, id]);
    res.json({ mensaje: 'Actualizada' });
  } catch (e) { res.status(500).json({ mensaje: 'Error al actualizar' }); }
}

export async function eliminarCancion(req, res) {
  try {
    const { id } = req.params;
    const [f] = await bd.execute('SELECT archivo_url, imagen_url FROM canciones WHERE id = ?', [id]);
    if (!f.length) return res.status(404).json({ mensaje: 'No encontrada' });
    for (const campo of ['archivo_url', 'imagen_url']) {
      if (f[0][campo]?.startsWith('/uploads/')) await fs.unlink(path.join(process.cwd(), f[0][campo])).catch(() => {});
    }
    await bd.execute('DELETE FROM canciones WHERE id = ?', [id]);
    res.json({ mensaje: 'Eliminada' });
  } catch (e) { res.status(500).json({ mensaje: 'Error al eliminar' }); }
}

export async function registrarReproduccion(req, res) {
  try {
    const { cancion_id, duracion_escuchada = 0 } = req.body;
    if (!cancion_id) return res.json({ ok: false });
    await bd.execute('INSERT INTO historial_reproducciones (usuario_id, cancion_id, duracion_escuchada) VALUES (?, ?, ?)', [req.usuario.id, cancion_id, duracion_escuchada]);
    await bd.execute('UPDATE canciones SET reproducciones = reproducciones + 1 WHERE id = ?', [cancion_id]);
    res.json({ ok: true });
  } catch (e) { res.json({ ok: false }); }
}

export async function obtenerEstadisticas(req, res) {
  try {
    const [[c]]  = await bd.execute('SELECT COUNT(*) AS t FROM canciones WHERE esta_activa = TRUE');
    const [[u]]  = await bd.execute('SELECT COUNT(*) AS t FROM usuarios WHERE rol = "cliente"');
    const [[p]]  = await bd.execute('SELECT COUNT(*) AS t FROM playlists');
    const [[r]]  = await bd.execute('SELECT COUNT(*) AS t FROM historial_reproducciones');
    const [top]  = await bd.execute('SELECT c.titulo, a.nombre AS artista, c.reproducciones, c.imagen_url, c.fuente FROM canciones c LEFT JOIN artistas a ON a.id = c.artista_id ORDER BY c.reproducciones DESC LIMIT 10');
    const [recientes] = await bd.execute('SELECT c.titulo, a.nombre AS artista, c.creado_en, c.imagen_url FROM canciones c LEFT JOIN artistas a ON a.id = c.artista_id ORDER BY c.creado_en DESC LIMIT 5');
    res.json({ canciones: c.t, usuarios: u.t, playlists: p.t, reproducciones: r.t, topCanciones: top, recientes });
  } catch (e) { res.status(500).json({ mensaje: 'Error estadísticas' }); }
}
