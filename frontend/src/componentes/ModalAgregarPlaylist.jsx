import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function ModalAgregarPlaylist({ cancion, onCerrar }) {
  const [playlists,  setPlaylists]  = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [creando,    setCreando]    = useState(false);
  const [nombre,     setNombre]     = useState('');
  const [msg,        setMsg]        = useState(null);
  const [agregando,  setAgregando]  = useState(null);

  useEffect(() => {
    axios.get('/api/playlists')
      .then(r => setPlaylists(r.data.playlists || []))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const agregarAPlaylist = async (playlistId) => {
    setAgregando(playlistId);
    try {
      const payload = { playlist_id: playlistId };
      // Canción local
      if (cancion.id && !String(cancion.id).startsWith('deezer_') && !String(cancion.id).startsWith('jamendo_')) {
        payload.cancion_id = cancion.id;
      } else {
        // Externa
        payload.fuente_externa = cancion.fuente;
        payload.titulo         = cancion.titulo;
        payload.artista        = cancion.artista || cancion.nombre_artista;
        payload.imagen_url     = cancion.imagen_url;
        payload.preview_url    = cancion.preview_url;
        payload.duracion       = cancion.duracion || cancion.duracion_segundos;
        payload.deezer_id      = cancion.deezer_id;
        payload.jamendo_id     = cancion.jamendo_id;
      }

      await axios.post(`/api/playlists/${playlistId}/canciones`, payload);
      setMsg({ tipo: 'ok', texto: 'Agregada a la playlist ✅' });
      setTimeout(() => { setMsg(null); onCerrar(); }, 1500);
    } catch (e) {
      setMsg({ tipo: 'err', texto: e.response?.data?.mensaje || 'Error al agregar' });
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setAgregando(null);
    }
  };

  const crearYAgregar = async () => {
    if (!nombre.trim()) return;
    try {
      const { data } = await axios.post('/api/playlists', { nombre: nombre.trim() });
      await agregarAPlaylist(data.id);
      setNombre('');
      setCreando(false);
    } catch (e) {
      setMsg({ tipo: 'err', texto: 'Error al crear playlist' });
    }
  };

  return (
    <div className="sp-overlay" onClick={onCerrar}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 380, background: '#282828',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {cancion.imagen_url ? (
              <img src={cancion.imagen_url} alt="" style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 4, background: '#3e3e3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎵</div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }} className="truncar">{cancion.titulo}</p>
              <p style={{ color: '#b3b3b3', fontSize: 12 }} className="truncar">{cancion.artista || cancion.nombre_artista}</p>
            </div>
          </div>
          <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginTop: 14 }}>Agregar a playlist</h3>
        </div>

        {/* Mensaje feedback */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                padding: '10px 20px', fontSize: 13,
                background: msg.tipo === 'ok' ? 'rgba(29,185,84,0.15)' : 'rgba(220,38,38,0.15)',
                color: msg.tipo === 'ok' ? '#1db954' : '#f87171',
                fontWeight: 600,
              }}
            >{msg.texto}</motion.div>
          )}
        </AnimatePresence>

        {/* Crear nueva */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {creando ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input-sp" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Nombre de la playlist" autoFocus
                onKeyDown={e => e.key === 'Enter' && crearYAgregar()}
                style={{ flex: 1, padding: '10px 14px', fontSize: 14 }}
              />
              <button onClick={crearYAgregar} className="btn-sp-verde" style={{ padding: '8px 16px', fontSize: 13 }}>Crear</button>
              <button onClick={() => setCreando(false)} style={{ background: 'none', border: '1px solid #535353', color: '#b3b3b3', borderRadius: 4, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setCreando(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', width: '100%', textAlign: 'left', padding: '4px 0' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 4, background: '#3e3e3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>➕</div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Nueva playlist</span>
            </button>
          )}
        </div>

        {/* Lista playlists */}
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {cargando ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ width: 24, height: 24, border: '2px solid #535353', borderTopColor: '#1db954', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto' }} />
            </div>
          ) : playlists.length === 0 ? (
            <p style={{ padding: 20, color: '#b3b3b3', fontSize: 13, textAlign: 'center' }}>No tienes playlists aún</p>
          ) : (
            playlists.map(p => (
              <button key={p.id} onClick={() => agregarAPlaylist(p.id)}
                disabled={agregando === p.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ width: 40, height: 40, borderRadius: 4, background: p.imagen_portada ? 'transparent' : '#3e3e3e', overflow: 'hidden', flexShrink: 0 }}>
                  {p.imagen_portada
                    ? <img src={p.imagen_portada} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }} className="truncar">{p.nombre}</p>
                  <p style={{ color: '#b3b3b3', fontSize: 12 }}>{p.total_canciones} canciones</p>
                </div>
                {agregando === p.id && (
                  <div style={{ width: 16, height: 16, border: '2px solid #535353', borderTopColor: '#1db954', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                )}
              </button>
            ))
          )}
        </div>

        {/* Cerrar */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={onCerrar} className="btn-sp-outline" style={{ width: '100%', padding: '10px' }}>Cerrar</button>
        </div>
      </motion.div>
    </div>
  );
}
