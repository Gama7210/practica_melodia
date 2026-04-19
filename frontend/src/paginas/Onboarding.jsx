import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexto/ContextoAuth.jsx';

export default function Onboarding() {
  const [generos,       setGeneros]       = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [guardando,     setGuardando]     = useState(false);
  const { usuario } = useAuth();
  const navegar = useNavigate();

  useEffect(() => {
    axios.get('/api/generos').then(r => setGeneros(r.data.generos || []));
  }, []);

  const toggle = (id) =>
    setSeleccionados(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const continuar = async () => {
    setGuardando(true);
    try { await axios.post('/api/gustos', { generos: seleccionados }); } catch {}
    navegar('/');
  };

  return (
    /* 
      Clave del fix:
      - overflowY: 'auto' permite scroll
      - NO usamos alignItems: center en el contenedor externo
      - El contenido se centra con margin: '0 auto'
    */
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg,#1a1a2e 0%,#121212 100%)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      padding: '24px 16px 48px',
    }}>
      <motion.div
        initial={{ opacity:0, scale:0.96 }}
        animate={{ opacity:1, scale:1 }}
        style={{ width:'100%', maxWidth:640, margin:'0 auto', textAlign:'center' }}
      >
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <div style={{ fontSize:56, marginBottom:16, paddingTop:16 }}>🎧</div>
          <h1 style={{ fontSize:28, fontWeight:900, color:'#fff', marginBottom:8, lineHeight:1.2 }}>
            Elige tus géneros favoritos
          </h1>
          <p style={{ color:'#b3b3b3', fontSize:15, marginBottom:32, lineHeight:1.5 }}>
            Hola <strong style={{ color:'#fff' }}>{usuario?.nombre?.split(' ')[0]}</strong>,
            selecciona los géneros que más disfrutas
          </p>
        </motion.div>

        {/* Grid de géneros — scrolleable */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 32,
        }}>
          {generos.map((g, i) => {
            const activo = seleccionados.includes(g.id);
            return (
              <motion.button key={g.id}
                initial={{ opacity:0, scale:0.8 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale:0.95 }}
                onClick={() => toggle(g.id)}
                style={{
                  padding: '20px 12px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  background: activo ? (g.color || '#1db954') : '#282828',
                  boxShadow: activo ? `0 4px 20px ${g.color || '#1db954'}50` : 'none',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ fontSize:32, marginBottom:8 }}>{g.icono || '🎵'}</div>
                <p style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{g.nombre}</p>
                <AnimatePresence>
                  {activo && (
                    <motion.div
                      initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
                      style={{
                        position:'absolute', top:8, right:8,
                        width:22, height:22, borderRadius:'50%',
                        background:'rgba(0,0,0,0.5)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, color:'#fff', fontWeight:700,
                      }}
                    >✓</motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {seleccionados.length > 0 && (
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ color:'#b3b3b3', fontSize:14, marginBottom:16 }}
            >
              {seleccionados.length} género{seleccionados.length !== 1 ? 's' : ''} seleccionado{seleccionados.length !== 1 ? 's' : ''}
            </motion.p>
          )}
        </AnimatePresence>

        <button className="btn-sp-verde" onClick={continuar}
          disabled={seleccionados.length === 0 || guardando}
          style={{ padding:'14px 48px', fontSize:16, opacity: seleccionados.length===0 ? 0.4 : 1, width:'100%', maxWidth:320 }}
        >
          {guardando ? '⏳ Guardando...' : 'Empezar a escuchar →'}
        </button>

        <button onClick={() => navegar('/')}
          style={{ display:'block', margin:'16px auto 0', background:'none', border:'none', color:'#535353', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}
        >
          Saltar por ahora
        </button>
      </motion.div>
    </div>
  );
}