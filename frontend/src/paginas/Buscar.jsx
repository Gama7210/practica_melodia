import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import TarjetaCancion from '../componentes/TarjetaCancion.jsx';

const GENEROS = [
  { nombre:'Pop',         color:'#c13584', icono:'🎤' },
  { nombre:'Rock',        color:'#e60026', icono:'🎸' },
  { nombre:'Hip-Hop',     color:'#ba5d07', icono:'🎧' },
  { nombre:'Electrónica', color:'#0d73ec', icono:'🎛️' },
  { nombre:'Reggaeton',   color:'#006450', icono:'🔥' },
  { nombre:'Clásica',     color:'#8400e7', icono:'🎻' },
  { nombre:'Jazz',        color:'#e61e32', icono:'🎺' },
  { nombre:'R&B',         color:'#1e3264', icono:'🎙️' },
  { nombre:'Latin',       color:'#477d95', icono:'💃' },
  { nombre:'Indie',       color:'#0d73ec', icono:'🌿' },
  { nombre:'Metal',       color:'#1e3264', icono:'🤘' },
  { nombre:'Country',     color:'#8d67ab', icono:'🤠' },
];

export default function Buscar() {
  const [q,          setQ]          = useState('');
  const [resultados, setResultados] = useState([]);
  const [fuente,     setFuente]     = useState('deezer');
  const [cargando,   setCargando]   = useState(false);
  const [buscado,    setBuscado]    = useState(false);
  const timer = useRef(null);

  const buscar = useCallback(async (texto, f) => {
    if (!texto.trim()) { setResultados([]); setBuscado(false); return; }
    setCargando(true);
    try {
      let canciones = [];
      if (f === 'deezer' || f === 'todo') {
        const { data } = await axios.get(`/api/canciones/buscar/deezer?q=${encodeURIComponent(texto)}`);
        canciones = [...canciones, ...(data.canciones || [])];
      }
      if (f === 'jamendo' || f === 'todo') {
        const { data } = await axios.get(`/api/canciones/buscar/jamendo?q=${encodeURIComponent(texto)}`);
        canciones = [...canciones, ...(data.canciones || [])];
      }
      setResultados(canciones); setBuscado(true);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }, []);

  const cambiar = (e) => {
    const v = e.target.value;
    setQ(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => buscar(v, fuente), 450);
  };

  return (
    <div style={{ padding:'24px 24px 120px' }}>
      {/* Header */}
      <motion.h1 initial={{ opacity:0 }} animate={{ opacity:1 }}
        style={{ color:'#fff', fontSize:28, fontWeight:900, marginBottom:20 }}
      >Buscar</motion.h1>

      {/* Barra */}
      <div style={{ position:'relative', marginBottom:16 }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:18, pointerEvents:'none' }}>🔍</span>
        <input
          value={q} onChange={cambiar}
          placeholder="¿Qué quieres escuchar?"
          style={{
            width:'100%', paddingLeft:48, paddingRight:44, paddingTop:14, paddingBottom:14,
            background:'#fff', color:'#000', border:'none', borderRadius:500,
            fontSize:15, outline:'none', fontFamily:'inherit',
          }}
        />
        {q && (
          <button onClick={() => { setQ(''); setResultados([]); setBuscado(false); }}
            style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#727272' }}
          >✕</button>
        )}
      </div>

      {/* Fuente tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {[
          { id:'deezer',  label:'🎵 Deezer' },
          { id:'jamendo', label:'🎸 Jamendo' },
          { id:'todo',    label:'🌐 Todo' },
        ].map(f => (
          <motion.button key={f.id} whileTap={{ scale:0.95 }}
            onClick={() => { setFuente(f.id); if (q.trim()) buscar(q, f.id); }}
            style={{
              padding:'8px 16px', borderRadius:500, border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
              background: fuente === f.id ? '#fff' : '#282828',
              color: fuente === f.id ? '#000' : '#b3b3b3',
              transition:'all 0.2s',
            }}
          >{f.label}</motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {cargando ? (
          <motion.div key="load" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ textAlign:'center', padding:60 }}
          >
            <div style={{ width:36, height:36, border:'3px solid #282828', borderTopColor:'#1db954', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 14px' }}/>
            <p style={{ color:'#b3b3b3', fontSize:13 }}>Buscando en {fuente === 'todo' ? 'Deezer y Jamendo' : fuente}...</p>
          </motion.div>
        ) : buscado ? (
          <motion.div key="res" initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <p style={{ color:'#b3b3b3', fontSize:13, marginBottom:16 }}>
              {resultados.length} resultado{resultados.length!==1?'s':''} para <strong style={{ color:'#fff' }}>"{q}"</strong>
            </p>
            {resultados.length === 0 ? (
              <div style={{ textAlign:'center', padding:60 }}>
                <div style={{ fontSize:64, marginBottom:16 }}>😕</div>
                <p style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:8 }}>No encontramos resultados para "{q}"</p>
                <p style={{ color:'#b3b3b3', fontSize:14 }}>Revisa si está bien escrito o prueba con otro término.</p>
              </div>
            ) : (
              <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:8 }}>
                {resultados.map((c,i) => (
                  <TarjetaCancion key={c.id||i} cancion={c} canciones={resultados} indice={i}
                    mostrarNumero mostrarAlbum animDelay={i*0.02}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="gen" initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <h2 style={{ color:'#fff', fontSize:20, fontWeight:800, marginBottom:16 }}>Explorar categorías</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:12 }}>
              {GENEROS.map((g,i) => (
                <motion.div key={g.nombre}
                  initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.04 }}
                  whileHover={{ scale:1.04 }}
                  onClick={() => { setQ(g.nombre); buscar(g.nombre, fuente); }}
                  style={{
                    height:108, borderRadius:10, background:g.color,
                    position:'relative', overflow:'hidden', cursor:'pointer',
                    padding:16, display:'flex', alignItems:'flex-start',
                  }}
                >
                  <p style={{ color:'#fff', fontWeight:800, fontSize:16, zIndex:1, position:'relative' }}>{g.nombre}</p>
                  <span style={{ position:'absolute', bottom:-4, right:-4, fontSize:56, opacity:0.5, transform:'rotate(-15deg)' }}>{g.icono}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
