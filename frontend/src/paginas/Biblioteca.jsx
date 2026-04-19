import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useReproductor } from '../contexto/ContextoReproductor.jsx';
import TarjetaCancion from '../componentes/TarjetaCancion.jsx';

// ── Biblioteca ────────────────────────────────────────────────────
export function Biblioteca() {
  const [playlists, setPlaylists] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [creando,   setCreando]   = useState(false);
  const [nombre,    setNombre]    = useState('');
  const navegar = useNavigate();

  useEffect(() => {
    axios.get('/api/playlists').then(r => setPlaylists(r.data.playlists||[])).finally(()=>setCargando(false));
  }, []);

  const crear = async () => {
    if (!nombre.trim()) return;
    const { data } = await axios.post('/api/playlists', { nombre: nombre.trim() });
    setPlaylists(p => [{ id:data.id, nombre:data.nombre, total_canciones:0 }, ...p]);
    setNombre(''); setCreando(false);
    navegar(`/biblioteca/${data.id}`);
  };

  return (
    <div style={{ padding:'24px 24px 120px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h1 style={{ color:'#fff', fontSize:26, fontWeight:900 }}>📚 Tu biblioteca</h1>
        <motion.button whileTap={{ scale:0.95 }} onClick={() => setCreando(true)}
          className="btn-sp-verde" style={{ padding:'8px 20px', fontSize:13 }}
        >+ Crear playlist</motion.button>
      </div>

      <AnimatePresence>
        {creando && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            style={{ overflow:'hidden', marginBottom:20 }}
          >
            <div style={{ background:'#282828', borderRadius:12, padding:20 }}>
              <h3 style={{ color:'#fff', fontWeight:700, marginBottom:14 }}>🎵 Nueva playlist</h3>
              <div style={{ display:'flex', gap:10 }}>
                <input className="input-sp" value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Nombre de la playlist" autoFocus
                  onKeyDown={e => e.key === 'Enter' && crear()} style={{ flex:1 }}
                />
                <button onClick={crear} className="btn-sp-verde" style={{ padding:'8px 20px' }}>Crear</button>
                <button onClick={() => setCreando(false)} className="btn-sp-outline" style={{ padding:'8px 14px' }}>✕</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Favoritos */}
      <motion.div whileHover={{ background:'#282828' }}
        onClick={() => navegar('/favoritos')}
        style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 14px', borderRadius:8, cursor:'pointer', marginBottom:8, transition:'background 0.15s' }}
      >
        <div style={{ width:48, height:48, borderRadius:6, background:'linear-gradient(135deg,#450af5,#8e8ee5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>❤️</div>
        <div>
          <p style={{ color:'#fff', fontSize:14, fontWeight:600 }}>Canciones que te gustan</p>
          <p style={{ color:'#b3b3b3', fontSize:12 }}>Playlist</p>
        </div>
      </motion.div>

      {cargando ? (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ width:30, height:30, border:'3px solid #282828', borderTopColor:'#1db954', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }}/>
        </div>
      ) : playlists.length === 0 ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:60, marginBottom:16 }}>🎵</div>
          <p style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:8 }}>Crea tu primera playlist</p>
          <p style={{ color:'#b3b3b3', fontSize:14 }}>Es fácil, te lo prometemos</p>
        </div>
      ) : (
        playlists.map((p,i) => (
          <motion.div key={p.id} whileHover={{ background:'rgba(255,255,255,0.07)' }}
            initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
            onClick={() => navegar(`/biblioteca/${p.id}`)}
            style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 14px', borderRadius:8, cursor:'pointer', transition:'background 0.15s', marginBottom:4 }}
          >
            <div style={{ width:48, height:48, borderRadius:6, overflow:'hidden', flexShrink:0 }}>
              {p.imagen_portada
                ? <img src={p.imagen_portada} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <div style={{ width:'100%', height:'100%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🎵</div>
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:'#fff', fontSize:14, fontWeight:500 }} className="truncar">{p.nombre}</p>
              <p style={{ color:'#b3b3b3', fontSize:12 }}>Playlist • {p.total_canciones} canciones</p>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

// ── Detalle Playlist ──────────────────────────────────────────────
export function DetallePlaylist() {
  const { id } = useParams();
  const [playlist,  setPlaylist]  = useState(null);
  const [canciones, setCanciones] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [editando,    setEditando]    = useState(false);
  const [nombre,      setNombre]      = useState('');
  const [esPublica,   setEsPublica]   = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [compartiendo,setCompartiendo]= useState(false);
  const { reproducir, actual, play } = useReproductor();

  useEffect(() => {
    axios.get(`/api/playlists/${id}`)
      .then(r => {
        setPlaylist(r.data.playlist);
        setCanciones(r.data.canciones||[]);
        setNombre(r.data.playlist?.nombre||'');
        setEsPublica(r.data.playlist?.es_publica || false);
      })
      .finally(() => setCargando(false));
  }, [id]);

  const compartir = async () => {
    setCompartiendo(true);
    try {
      const { data } = await axios.post(`/api/playlists/${id}/compartir`);
      setEsPublica(data.es_publica);
      if (data.es_publica) {
        const link = `${window.location.origin}/playlist-publica/${id}`;
        await navigator.clipboard.writeText(link);
        setLinkCopiado(true);
        setTimeout(() => setLinkCopiado(false), 3000);
      }
    } catch (e) { console.error(e); }
    finally { setCompartiendo(false); }
  };

  const guardarNombre = async () => {
    await axios.put(`/api/playlists/${id}`, { nombre });
    setPlaylist(p => ({ ...p, nombre }));
    setEditando(false);
  };

  const quitar = async (cancionId) => {
    await axios.delete(`/api/playlists/${id}/canciones/${cancionId}`);
    setCanciones(c => c.filter(x => x.id !== cancionId));
  };

  if (cargando) return <div style={{ padding:40, textAlign:'center' }}><div style={{ width:32, height:32, border:'3px solid #282828', borderTopColor:'#1db954', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }}/></div>;
  if (!playlist) return <div style={{ padding:40, color:'#b3b3b3', textAlign:'center' }}>Playlist no encontrada</div>;

  const estaReproduciendo = canciones.some(c => c.id === actual?.id) && play;
  const img = canciones.find(c => c.imagen_url)?.imagen_url;
  const durTotal = canciones.reduce((acc, c) => acc + (c.duracion_segundos || 0), 0);
  const durMin = Math.floor(durTotal / 60);

  return (
    <div style={{ paddingBottom:120 }}>
      {/* Header con gradiente */}
      <div style={{
        background: img ? 'none' : 'linear-gradient(180deg,#5038a0 0%,transparent 100%)',
        backgroundImage: img ? `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, #121212 100%), url(${img})` : undefined,
        backgroundSize: 'cover', backgroundPosition: 'center',
        padding:'40px 24px 24px', display:'flex', alignItems:'flex-end', gap:24, minHeight:280,
      }}>
        {/* Portada */}
        <div style={{ width:200, height:200, borderRadius:4, overflow:'hidden', flexShrink:0, boxShadow:'0 8px 32px rgba(0,0,0,0.6)' }}>
          {img ? (
            <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          ) : (
            <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#450af5,#8e8ee5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:72 }}>🎵</div>
          )}
        </div>
        <div>
          <p style={{ color:'#fff', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:2, marginBottom:6 }}>Playlist</p>
          {editando ? (
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
              <input className="input-sp" value={nombre} onChange={e=>setNombre(e.target.value)}
                style={{ fontSize:32, fontWeight:900, background:'rgba(255,255,255,0.1)', padding:'4px 12px', borderRadius:4 }}
                onKeyDown={e => e.key === 'Enter' && guardarNombre()} autoFocus
              />
              <button onClick={guardarNombre} className="btn-sp-verde" style={{ padding:'8px 16px' }}>✓</button>
              <button onClick={() => { setEditando(false); setNombre(playlist.nombre); }} style={{ background:'none', border:'none', color:'#b3b3b3', cursor:'pointer', fontSize:20 }}>✕</button>
            </div>
          ) : (
            <h1 onClick={() => setEditando(true)} style={{ fontSize:40, fontWeight:900, color:'#fff', marginBottom:8, cursor:'pointer' }}
              title="Clic para editar"
            >{playlist.nombre}</h1>
          )}
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:14 }}>
            {canciones.length} canciones{durMin > 0 ? ` · ${durMin} min` : ''}
          </p>
        </div>
      </div>

      {/* Controles */}
      <div style={{ padding:'24px', display:'flex', alignItems:'center', gap:16 }}>
        {canciones.length > 0 && (
          <motion.button whileTap={{ scale:0.93 }}
            onClick={() => estaReproduciendo ? {} : reproducir(canciones, 0)}
            style={{
              width:56, height:56, borderRadius:'50%',
              background:'#1db954', border:'none', cursor:'pointer', fontSize:24,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 20px rgba(29,185,84,0.4)',
            }}
          >{estaReproduciendo ? '⏸' : '▶'}</motion.button>
        )}
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'#b3b3b3', fontSize:24 }}
          onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='#b3b3b3'}
          title="Aleatorio"
        >🔀</button>

        {/* Botón compartir */}
        <motion.button
          whileTap={{ scale: .9 }}
          onClick={compartir}
          disabled={compartiendo}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: esPublica ? 'rgba(29,185,84,.15)' : 'rgba(255,255,255,.08)',
            border: esPublica ? '1px solid rgba(29,185,84,.4)' : '1px solid rgba(255,255,255,.15)',
            borderRadius: 500, padding: '8px 16px', cursor: 'pointer',
            color: esPublica ? '#1db954' : '#b3b3b3',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all .2s',
          }}
        >
          {compartiendo
            ? <div style={{ width:14, height:14, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
            : linkCopiado
              ? <span>✅ ¡Link copiado!</span>
              : esPublica
                ? <span>🔗 Compartida — copiar link</span>
                : <span>🔗 Compartir</span>
          }
        </motion.button>
      </div>

      {/* Lista */}
      <div style={{ padding:'0 16px' }}>
        {/* Encabezado tabla */}
        <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 1fr 80px', gap:12, padding:'8px 16px', borderBottom:'1px solid #282828', marginBottom:8 }}>
          <span style={{ color:'#b3b3b3', fontSize:13 }}>#</span>
          <span style={{ color:'#b3b3b3', fontSize:13 }}>Título</span>
          <span style={{ color:'#b3b3b3', fontSize:13 }}>Álbum</span>
          <span style={{ color:'#b3b3b3', fontSize:13, textAlign:'right' }}>⏱</span>
        </div>

        {canciones.length === 0 ? (
          <div style={{ textAlign:'center', padding:48 }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🎵</div>
            <p style={{ color:'#fff', fontWeight:700, marginBottom:8 }}>Esta playlist está vacía</p>
            <p style={{ color:'#b3b3b3', fontSize:13 }}>Busca canciones y agrégalas usando el botón ➕</p>
          </div>
        ) : (
          canciones.map((c, i) => (
            <TarjetaCancion key={c.id} cancion={c} canciones={canciones} indice={i}
              mostrarNumero mostrarAlbum animDelay={i*0.03}
              onAgregarPlaylist={() => quitar(c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Favoritos ─────────────────────────────────────────────────────
export function Favoritos() {
  const [canciones, setCanciones] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const { reproducir } = useReproductor();

  useEffect(() => {
    axios.get('/api/favoritos').then(r => setCanciones(r.data.canciones||[])).finally(()=>setCargando(false));
  }, []);

  const quitar = async (cancion) => {
    await axios.post('/api/favoritos', { cancion_id: cancion.id });
    setCanciones(p => p.filter(c => c.id !== cancion.id));
  };

  return (
    <div style={{ paddingBottom:120 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(180deg,#450af5 0%,transparent 100%)', padding:'40px 24px 24px', display:'flex', alignItems:'flex-end', gap:24 }}>
        <div style={{ width:200, height:200, borderRadius:4, background:'linear-gradient(135deg,#450af5,#8e8ee5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:80, flexShrink:0, boxShadow:'0 8px 32px rgba(0,0,0,0.6)' }}>❤️</div>
        <div>
          <p style={{ color:'#fff', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:2, marginBottom:6 }}>Playlist</p>
          <h1 style={{ fontSize:40, fontWeight:900, color:'#fff', marginBottom:8 }}>Canciones que te gustan</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:14 }}>{canciones.length} canciones</p>
        </div>
      </div>

      <div style={{ padding:'24px 24px 0' }}>
        {canciones.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <motion.button whileTap={{ scale:0.93 }} onClick={() => reproducir(canciones, 0)}
              style={{ width:56, height:56, borderRadius:'50%', background:'#1db954', border:'none', cursor:'pointer', fontSize:24, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(29,185,84,0.4)' }}
            >▶</motion.button>
          </div>
        )}

        {cargando ? (
          <div style={{ textAlign:'center', padding:40 }}>
            <div style={{ width:30, height:30, border:'3px solid #282828', borderTopColor:'#1db954', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }}/>
          </div>
        ) : canciones.length === 0 ? (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:60, marginBottom:16 }}>🤍</div>
            <p style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:8 }}>Las canciones que te gusten aparecerán aquí</p>
            <p style={{ color:'#b3b3b3', fontSize:14 }}>Guarda canciones tocando el ícono del corazón</p>
          </div>
        ) : (
          canciones.map((c,i) => (
            <TarjetaCancion key={c.id} cancion={c} canciones={canciones} indice={i}
              mostrarNumero onFavorito={quitar} esFavorito animDelay={i*0.03}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Biblioteca;