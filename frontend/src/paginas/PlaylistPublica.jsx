import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useReproductor } from '../contexto/ContextoReproductor.jsx';

const fmt = (s) => s ? `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}` : '—';

export default function PlaylistPublica() {
  const { id } = useParams();
  const [playlist,  setPlaylist]  = useState(null);
  const [canciones, setCanciones] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState(null);
  const { reproducir, actual, play } = useReproductor();

  useEffect(() => {
    axios.get(`/api/publica/playlist/${id}`)
      .then(r => { setPlaylist(r.data.playlist); setCanciones(r.data.canciones||[]); })
      .catch(e => setError(e.response?.data?.mensaje || 'Playlist no encontrada o es privada'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return (
    <div style={{ minHeight:'100dvh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #282828', borderTopColor:'#1db954', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 16px' }}/>
        <p style={{ color:'#b3b3b3', fontSize:14 }}>Cargando playlist...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100dvh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:24 }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🔒</div>
        <h2 style={{ color:'#fff', fontSize:22, fontWeight:800, marginBottom:8 }}>Playlist privada</h2>
        <p style={{ color:'#b3b3b3', fontSize:14 }}>{error}</p>
      </div>
    </div>
  );

  const img = canciones.find(c => c.imagen_url)?.imagen_url;
  const durTotal = canciones.reduce((acc, c) => acc + (c.duracion_segundos||0), 0);
  const esReproduciendo = canciones.some(c => c.id === actual?.id) && play;

  return (
    <div style={{ minHeight:'100dvh', background:'#000', color:'#fff' }}>
      {/* Header */}
      <div style={{
        background: img ? 'none' : 'linear-gradient(180deg,#5038a0 0%,transparent 100%)',
        backgroundImage: img ? `linear-gradient(180deg,rgba(0,0,0,.45) 0%,#000 100%),url(${img})` : undefined,
        backgroundSize:'cover', backgroundPosition:'center',
        padding:'40px 24px 28px',
      }}>
        {/* Branding Melodía */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
          <span style={{ fontSize:24 }}>🎵</span>
          <span style={{ fontSize:18, fontWeight:900, background:'linear-gradient(135deg,#1db954,#1ed760)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Melodía</span>
        </div>

        <div style={{ display:'flex', alignItems:'flex-end', gap:24, flexWrap:'wrap' }}>
          <div style={{ width:180, height:180, borderRadius:4, overflow:'hidden', flexShrink:0, boxShadow:'0 8px 32px rgba(0,0,0,.6)' }}>
            {img
              ? <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#450af5,#8e8ee5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:64 }}>🎵</div>
            }
          </div>
          <div>
            <p style={{ color:'rgba(255,255,255,.65)', fontSize:11, textTransform:'uppercase', letterSpacing:2, fontWeight:700, marginBottom:6 }}>Playlist pública</p>
            <h1 style={{ fontSize:36, fontWeight:900, marginBottom:8 }}>{playlist.nombre}</h1>
            <p style={{ color:'rgba(255,255,255,.65)', fontSize:14 }}>
              Creada por <strong style={{ color:'#fff' }}>{playlist.autor}</strong>
              {' · '}{canciones.length} canciones
              {durTotal > 0 && ` · ${Math.floor(durTotal/60)} min`}
            </p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
        {canciones.length > 0 && (
          <motion.button whileTap={{ scale:.93 }}
            onClick={() => reproducir(canciones, 0)}
            style={{ width:56, height:56, borderRadius:'50%', background:'#1db954', border:'none', cursor:'pointer', fontSize:24, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(29,185,84,.4)' }}
          >{esReproduciendo ? '⏸' : '▶'}</motion.button>
        )}
        <p style={{ color:'#b3b3b3', fontSize:13 }}>
          {canciones.length === 0 ? 'Esta playlist está vacía' : `${canciones.length} canciones disponibles`}
        </p>
      </div>

      {/* Lista de canciones */}
      <div style={{ padding:'0 16px 120px' }}>
        {canciones.length === 0 ? (
          <div style={{ textAlign:'center', padding:48 }}>
            <p style={{ color:'#b3b3b3' }}>No hay canciones en esta playlist</p>
          </div>
        ) : (
          canciones.map((c, i) => {
            const esActual = actual?.id === c.id;
            return (
              <motion.div key={c.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.03 }}
                onClick={() => reproducir(canciones, i)}
                style={{ display:'grid', gridTemplateColumns:'40px 1fr 80px', gap:12, padding:'8px 16px', borderRadius:4, cursor:'pointer', transition:'background .12s', alignItems:'center' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.07)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <span style={{ color: esActual ? '#1db954' : '#b3b3b3', fontSize:14, textAlign:'center' }}>
                  {esActual && play ? '▶' : i + 1}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                  <div style={{ width:44, height:44, borderRadius:4, overflow:'hidden', flexShrink:0, background:'#282828' }}>
                    {c.imagen_url
                      ? <img src={c.imagen_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                      : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎵</div>
                    }
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ color: esActual ? '#1db954' : '#fff', fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{c.titulo}</p>
                    <p style={{ color:'#b3b3b3', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nombre_artista || '—'}</p>
                  </div>
                </div>
                <span style={{ color:'#b3b3b3', fontSize:13, textAlign:'right' }}>{fmt(c.duracion_segundos)}</span>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'rgba(0,0,0,.9)', backdropFilter:'blur(12px)', borderTop:'1px solid #282828', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>🎵</span>
          <div>
            <p style={{ color:'#fff', fontSize:12, fontWeight:700 }}>¿Te gusta esta música?</p>
            <p style={{ color:'#b3b3b3', fontSize:11 }}>Regístrate gratis en Melodía</p>
          </div>
        </div>
        <a href="/registro" style={{ background:'#1db954', color:'#000', padding:'10px 20px', borderRadius:500, textDecoration:'none', fontWeight:700, fontSize:13 }}>
          Crear cuenta
        </a>
      </div>
    </div>
  );
}