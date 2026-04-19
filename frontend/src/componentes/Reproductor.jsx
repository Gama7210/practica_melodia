import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useReproductor } from '../contexto/ContextoReproductor.jsx';

const fmt = s => (!s || isNaN(s)) ? '0:00' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ── Iconos SVG ──────────────────────────────────────────────────────────────
const IcoPlay  = ({ s = 16, c = '#000' }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M8 5.14v14l11-7-11-7z"/></svg>;
const IcoPause = ({ s = 16, c = '#000' }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>;
const IcoPrev  = ({ s = 28, c = '#fff' }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>;
const IcoNext  = ({ s = 28, c = '#fff' }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>;
const IcoShuf  = ({ s = 22, c }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>;
const IcoRep   = ({ s = 22, c }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>;
const IcoRep1  = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="#1db954"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v6H13z"/></svg>;

// ── Spinner ─────────────────────────────────────────────────────────────────
const Spin = ({ size = 16, border = 2.5, color = '#000' }) => (
  <div style={{ width: size, height: size, border: `${border}px solid ${color}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
);

// ── Barra de progreso táctil ────────────────────────────────────────────────
function BarraProgreso({ progreso, duracion, onBuscar, light = false }) {
  const ref = useRef(null);
  const pct = duracion ? Math.min((progreso / duracion) * 100, 100) : 0;

  const seek = e => {
    e.stopPropagation();
    const r = ref.current.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - r.left;
    onBuscar(Math.max(0, Math.min(1, x / r.width)) * duracion);
  };

  const tc = light ? 'rgba(255,255,255,.65)' : '#b3b3b3';
  const bg = light ? 'rgba(255,255,255,.25)' : '#535353';
  const fg = light ? 'rgba(255,255,255,.9)'  : '#1db954';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <span style={{ color: tc, fontSize: 11, minWidth: 36, textAlign: 'right' }}>{fmt(progreso)}</span>
      <div ref={ref} onClick={seek} onTouchEnd={seek}
        style={{ flex: 1, height: 20, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <div style={{ width: '100%', height: 4, background: bg, borderRadius: 2, position: 'relative' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: fg, borderRadius: 2 }} />
          <div style={{ position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.5)' }} />
        </div>
      </div>
      <span style={{ color: tc, fontSize: 11, minWidth: 36 }}>{fmt(duracion)}</span>
    </div>
  );
}

// ── Botón Me Gusta ──────────────────────────────────────────────────────────
function BotonMeGusta({ cancion }) {
  const [esFav, setEsFav] = useState(false);
  const [anim,  setAnim]  = useState(false);

  const idStr    = String(cancion?.id || '');
  const esLocal  = cancion?.id && !idStr.startsWith('deezer_') && !idStr.startsWith('jamendo_');
  const deezerId = idStr.startsWith('deezer_')  ? idStr.replace('deezer_', '')  : null;
  const jamenId  = idStr.startsWith('jamendo_') ? idStr.replace('jamendo_', '') : null;

  useEffect(() => {
    if (!cancion?.id || !esLocal) return;
    axios.get(`/api/favoritos/${cancion.id}`).then(r => setEsFav(r.data.favorito || false)).catch(() => {});
  }, [cancion?.id]);

  const toggle = async e => {
    e.stopPropagation();
    const prev = esFav;
    setEsFav(!esFav); setAnim(true); setTimeout(() => setAnim(false), 700);
    try {
      let payload = {};
      if (esLocal)    payload = { cancion_id: cancion.id };
      else if (deezerId) payload = { fuente_externa: 'deezer', deezer_id: deezerId, titulo: cancion.titulo || '', artista: cancion.artista || cancion.nombre_artista || '', imagen_url: cancion.imagen_url || '', preview_url: cancion.preview_url || '', duracion: cancion.duracion || 0 };
      else if (jamenId)  payload = { fuente_externa: 'jamendo', jamendo_id: jamenId, titulo: cancion.titulo || '', artista: cancion.artista || cancion.nombre_artista || '', imagen_url: cancion.imagen_url || '', preview_url: cancion.preview_url || '', duracion: cancion.duracion || 0 };
      else return;
      const { data } = await axios.post('/api/favoritos', payload);
      setEsFav(data.favorito);
    } catch { setEsFav(prev); }
  };

  return (
    <motion.button onClick={toggle} whileTap={{ scale: .7 }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AnimatePresence>
        {anim && esFav && [...Array(6)].map((_, i) => (
          <motion.span key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ scale: [0, 1, 0], x: Math.cos((i / 6) * Math.PI * 2) * 22, y: Math.sin((i / 6) * Math.PI * 2) * 22, opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }} transition={{ duration: .5 }}
            style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: i % 2 === 0 ? '#1db954' : '#ff4d6d', pointerEvents: 'none' }} />
        ))}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {esFav
          ? <motion.svg key="on" initial={{ scale: .3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} width="28" height="28" viewBox="0 0 24 24" fill="#1db954"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></motion.svg>
          : <motion.svg key="off" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="1.5"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></motion.svg>
        }
      </AnimatePresence>
    </motion.button>
  );
}

// ── Modal Agregar a Playlist ────────────────────────────────────────────────
function ModalPlaylist({ cancion, onCerrar }) {
  const [playlists, setPlaylists] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [creando,   setCreando]   = useState(false);
  const [nombre,    setNombre]    = useState('');
  const [msg,       setMsg]       = useState(null);
  const [loading,   setLoading]   = useState(null);

  useEffect(() => {
    axios.get('/api/playlists').then(r => setPlaylists(r.data.playlists || [])).finally(() => setCargando(false));
  }, []);

  const agregar = async plId => {
    setLoading(plId);
    try {
      const idStr   = String(cancion?.id || '');
      const esLocal = cancion?.id && !idStr.startsWith('deezer_') && !idStr.startsWith('jamendo_');
      const payload = esLocal
        ? { cancion_id: cancion.id }
        : { fuente_externa: cancion.fuente, titulo: cancion.titulo, artista: cancion.artista || cancion.nombre_artista || '', imagen_url: cancion.imagen_url || '', preview_url: cancion.preview_url || '', duracion: cancion.duracion || 0, deezer_id: cancion.deezer_id, jamendo_id: cancion.jamendo_id };
      await axios.post(`/api/playlists/${plId}/canciones`, payload);
      setMsg({ ok: true, txt: '✅ Agregada' });
      setTimeout(() => { setMsg(null); onCerrar(); }, 1200);
    } catch { setMsg({ ok: false, txt: 'Error al agregar' }); setTimeout(() => setMsg(null), 2500); }
    finally { setLoading(null); }
  };

  const crear = async () => {
    if (!nombre.trim()) return;
    try {
      const { data } = await axios.post('/api/playlists', { nombre: nombre.trim() });
      setPlaylists(p => [{ id: data.id, nombre: data.nombre, total_canciones: 0 }, ...p]);
      await agregar(data.id);
      setNombre(''); setCreando(false);
    } catch { setMsg({ ok: false, txt: 'Error al crear' }); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}
      onClick={onCerrar}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', background: '#282828', borderRadius: '16px 16px 0 0', maxHeight: '82vh', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>

        <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.3)' }} />
        </div>

        <div style={{ padding: '8px 20px 14px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
            {cancion?.imagen_url
              ? <img src={cancion.imagen_url} alt="" style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
              : <div style={{ width: 44, height: 44, borderRadius: 4, background: '#3e3e3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
            }
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{cancion?.titulo}</p>
              <p style={{ color: '#b3b3b3', fontSize: 13 }}>{cancion?.artista || cancion?.nombre_artista || '—'}</p>
            </div>
          </div>
          <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>Agregar a playlist</h3>
        </div>

        {msg && (
          <div style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, background: msg.ok ? 'rgba(29,185,84,.15)' : 'rgba(239,68,68,.15)', color: msg.ok ? '#1db954' : '#f87171' }}>
            {msg.txt}
          </div>
        )}

        <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          {creando ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre de la playlist" autoFocus
                onKeyDown={e => e.key === 'Enter' && crear()}
                style={{ flex: 1, background: '#3e3e3e', border: '1px solid #535353', color: '#fff', borderRadius: 4, padding: '10px 12px', fontSize: 16, outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={crear} style={{ background: '#1db954', border: 'none', color: '#000', borderRadius: 4, padding: '0 14px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Crear</button>
              <button onClick={() => setCreando(false)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#b3b3b3', borderRadius: 4, padding: '0 10px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setCreando(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', width: '100%', padding: '6px 0', fontFamily: 'inherit' }}>
              <div style={{ width: 44, height: 44, borderRadius: 4, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>➕</div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Nueva playlist</span>
            </button>
          )}
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {cargando
            ? <div style={{ padding: 24, textAlign: 'center' }}><Spin size={24} border={2} color="#1db954" /></div>
            : playlists.map(p => (
              <button key={p.id} onClick={() => agregar(p.id)} disabled={loading === p.id}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                onTouchStart={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                onTouchEnd={e => e.currentTarget.style.background = 'none'}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <div style={{ width: 44, height: 44, borderRadius: 4, background: '#3e3e3e', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {p.imagen_portada ? <img src={p.imagen_portada} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎵'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#fff', fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                  <p style={{ color: '#b3b3b3', fontSize: 12 }}>{p.total_canciones} canciones</p>
                </div>
                {loading === p.id && <Spin size={16} border={2} color="#1db954" />}
              </button>
            ))
          }
        </div>

        <div style={{ padding: '12px 20px 16px' }}>
          <button onClick={onCerrar} style={{ width: '100%', padding: '14px', borderRadius: 500, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'inherit' }}>
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Panel Letra ─────────────────────────────────────────────────────────────
function PanelLetra({ cancion, onCerrar }) {
  const [letra,    setLetra]    = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!cancion) return;
    const artista = cancion.artista || cancion.nombre_artista || '';
    const titulo  = cancion.titulo || '';
    if (!artista || !titulo) { setError('Sin información para buscar la letra'); setCargando(false); return; }
    setCargando(true); setError(null); setLetra(null);
    axios.get(`/api/letra?artista=${encodeURIComponent(artista)}&titulo=${encodeURIComponent(titulo)}`)
      .then(r => { if (r.data.encontrada && r.data.letra) setLetra(r.data.letra); else setError(r.data.mensaje || 'Letra no disponible'); })
      .catch(() => setError('Error al buscar la letra'))
      .finally(() => setCargando(false));
  }, [cancion?.id]);

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,.95)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px' }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 2 }}>{cancion?.titulo}</p>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>{cancion?.artista || cancion?.nombre_artista}</p>
        </div>
        <button onClick={onCerrar} style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: '50%', width: 38, height: 38, cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 32px' }}>
        {cargando
          ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 16 }}><Spin size={32} border={3} color="#1db954" /><p style={{ color: 'rgba(255,255,255,.5)' }}>Buscando letra...</p></div>
          : error
            ? <div style={{ textAlign: 'center', paddingTop: 60 }}><div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div><p style={{ color: 'rgba(255,255,255,.5)', fontSize: 14, lineHeight: 1.6 }}>{error}</p></div>
            : <p style={{ color: 'rgba(255,255,255,.9)', fontSize: 17, lineHeight: 1.9, whiteSpace: 'pre-line' }}>{letra}</p>
        }
      </div>
    </motion.div>
  );
}

// ── Reproductor Expandido ────────────────────────────────────────────────────
function ReproductorExpandido({ onCerrar }) {
  const {
    actual, play, progreso, duracion, volumen, silencio, aleatorio, repetir, cargandoAudio, esYT, ytId,
    togglePlay, siguiente, anterior, buscarPosicion, cambiarVolumen, toggleSilencio, setAleatorio, ciclarRepetir,
  } = useReproductor();

  const [mostrarPlaylist, setMostrarPlaylist] = useState(false);
  const [mostrarLetra,    setMostrarLetra]    = useState(false);
  const esMobile = /Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;

  return (
    <>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Fondo */}
        <div style={{ position: 'absolute', inset: 0, background: '#121212' }} />
        {actual?.imagen_url && !esYT && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${actual.imagen_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(80px) brightness(.2) saturate(2)', transform: 'scale(1.2)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.15), rgba(0,0,0,.7))' }} />

        {/* Panel letra */}
        <AnimatePresence>
          {mostrarLetra && <PanelLetra cancion={actual} onCerrar={() => setMostrarLetra(false)} />}
        </AnimatePresence>

        {/* Contenido */}
        <div style={{
          position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%',
          padding: '0 24px', paddingTop: 'max(20px, env(safe-area-inset-top, 20px))',
          paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
          maxWidth: 480, margin: '0 auto', width: '100%',
        }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <motion.button whileTap={{ scale: .9 }} onClick={onCerrar}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, margin: '-8px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(255,255,255,.9)">
                <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </motion.button>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
              Reproduciendo ahora
            </p>
            <div style={{ width: 44 }} />
          </div>

          {/* Portada / YouTube */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
            {esYT && ytId ? (
              esMobile ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: '100%', maxWidth: 300, aspectRatio: '1', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.8)' }}>
                    {actual?.imagen_url
                      ? <img src={actual.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🎵</div>
                    }
                  </div>
                  <a href={`https://www.youtube.com/watch?v=${ytId}`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ff0000', color: '#fff', padding: '14px 28px', borderRadius: 500, textDecoration: 'none', fontWeight: 700, fontSize: 16, boxShadow: '0 4px 20px rgba(255,0,0,.4)' }}>
                    ▶ Ver en YouTube
                  </a>
                </div>
              ) : (
                <div style={{ width: '100%', maxWidth: 460, borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', boxShadow: '0 24px 64px rgba(0,0,0,.8)' }}>
                  <iframe key={ytId} src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              )
            ) : (
              <motion.div
                animate={play ? { scale: 1.04 } : { scale: 1 }} transition={{ duration: .5 }}
                style={{ width: '100%', maxWidth: 300, aspectRatio: '1', borderRadius: 12, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.8)' }}>
                {actual?.imagen_url
                  ? <img src={actual.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>🎵</div>
                }
              </motion.div>
            )}
          </div>

          {/* Título + botones acción */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {actual?.titulo || '—'}
              </p>
              <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {actual?.artista || actual?.nombre_artista || '—'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
              {/* Letra */}
              <motion.button whileTap={{ scale: .8 }}
                onClick={e => { e.stopPropagation(); setMostrarLetra(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,.55)">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
              </motion.button>
              {/* Agregar playlist */}
              <motion.button whileTap={{ scale: .8 }}
                onClick={e => { e.stopPropagation(); setMostrarPlaylist(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </motion.button>
              {/* Me gusta */}
              <BotonMeGusta cancion={actual} />
            </div>
          </div>

          {/* Progreso */}
          {!esYT && (
            <div style={{ marginBottom: 20 }}>
              <BarraProgreso progreso={progreso} duracion={duracion} onBuscar={buscarPosicion} light />
            </div>
          )}
          {esYT && <div style={{ marginBottom: 16, height: 4, background: 'rgba(255,255,255,.1)', borderRadius: 2 }} />}

          {/* Controles */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <motion.button whileTap={{ scale: .85 }} onClick={() => setAleatorio(a => !a)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 10, position: 'relative' }}>
              <IcoShuf s={24} c={aleatorio ? '#1db954' : 'rgba(255,255,255,.5)'} />
              {aleatorio && <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#1db954' }} />}
            </motion.button>

            <motion.button whileTap={{ scale: .88 }} onClick={anterior}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 10 }}>
              <IcoPrev s={32} c="#fff" />
            </motion.button>

            {!esYT && (
              <motion.button whileTap={{ scale: .93 }} onClick={togglePlay}
                style={{ width: 68, height: 68, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}>
                {cargandoAudio ? <Spin size={28} border={3} /> : play ? <IcoPause s={30} c="#000" /> : <IcoPlay s={30} c="#000" />}
              </motion.button>
            )}

            <motion.button whileTap={{ scale: .88 }} onClick={siguiente}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 10 }}>
              <IcoNext s={32} c="#fff" />
            </motion.button>

            <motion.button whileTap={{ scale: .85 }} onClick={ciclarRepetir}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 10, position: 'relative' }}>
              {repetir === 'one' ? <IcoRep1 s={24} /> : <IcoRep s={24} c={repetir !== 'none' ? '#1db954' : 'rgba(255,255,255,.5)'} />}
              {repetir !== 'none' && <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#1db954' }} />}
            </motion.button>
          </div>

          {esYT && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.35)', fontSize: 12 }}>Toca "Ver en YouTube" para reproducir</p>}
        </div>
      </motion.div>

      <AnimatePresence>
        {mostrarPlaylist && actual && (
          <ModalPlaylist cancion={actual} onCerrar={() => setMostrarPlaylist(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BARRA INFERIOR — móvil simple / desktop completo
// ══════════════════════════════════════════════════════════════════════════════
export default function Reproductor() {
  const {
    actual, play, progreso, duracion, volumen, silencio, aleatorio, repetir, cargandoAudio, esYT,
    togglePlay, siguiente, anterior, buscarPosicion, cambiarVolumen, toggleSilencio,
    setAleatorio, ciclarRepetir, verReproductor, setVerReproductor,
  } = useReproductor();

  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  if (!actual) return (
    <div style={{ height: mobile ? 64 : 90, background: '#181818', borderTop: '1px solid #282828', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <p style={{ color: '#535353', fontSize: 13 }}>Selecciona una canción para reproducir</p>
    </div>
  );

  // ── MÓVIL ──────────────────────────────────────────────────────────────────
  if (mobile) return (
    <>
      <AnimatePresence>
        {verReproductor && <ReproductorExpandido onCerrar={() => setVerReproductor(false)} />}
      </AnimatePresence>

      <motion.div
        initial={{ y: 80 }} animate={{ y: 0 }}
        onClick={() => setVerReproductor(true)}
        style={{
          height: 64, background: '#181818', borderTop: '1px solid #282828',
          display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10,
          flexShrink: 0, cursor: 'pointer', position: 'relative', zIndex: 150,
          userSelect: 'none', WebkitUserSelect: 'none',
        }}
      >
        {/* Portada */}
        <div style={{ width: 46, height: 46, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#282828' }}>
          {actual.imagen_url
            ? <img src={actual.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎵</div>
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{actual.titulo}</p>
          <p style={{ color: '#b3b3b3', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{actual.artista || actual.nombre_artista || '—'}</p>
        </div>

        {/* Ecualizador */}
        {play && !esYT && (
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 16, flexShrink: 0 }}>
            {[8, 14, 10, 12].map((h, i) => (
              <span key={i} style={{ display: 'inline-block', width: 3, height: h, background: '#1db954', borderRadius: 1, animation: 'onda .8s ease-in-out infinite', animationDelay: `${i * .12}s` }} />
            ))}
          </div>
        )}

        {/* Play/Pausa */}
        <motion.button
          whileTap={{ scale: .85 }}
          onClick={e => { e.stopPropagation(); esYT ? setVerReproductor(true) : togglePlay(); }}
          style={{ width: 42, height: 42, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,.5)' }}
        >
          {cargandoAudio ? <Spin /> : play ? <IcoPause s={16} c="#000" /> : <IcoPlay s={16} c="#000" />}
        </motion.button>

        {/* Siguiente */}
        <motion.button
          whileTap={{ scale: .85 }}
          onClick={e => { e.stopPropagation(); siguiente(); }}
          style={{ width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <IcoNext s={22} c="#b3b3b3" />
        </motion.button>
      </motion.div>
    </>
  );

  // ── DESKTOP ────────────────────────────────────────────────────────────────
  return (
    <>
      <AnimatePresence>
        {verReproductor && <ReproductorExpandido onCerrar={() => setVerReproductor(false)} />}
      </AnimatePresence>

      <motion.div initial={{ y: 90 }} animate={{ y: 0 }}
        style={{ height: 90, background: '#181818', borderTop: '1px solid #282828', display: 'grid', gridTemplateColumns: '30% 40% 30%', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>

        {/* Izquierda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, cursor: 'pointer' }} onClick={() => setVerReproductor(true)}>
          <div style={{ width: 56, height: 56, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#282828' }}>
            {actual.imagen_url
              ? <img src={actual.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎵</div>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{actual.titulo}</p>
            <p style={{ color: '#b3b3b3', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{actual.artista || actual.nombre_artista || '—'}</p>
          </div>
          {play && !esYT && (
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 16, flexShrink: 0 }}>
              {[8, 14, 10, 12].map((h, i) => <span key={i} style={{ display: 'inline-block', width: 3, height: h, background: '#1db954', borderRadius: 1, animation: 'onda .8s ease-in-out infinite', animationDelay: `${i * .12}s` }} />)}
            </div>
          )}
        </div>

        {/* Centro */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.button whileTap={{ scale: .85 }} onClick={() => setAleatorio(a => !a)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative' }}>
              <IcoShuf s={16} c={aleatorio ? '#1db954' : '#b3b3b3'} />
              {aleatorio && <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#1db954' }} />}
            </motion.button>
            <motion.button whileTap={{ scale: .88 }} onClick={anterior} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><IcoPrev s={18} c="#b3b3b3" /></motion.button>
            <motion.button whileTap={{ scale: .93 }} onClick={e => { e.stopPropagation(); esYT ? setVerReproductor(true) : togglePlay(); }}
              style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.4)' }}>
              {esYT ? <IcoPlay s={16} c="#000" /> : cargandoAudio ? <Spin /> : play ? <IcoPause s={16} c="#000" /> : <IcoPlay s={16} c="#000" />}
            </motion.button>
            <motion.button whileTap={{ scale: .88 }} onClick={siguiente} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><IcoNext s={18} c="#b3b3b3" /></motion.button>
            <motion.button whileTap={{ scale: .85 }} onClick={ciclarRepetir} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative' }}>
              {repetir === 'one' ? <IcoRep1 s={16} /> : <IcoRep s={16} c={repetir !== 'none' ? '#1db954' : '#b3b3b3'} />}
              {repetir !== 'none' && <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#1db954' }} />}
            </motion.button>
          </div>
          {!esYT && <BarraProgreso progreso={progreso} duracion={duracion} onBuscar={buscarPosicion} />}
        </div>

        {/* Derecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          {actual.fuente && <span style={{ background: '#282828', color: '#535353', fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>{actual.fuente === 'youtube' ? 'YT' : actual.fuente === 'deezer' ? 'Deezer' : 'MP3'}</span>}
          {!esYT && (
            <>
              <button onClick={toggleSilencio} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#b3b3b3"><path d={silencio ? "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" : "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"} /></svg>
              </button>
              <div style={{ width: 80, height: 14, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={e => { const r = e.currentTarget.getBoundingClientRect(); cambiarVolumen(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); }}>
                <div style={{ width: '100%', height: 3, background: '#535353', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${(silencio ? 0 : volumen) * 100}%`, background: '#b3b3b3', borderRadius: 2 }} />
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}