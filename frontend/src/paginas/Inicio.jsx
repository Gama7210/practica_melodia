import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexto/ContextoAuth.jsx';
import { useReproductor } from '../contexto/ContextoReproductor.jsx';
import TarjetaCancion from '../componentes/TarjetaCancion.jsx';
import ModalAgregarPlaylist from '../componentes/ModalAgregarPlaylist.jsx';

// Card estilo Spotify con play flotante
function CardCancion({ cancion, todas, indice }) {
  const { reproducir } = useReproductor();
  return (
    <motion.div
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: indice*0.04 }}
      className="sp-card"
      style={{ minWidth:160, maxWidth:200, flex:'0 0 160px' }}
    >
      <div style={{ position:'relative', marginBottom:12 }}>
        {cancion.imagen_url ? (
          <img src={cancion.imagen_url} alt={cancion.titulo}
            style={{ width:'100%', aspectRatio:'1', borderRadius:6, objectFit:'cover', display:'block' }} />
        ) : (
          <div style={{ width:'100%', aspectRatio:'1', borderRadius:6, background:'#333', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🎵</div>
        )}
        <motion.button className="sp-play-btn" whileTap={{ scale:0.93 }}
          onClick={e => { e.stopPropagation(); reproducir(todas, indice); }}
        >▶</motion.button>
      </div>
      <p style={{ color:'#fff', fontWeight:700, fontSize:13, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cancion.titulo}</p>
      <p style={{ color:'#b3b3b3', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {cancion.artista || cancion.nombre_artista || 'Artista desconocido'}
      </p>
    </motion.div>
  );
}

function Seccion({ titulo, canciones, cargando }) {
  const { reproducir } = useReproductor();
  if (cargando) return (
    <div style={{ marginBottom:40 }}>
      <h2 style={{ color:'#fff', fontSize:22, fontWeight:800, marginBottom:16 }}>{titulo}</h2>
      <div style={{ display:'flex', gap:16, overflowX:'auto', paddingBottom:8 }}>
        {[...Array(6)].map((_,i) => (
          <div key={i} style={{ minWidth:160, flex:'0 0 160px' }}>
            <div className="shimmer" style={{ width:'100%', aspectRatio:'1', borderRadius:6, marginBottom:12 }}/>
            <div className="shimmer" style={{ height:14, borderRadius:4, marginBottom:6 }}/>
            <div className="shimmer" style={{ height:12, borderRadius:4, width:'70%' }}/>
          </div>
        ))}
      </div>
    </div>
  );
  if (!canciones?.length) return null;
  return (
    <div style={{ marginBottom:40 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h2 style={{ color:'#fff', fontSize:22, fontWeight:800 }}>{titulo}</h2>
        <button onClick={() => reproducir(canciones, 0)}
          style={{ background:'transparent', border:'none', color:'#b3b3b3', fontSize:13, fontWeight:700, cursor:'pointer', letterSpacing:1, textTransform:'uppercase' }}
          onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='#b3b3b3'}
        >Ver todo</button>
      </div>
      <div style={{ display:'flex', gap:16, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none' }}>
        {canciones.map((c,i) => <CardCancion key={c.id||i} cancion={c} todas={canciones} indice={i} />)}
      </div>
    </div>
  );
}

export default function Inicio() {
  const { usuario } = useAuth();
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [tendencias,      setTendencias]      = useState([]);
  const [recientes,       setRecientes]       = useState([]);
  const [historial,       setHistorial]       = useState([]);
  const [cargando,        setCargando]        = useState(true);
  const [modalPlaylist,   setModalPlaylist]   = useState(null);

  const hora = new Date().getHours();
  const saludo = hora < 6 ? 'Buenas noches' : hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const [r, t, l, h] = await Promise.allSettled([
        axios.get('/api/recomendaciones'),
        axios.get('/api/canciones/tendencias'),
        axios.get('/api/canciones?limite=20'),
        axios.get('/api/historial'),
      ]);
      if (r.status === 'fulfilled') setRecomendaciones(r.value.data.canciones || []);
      if (t.status === 'fulfilled') setTendencias(t.value.data.canciones || []);
      if (l.status === 'fulfilled') setRecientes(l.value.data.canciones || []);
      if (h.status === 'fulfilled') setHistorial(h.value.data.canciones || []);
      setCargando(false);
    };
    cargar();
  }, []);

  // Accesos rápidos — últimas escuchadas
  const accesosRapidos = historial.slice(0, 6);

  return (
    <div style={{ padding:'16px 16px 120px' }}>
      {/* Saludo */}
      <motion.h1 initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
        style={{ fontSize:28, fontWeight:900, color:'#fff', marginBottom:20 }}
      >
        {saludo}, {usuario?.nombre?.split(' ')[0]} 👋
      </motion.h1>

      {/* Accesos rápidos 2x3 */}
      {accesosRapidos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:8, marginBottom:36 }}>
          {accesosRapidos.map((c, i) => {
            const { reproducir } = useReproductor ? { reproducir: () => {} } : {};
            return (
              <QuickCard key={c.id||i} cancion={c} todas={accesosRapidos} indice={i} />
            );
          })}
        </div>
      )}

      <Seccion titulo="✨ Recomendado para ti"   canciones={recomendaciones} cargando={cargando && !recomendaciones.length} />
      <Seccion titulo="🔥 Tendencias globales"    canciones={tendencias}      cargando={cargando && !tendencias.length} />
      <Seccion titulo="🎵 En tu biblioteca"       canciones={recientes}       cargando={false} />

      {/* Historial como lista */}
      {historial.length > 0 && (
        <div style={{ marginBottom:40 }}>
          <h2 style={{ color:'#fff', fontSize:22, fontWeight:800, marginBottom:8 }}>🕐 Escuchado recientemente</h2>
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
            {historial.slice(0,10).map((c, i) => (
              <TarjetaCancion key={c.id||i} cancion={c} canciones={historial} indice={i}
                mostrarNumero animDelay={i*0.03}
              />
            ))}
          </div>
        </div>
      )}

      {modalPlaylist && <ModalAgregarPlaylist cancion={modalPlaylist} onCerrar={() => setModalPlaylist(null)} />}
    </div>
  );
}

// Componente de acceso rápido inline
function QuickCard({ cancion, todas, indice }) {
  const { reproducir } = useReproductor();
  const [h, setH] = useState(false);
  return (
    <motion.div
      initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: indice*0.05 }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={() => reproducir(todas, indice)}
      style={{
        display:'flex', alignItems:'center', gap:0, borderRadius:6,
        overflow:'hidden', background: h ? '#282828' : 'rgba(255,255,255,0.07)',
        cursor:'pointer', transition:'background 0.15s', height:56,
      }}
    >
      {cancion.imagen_url ? (
        <img src={cancion.imagen_url} alt="" style={{ width:56, height:56, objectFit:'cover', flexShrink:0 }} />
      ) : (
        <div style={{ width:56, height:56, background:'#535353', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🎵</div>
      )}
      <p style={{ color:'#fff', fontWeight:700, fontSize:13, padding:'0 16px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {cancion.titulo}
      </p>
      {h && (
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
          style={{ marginLeft:'auto', marginRight:12, width:34, height:34, borderRadius:'50%', background:'#1db954', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}
        >▶</motion.div>
      )}
    </motion.div>
  );
}