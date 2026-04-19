import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth.jsx';
import Reproductor from './Reproductor.jsx';

const navCliente = [
  { a:'/',           icon:'🏠', label:'Inicio'    },
  { a:'/buscar',     icon:'🔍', label:'Buscar'     },
  { a:'/biblioteca', icon:'📚', label:'Biblioteca' },
  { a:'/favoritos',  icon:'❤️', label:'Me gusta'  },
];

const navAdmin = [
  { a:'/admin',           icon:'📊', label:'Panel'     },
  { a:'/admin/canciones', icon:'🎵', label:'Canciones' },
  { a:'/admin/usuarios',  icon:'👥', label:'Usuarios'  },
  { a:'/admin/cuenta',    icon:'🔑', label:'Cuenta'    },
];

// Altura de la nav inferior en móvil
const NAV_H   = 56; // nav inferior
const REPR_H  = 64; // barra reproductor

export default function Plantilla({ esAdmin = false }) {
  const { usuario, cerrarSesion } = useAuth();
  const navegar  = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const enlaces = esAdmin ? navAdmin : navCliente;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#000', overflow:'hidden' }}>

      {/* ── CUERPO (sidebar + contenido) ── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        {/* SIDEBAR — solo desktop */}
        {!isMobile && (
          <aside style={{ width:240, flexShrink:0, background:'#000', display:'flex', flexDirection:'column', padding:'0 0 8px', overflowY:'auto' }}>
            <div style={{ padding:'24px 24px 8px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:26 }}>🎵</span>
              <span style={{ fontSize:18, fontWeight:900, color:'#fff' }}>Melodía</span>
            </div>
            <div style={{ background:'#121212', borderRadius:10, margin:'8px', padding:'8px 0', marginBottom:4 }}>
              {enlaces.map(({ a, icon, label }) => (
                <NavLink key={a} to={a} end={a==='/'||a==='/admin'}
                  style={({ isActive }) => ({
                    display:'flex', alignItems:'center', gap:14,
                    padding:'10px 16px', borderRadius:6, margin:'2px 8px',
                    textDecoration:'none', transition:'all 0.15s',
                    color: isActive ? '#fff' : '#b3b3b3',
                    fontWeight: isActive ? 700 : 500, fontSize:14,
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  })}
                >
                  <span style={{ fontSize:18 }}>{icon}</span>{label}
                </NavLink>
              ))}
            </div>
            {!esAdmin && (
              <div style={{ background:'#121212', borderRadius:10, margin:'0 8px 4px', flex:1, padding:'12px 0', overflowY:'auto' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 16px 10px' }}>
                  <span style={{ color:'#b3b3b3', fontSize:13, fontWeight:700 }}>📚 Tu biblioteca</span>
                  <button onClick={() => navegar('/biblioteca')} style={{ background:'none', border:'none', cursor:'pointer', color:'#b3b3b3', fontSize:22 }}>+</button>
                </div>
                <NavLink to="/favoritos"
                  style={({ isActive }) => ({ display:'flex', alignItems:'center', gap:12, padding:'8px 16px', textDecoration:'none', borderRadius:6, margin:'2px 8px', background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent' })}
                >
                  <div style={{ width:40, height:40, borderRadius:6, background:'linear-gradient(135deg,#450af5,#8e8ee5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>❤️</div>
                  <div>
                    <p style={{ color:'#fff', fontSize:13, fontWeight:500 }}>Canciones que te gustan</p>
                    <p style={{ color:'#b3b3b3', fontSize:11 }}>Playlist</p>
                  </div>
                </NavLink>
              </div>
            )}
            <div style={{ padding:'12px 16px', margin:'0 8px', borderRadius:10, background:'#121212' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'#535353', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#fff', flexShrink:0 }}>
                  {usuario?.nombre?.[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth:0, flex:1 }}>
                  <p style={{ color:'#fff', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{usuario?.nombre}</p>
                  <p style={{ color:'#b3b3b3', fontSize:11 }}>{usuario?.rol === 'admin' ? '👑 Admin' : 'Premium'}</p>
                </div>
              </div>
              {usuario?.rol === 'admin' && !esAdmin && (
                <button onClick={() => navegar('/admin')}
                  style={{ width:'100%', padding:'7px', borderRadius:6, background:'rgba(29,185,84,0.15)', border:'1px solid rgba(29,185,84,0.3)', color:'#1db954', fontSize:12, fontWeight:600, cursor:'pointer', marginBottom:6, fontFamily:'inherit' }}>
                  ⚙️ Panel Admin
                </button>
              )}
              {esAdmin && (
                <button onClick={() => navegar('/')}
                  style={{ width:'100%', padding:'7px', borderRadius:6, background:'rgba(255,255,255,0.08)', border:'1px solid #282828', color:'#b3b3b3', fontSize:12, cursor:'pointer', marginBottom:6, fontFamily:'inherit' }}>
                  🎵 Vista cliente
                </button>
              )}
              <button onClick={cerrarSesion}
                style={{ width:'100%', padding:'7px', borderRadius:6, background:'transparent', border:'1px solid #282828', color:'#b3b3b3', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                Cerrar sesión
              </button>
            </div>
          </aside>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <main style={{
          flex:1, overflowY:'auto', background:'#121212',
          borderRadius: isMobile ? 0 : '10px 10px 0 0',
          margin: isMobile ? 0 : '8px 8px 0 0',
          // Espacio para reproductor + nav inferior en móvil
          paddingBottom: isMobile ? REPR_H + NAV_H + 16 : 0,
        }}>
          <Outlet />
        </main>
      </div>

      {/* ── REPRODUCTOR (desktop: en el flujo normal) ── */}
      {!isMobile && <Reproductor />}

      {/* ── MÓVIL: reproductor + nav fijos en la parte inferior ── */}
      {isMobile && (
        <>
          {/* Reproductor fijo encima de la nav */}
          <div style={{
            position: 'fixed',
            bottom: NAV_H,   // justo encima de la nav
            left: 0, right: 0,
            zIndex: 300,     // más alto que la nav (200)
          }}>
            <Reproductor />
          </div>

          {/* Nav inferior */}
          <nav style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            background: '#000',
            borderTop: '1px solid #282828',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 200,
            height: NAV_H,
            paddingBottom: 'env(safe-area-inset-bottom, 4px)',
          }}>
            {enlaces.slice(0, 4).map(({ a, icon, label }) => (
              <NavLink key={a} to={a} end={a==='/'||a==='/admin'}
                style={({ isActive }) => ({
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 2,
                  textDecoration: 'none', padding: '4px 10px',
                  color: isActive ? '#1db954' : '#727272',
                  fontSize: 10, fontWeight: 600,
                  minWidth: 52, transition: 'color .15s',
                })}
              >
                <span style={{ fontSize: 22 }}>{icon}</span>
                {label}
              </NavLink>
            ))}
            <button onClick={cerrarSesion}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, background:'none', border:'none', cursor:'pointer', color:'#727272', fontSize:10, fontWeight:600, padding:'4px 10px', minWidth:52, fontFamily:'inherit' }}>
              <span style={{ fontSize:22 }}>🚪</span>
              Salir
            </button>
          </nav>
        </>
      )}
    </div>
  );
}