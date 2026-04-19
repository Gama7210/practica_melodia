import bd from '../config/bd.js';

export async function misPlaylists(req, res) {
  try {
    const [pl] = await bd.execute(`
      SELECT p.*, COUNT(pc.cancion_id) AS total_canciones,
             (SELECT c2.imagen_url FROM playlist_canciones pc2
              JOIN canciones c2 ON c2.id = pc2.cancion_id
              WHERE pc2.playlist_id = p.id ORDER BY pc2.agregado_en DESC LIMIT 1) AS imagen_portada
      FROM playlists p
      LEFT JOIN playlist_canciones pc ON pc.playlist_id = p.id
      WHERE p.usuario_id = ? GROUP BY p.id ORDER BY p.actualizado_en DESC
    `, [req.usuario.id]);
    res.json({ playlists: pl });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

export async function crearPlaylist(req, res) {
  try {
    const { nombre, descripcion, es_publica = false } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ mensaje: 'Nombre requerido' });
    let r;
    try {
      [r] = await bd.execute(
        'INSERT INTO playlists (nombre, descripcion, usuario_id, es_publica) VALUES (?, ?, ?, ?)',
        [nombre.trim(), descripcion || null, req.usuario.id, es_publica]
      );
    } catch {
      [r] = await bd.execute(
        'INSERT INTO playlists (nombre, descripcion, usuario_id) VALUES (?, ?, ?)',
        [nombre.trim(), descripcion || null, req.usuario.id]
      );
    }
    res.status(201).json({ id: r.insertId, nombre: nombre.trim(), total_canciones: 0 });
  } catch (e) {
    console.error('crearPlaylist:', e.message);
    res.status(500).json({ mensaje: 'Error al crear: ' + e.message });
  }
}

export async function obtenerPlaylist(req, res) {
  try {
    const { id } = req.params;
    const [pl] = await bd.execute(
      'SELECT * FROM playlists WHERE id = ? AND (usuario_id = ? OR es_publica = TRUE)',
      [id, req.usuario.id]
    );
    if (!pl.length) return res.status(404).json({ mensaje: 'No encontrada' });
    const [canciones] = await bd.execute(`
      SELECT c.*, a.nombre AS nombre_artista, g.nombre AS nombre_genero, g.color AS color_genero,
             pc.posicion, pc.agregado_en
      FROM playlist_canciones pc
      JOIN canciones c ON c.id = pc.cancion_id
      LEFT JOIN artistas a ON a.id = c.artista_id
      LEFT JOIN generos g ON g.id = c.genero_id
      WHERE pc.playlist_id = ? ORDER BY pc.posicion ASC, pc.agregado_en ASC
    `, [id]);
    res.json({ playlist: pl[0], canciones });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

export async function agregarCancion(req, res) {
  try {
    const { id } = req.params;
    const { cancion_id, fuente_externa, titulo, artista, imagen_url, preview_url, duracion } = req.body;

    const [pl] = await bd.execute('SELECT id FROM playlists WHERE id = ? AND usuario_id = ?', [id, req.usuario.id]);
    if (!pl.length) return res.status(403).json({ mensaje: 'Sin permiso' });

    let cancionIdFinal = cancion_id;

    // Si es canción externa (Deezer/Jamendo), guardarla primero
    if (fuente_externa && !cancion_id) {
      let artista_id = null;
      if (artista?.trim()) {
        const [ex] = await bd.execute('SELECT id FROM artistas WHERE nombre = ?', [artista.trim()]);
        if (ex.length) { artista_id = ex[0].id; }
        else { const [r] = await bd.execute('INSERT INTO artistas (nombre) VALUES (?)', [artista.trim()]); artista_id = r.insertId; }
      }
      const idExterno = fuente_externa === 'deezer' ? req.body.deezer_id : req.body.jamendo_id;
      const campoId   = fuente_externa === 'deezer' ? 'deezer_id' : 'jamendo_id';
      const [exCancion] = await bd.execute(`SELECT id FROM canciones WHERE ${campoId} = ?`, [idExterno]);
      if (exCancion.length) {
        cancionIdFinal = exCancion[0].id;
      } else {
        const [r] = await bd.execute(
          'INSERT INTO canciones (titulo, artista_id, imagen_url, preview_url, duracion_segundos, fuente, deezer_id, jamendo_id, esta_activa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)',
          [titulo, artista_id, imagen_url || null, preview_url || null, parseInt(duracion) || 0,
           fuente_externa, fuente_externa === 'deezer' ? idExterno : null, fuente_externa === 'jamendo' ? idExterno : null]
        );
        cancionIdFinal = r.insertId;
      }
    }

    const [[pos]] = await bd.execute(
      'SELECT COALESCE(MAX(posicion), 0) + 1 AS siguiente FROM playlist_canciones WHERE playlist_id = ?', [id]
    );
    await bd.execute(
      'INSERT IGNORE INTO playlist_canciones (playlist_id, cancion_id, posicion) VALUES (?, ?, ?)',
      [id, cancionIdFinal, pos.siguiente]
    );
    await bd.execute('UPDATE playlists SET actualizado_en = NOW() WHERE id = ?', [id]);
    res.json({ mensaje: 'Canción agregada' });
  } catch (e) {
    console.error('agregarCancion:', e);
    res.status(500).json({ mensaje: 'Error al agregar' });
  }
}

export async function quitarCancion(req, res) {
  try {
    const { id, cancion_id } = req.params;
    const [pl] = await bd.execute('SELECT id FROM playlists WHERE id = ? AND usuario_id = ?', [id, req.usuario.id]);
    if (!pl.length) return res.status(403).json({ mensaje: 'Sin permiso' });
    await bd.execute('DELETE FROM playlist_canciones WHERE playlist_id = ? AND cancion_id = ?', [id, cancion_id]);
    res.json({ mensaje: 'Quitada' });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

export async function eliminarPlaylist(req, res) {
  try {
    await bd.execute('DELETE FROM playlists WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuario.id]);
    res.json({ mensaje: 'Eliminada' });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

export async function renombrarPlaylist(req, res) {
  try {
    const { nombre, descripcion } = req.body;
    await bd.execute(
      'UPDATE playlists SET nombre = ?, descripcion = ? WHERE id = ? AND usuario_id = ?',
      [nombre, descripcion || null, req.params.id, req.usuario.id]
    );
    res.json({ mensaje: 'Actualizada' });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

// ── Favoritos ─────────────────────────────────────────────────────
export async function obtenerFavoritos(req, res) {
  try {
    const [c] = await bd.execute(`
      SELECT c.*, a.nombre AS nombre_artista, g.nombre AS nombre_genero, g.color AS color_genero
      FROM favoritos f JOIN canciones c ON c.id = f.cancion_id
      LEFT JOIN artistas a ON a.id = c.artista_id
      LEFT JOIN generos g ON g.id = c.genero_id
      WHERE f.usuario_id = ? ORDER BY f.creado_en DESC
    `, [req.usuario.id]);
    res.json({ canciones: c });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

export async function toggleFavorito(req, res) {
  try {
    const { cancion_id, fuente_externa, titulo, artista, imagen_url, preview_url, duracion, deezer_id, jamendo_id } = req.body;
    let idFinal = cancion_id;

    if (fuente_externa && !cancion_id) {
      let artista_id = null;
      if (artista?.trim()) {
        const [ex] = await bd.execute('SELECT id FROM artistas WHERE nombre = ?', [artista.trim()]);
        artista_id = ex.length ? ex[0].id : (await bd.execute('INSERT INTO artistas (nombre) VALUES (?)', [artista.trim()]))[0].insertId;
      }
      const idExt = fuente_externa === 'deezer' ? deezer_id : jamendo_id;
      const campo = fuente_externa === 'deezer' ? 'deezer_id' : 'jamendo_id';
      const [exC] = await bd.execute(`SELECT id FROM canciones WHERE ${campo} = ?`, [idExt]);
      if (exC.length) { idFinal = exC[0].id; }
      else {
        const [r] = await bd.execute(
          'INSERT INTO canciones (titulo, artista_id, imagen_url, preview_url, duracion_segundos, fuente, deezer_id, jamendo_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [titulo, artista_id, imagen_url, preview_url, parseInt(duracion) || 0, fuente_externa, fuente_externa === 'deezer' ? idExt : null, fuente_externa === 'jamendo' ? idExt : null]
        );
        idFinal = r.insertId;
      }
    }

    const [ex] = await bd.execute('SELECT id FROM favoritos WHERE usuario_id = ? AND cancion_id = ?', [req.usuario.id, idFinal]);
    if (ex.length) {
      await bd.execute('DELETE FROM favoritos WHERE usuario_id = ? AND cancion_id = ?', [req.usuario.id, idFinal]);
      res.json({ favorito: false });
    } else {
      await bd.execute('INSERT INTO favoritos (usuario_id, cancion_id) VALUES (?, ?)', [req.usuario.id, idFinal]);
      res.json({ favorito: true });
    }
  } catch (e) {
    console.error('toggleFavorito:', e);
    res.status(500).json({ mensaje: 'Error' });
  }
}

export async function esFavorito(req, res) {
  try {
    const { id } = req.params;
    const [f] = await bd.execute('SELECT id FROM favoritos WHERE usuario_id = ? AND cancion_id = ?', [req.usuario.id, id]);
    res.json({ favorito: f.length > 0 });
  } catch (e) { res.json({ favorito: false }); }
}

// ── Géneros ───────────────────────────────────────────────────────
export async function obtenerGeneros(req, res) {
  try {
    const [g] = await bd.execute('SELECT * FROM generos ORDER BY nombre');
    res.json({ generos: g });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

// ── Gustos ────────────────────────────────────────────────────────
export async function guardarGustos(req, res) {
  try {
    const { generos } = req.body;
    await bd.execute('DELETE FROM gustos_usuario WHERE usuario_id = ?', [req.usuario.id]);
    for (const g of (generos || [])) {
      await bd.execute('INSERT IGNORE INTO gustos_usuario (usuario_id, genero_id) VALUES (?, ?)', [req.usuario.id, g]);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

// ── Recomendaciones ───────────────────────────────────────────────
export async function obtenerRecomendaciones(req, res) {
  try {
    const uid = req.usuario.id;
    const [gustos] = await bd.execute('SELECT genero_id FROM gustos_usuario WHERE usuario_id = ?', [uid]);
    const [histGeneros] = await bd.execute(`
      SELECT c.genero_id, COUNT(*) AS veces FROM historial_reproducciones h
      JOIN canciones c ON c.id = h.cancion_id
      WHERE h.usuario_id = ? AND c.genero_id IS NOT NULL
      GROUP BY c.genero_id ORDER BY veces DESC LIMIT 5
    `, [uid]);

    const ids = [...new Set([...gustos.map(g => g.genero_id), ...histGeneros.map(g => g.genero_id)])];

    let canciones = [];
    if (ids.length) {
      const ph = ids.map(() => '?').join(',');
      const [c] = await bd.execute(`
        SELECT c.*, a.nombre AS nombre_artista, g.nombre AS nombre_genero, g.color AS color_genero
        FROM canciones c
        LEFT JOIN artistas a ON a.id = c.artista_id
        LEFT JOIN generos g ON g.id = c.genero_id
        WHERE c.genero_id IN (${ph}) AND c.esta_activa = TRUE
        ORDER BY c.reproducciones DESC LIMIT 30
      `, ids);
      canciones = c;
    }

    if (canciones.length < 10) {
      const [pop] = await bd.execute(`
        SELECT c.*, a.nombre AS nombre_artista, g.nombre AS nombre_genero
        FROM canciones c LEFT JOIN artistas a ON a.id = c.artista_id
        LEFT JOIN generos g ON g.id = c.genero_id
        WHERE c.esta_activa = TRUE ORDER BY c.reproducciones DESC LIMIT 20
      `);
      canciones = [...canciones, ...pop].slice(0, 20);
    }
    res.json({ canciones });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

// ── Historial ─────────────────────────────────────────────────────
export async function obtenerHistorial(req, res) {
  try {
    const [h] = await bd.execute(`
      SELECT DISTINCT c.*, a.nombre AS nombre_artista, g.nombre AS nombre_genero,
             MAX(hr.reproducido_en) AS ultima_vez
      FROM historial_reproducciones hr
      JOIN canciones c ON c.id = hr.cancion_id
      LEFT JOIN artistas a ON a.id = c.artista_id
      LEFT JOIN generos g ON g.id = c.genero_id
      WHERE hr.usuario_id = ?
      GROUP BY c.id ORDER BY ultima_vez DESC LIMIT 20
    `, [req.usuario.id]);
    res.json({ canciones: h });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

// ── Compartir playlist (hacer pública / privada) ──────────────────
export async function compartirPlaylist(req, res) {
  try {
    const { id } = req.params;
    const [pl] = await bd.execute('SELECT id, es_publica FROM playlists WHERE id = ? AND usuario_id = ?', [id, req.usuario.id]);
    if (!pl.length) return res.status(403).json({ mensaje: 'Sin permiso' });
    const nuevoEstado = !pl[0].es_publica;
    await bd.execute('UPDATE playlists SET es_publica = ? WHERE id = ?', [nuevoEstado, id]);
    res.json({
      es_publica: nuevoEstado,
      link: nuevoEstado ? `/playlist-publica/${id}` : null,
      mensaje: nuevoEstado ? '✅ Playlist compartida públicamente' : 'Playlist ahora es privada',
    });
  } catch (e) { res.status(500).json({ mensaje: 'Error al compartir' }); }
}

// ── Ver playlist pública (sin autenticación) ──────────────────────
export async function obtenerPlaylistPublica(req, res) {
  try {
    const { id } = req.params;
    const [pl] = await bd.execute('SELECT * FROM playlists WHERE id = ? AND es_publica = TRUE', [id]);
    if (!pl.length) return res.status(404).json({ mensaje: 'Playlist no encontrada o es privada' });
    const [canciones] = await bd.execute(`
      SELECT c.*, a.nombre AS nombre_artista, g.nombre AS nombre_genero, g.color AS color_genero
      FROM playlist_canciones pc
      JOIN canciones c ON c.id = pc.cancion_id
      LEFT JOIN artistas a ON a.id = c.artista_id
      LEFT JOIN generos  g ON g.id = c.genero_id
      WHERE pc.playlist_id = ? ORDER BY pc.posicion ASC, pc.agregado_en ASC
    `, [id]);
    const [autor] = await bd.execute('SELECT nombre FROM usuarios WHERE id = ?', [pl[0].usuario_id]);
    res.json({ playlist: { ...pl[0], autor: autor[0]?.nombre || 'Usuario' }, canciones });
  } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
}

// ── Buscar letra de canción ───────────────────────────────────────
export async function buscarLetra(req, res) {
  try {
    const { artista, titulo } = req.query;
    if (!artista || !titulo) return res.status(400).json({ mensaje: 'Se requiere artista y titulo' });

    // Usar lyrics.ovh — API gratuita sin key
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artista)}/${encodeURIComponent(titulo)}`;
    const resp = await (await import('axios')).default.get(url, { timeout: 8000 });

    if (resp.data?.lyrics) {
      res.json({ letra: resp.data.lyrics, encontrada: true });
    } else {
      res.json({ letra: null, encontrada: false, mensaje: 'Letra no encontrada' });
    }
  } catch (e) {
    if (e.response?.status === 404) {
      res.json({ letra: null, encontrada: false, mensaje: 'Letra no disponible para esta canción' });
    } else {
      res.status(500).json({ letra: null, encontrada: false, mensaje: 'Error al buscar letra' });
    }
  }
}