import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const Ctx = createContext(null);

export function ProveedorAuth({ children }) {
  const [usuario,  setUsuario]  = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('melodia_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/perfil')
        .then(r => setUsuario(r.data.usuario))
        .catch(() => { localStorage.removeItem('melodia_token'); delete axios.defaults.headers.common['Authorization']; })
        .finally(() => setCargando(false));
    } else { setCargando(false); }
  }, []);

  const iniciarSesion = (token, datos) => {
    localStorage.setItem('melodia_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUsuario(datos);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('melodia_token');
    delete axios.defaults.headers.common['Authorization'];
    setUsuario(null);
  };

  return (
    <Ctx.Provider value={{ usuario, setUsuario, iniciarSesion, cerrarSesion, cargando }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
