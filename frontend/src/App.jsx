import { Routes, Route, Navigate } from 'react-router-dom';
import { ProveedorAuth, useAuth } from './contexto/ContextoAuth.jsx';
import { ProveedorReproductor } from './contexto/ContextoReproductor.jsx';
import Login              from './paginas/Login.jsx';
import Registro           from './paginas/Registro.jsx';
import { Recuperar, Restablecer } from './paginas/RecuperarRestablecer.jsx';
import Onboarding         from './paginas/Onboarding.jsx';
import Inicio             from './paginas/Inicio.jsx';
import Buscar             from './paginas/Buscar.jsx';
import { Biblioteca, DetallePlaylist, Favoritos } from './paginas/Biblioteca.jsx';
import { PanelAdmin, GestionCanciones, GestionUsuarios, MiCuentaAdmin } from './paginas/admin/Admin.jsx';
import Plantilla          from './componentes/Plantilla.jsx';
import PlaylistPublica    from './paginas/PlaylistPublica.jsx';

function Cargando() {
  return (
    <div style={{ height:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#000', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:28 }}>
        {[1,2,3,4].map(i => <span key={i} className="eq-bar" style={{ animationDelay:`${i*0.1}s` }} />)}
      </div>
      <p style={{ color:'#b3b3b3', fontSize:14 }}>Cargando Melodía...</p>
    </div>
  );
}

function RutaPrivada({ children, soloAdmin = false }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (soloAdmin && usuario.rol !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function RutaPublica({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (usuario) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ProveedorAuth>
      <ProveedorReproductor>
        <Routes>
          {/* Públicas — sin login */}
          <Route path="/login"              element={<RutaPublica><Login /></RutaPublica>} />
          <Route path="/registro"           element={<RutaPublica><Registro /></RutaPublica>} />
          <Route path="/recuperar"          element={<RutaPublica><Recuperar /></RutaPublica>} />
          <Route path="/restablecer/:token" element={<RutaPublica><Restablecer /></RutaPublica>} />

          {/* Playlist pública — cualquiera puede ver sin login */}
          <Route path="/playlist-publica/:id" element={<PlaylistPublica />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<RutaPrivada><Onboarding /></RutaPrivada>} />

          {/* Cliente */}
          <Route path="/" element={<RutaPrivada><Plantilla /></RutaPrivada>}>
            <Route index                 element={<Inicio />} />
            <Route path="buscar"         element={<Buscar />} />
            <Route path="biblioteca"     element={<Biblioteca />} />
            <Route path="biblioteca/:id" element={<DetallePlaylist />} />
            <Route path="favoritos"      element={<Favoritos />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<RutaPrivada soloAdmin><Plantilla esAdmin /></RutaPrivada>}>
            <Route index               element={<PanelAdmin />} />
            <Route path="canciones"    element={<GestionCanciones />} />
            <Route path="usuarios"     element={<GestionUsuarios />} />
            <Route path="cuenta"       element={<MiCuentaAdmin />} />
          </Route>
        </Routes>
      </ProveedorReproductor>
    </ProveedorAuth>
  );
}