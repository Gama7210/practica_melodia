import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexto/ContextoAuth.jsx';

export default function Login() {
  const [form,     setForm]     = useState({ correo: '', contrasena: '' });
  const [error,    setError]    = useState(null);
  const [cargando, setCargando] = useState(false);
  const [verPw,    setVerPw]    = useState(false);
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();

  const enviar = async (e) => {
    e.preventDefault();
    setError(null); setCargando(true);
    try {
      const { data } = await axios.post('/api/auth/iniciar-sesion', form);
      iniciarSesion(data.token, data.usuario);
      navegar(data.usuario.rol === 'admin' ? '/admin' : '/');
    } catch (e) {
      const s = e.response?.status;
      setError(s === 401 ? 'Correo o contraseña incorrectos' : s === 429 ? 'Demasiados intentos, espera unos minutos' : e.response?.data?.mensaje || 'Error al iniciar sesión');
    } finally { setCargando(false); }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 16 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 448, background: '#121212', borderRadius: 16, padding: '48px 40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            style={{ fontSize: 52, display: 'inline-block', marginBottom: 12 }}
          >🎵</motion.div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Inicia sesión en Melodía</h1>
        </div>

        <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Correo electrónico</label>
            <input className="input-sp" type="email" required value={form.correo}
              onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} placeholder="tu@correo.com" />
          </div>
          <div>
            <label style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input className="input-sp" type={verPw ? 'text' : 'password'} required
                value={form.contrasena} onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))}
                placeholder="Contraseña" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setVerPw(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#b3b3b3', fontSize: 18 }}
              >{verPw ? '🙈' : '👁'}</button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: 6, padding: '10px 14px', color: '#ff6b6b', fontSize: 13 }}
              >{error}</motion.div>
            )}
          </AnimatePresence>

          <button type="submit" className="btn-sp-verde" disabled={cargando} style={{ width: '100%', padding: '14px', marginTop: 8 }}>
            {cargando ? '⏳ Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/recuperar" style={{ color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'underline' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div style={{ height: 1, background: '#282828', margin: '28px 0' }} />
        <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: 14 }}>
          ¿No tienes una cuenta?{' '}
          <Link to="/registro" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>Regístrate en Melodía</Link>
        </p>
      </motion.div>
    </div>
  );
}
