import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexto/ContextoAuth.jsx';

export default function Registro() {
  const [form,     setForm]     = useState({ nombre: '', correo: '', contrasena: '' });
  const [error,    setError]    = useState(null);
  const [cargando, setCargando] = useState(false);
  const [verPw,    setVerPw]    = useState(false);
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();

  const fuerza = form.contrasena.length === 0 ? 0 : form.contrasena.length < 5 ? 1 : form.contrasena.length < 8 ? 2 : (form.contrasena.match(/[A-Z]/) && form.contrasena.match(/[0-9]/)) ? 4 : 3;

  const enviar = async (e) => {
    e.preventDefault();
    if (form.contrasena.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setError(null); setCargando(true);
    try {
      const { data } = await axios.post('/api/auth/registrar', form);
      iniciarSesion(data.token, data.usuario);
      navegar('/onboarding');
    } catch (e) { setError(e.response?.data?.mensaje || 'Error al registrarse'); }
    finally { setCargando(false); }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 16 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 448, background: '#121212', borderRadius: 16, padding: '48px 40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>Regístrate gratis</h1>
        </div>

        <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { k: 'nombre', label: 'Nombre de perfil', type: 'text',  ph: 'Tu nombre' },
            { k: 'correo', label: 'Correo electrónico', type: 'email', ph: 'tu@correo.com' },
          ].map(({ k, label, type, ph }) => (
            <div key={k}>
              <label style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{label}</label>
              <input className="input-sp" type={type} required placeholder={ph}
                value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}

          <div>
            <label style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input className="input-sp" type={verPw ? 'text' : 'password'} required
                value={form.contrasena} onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))}
                placeholder="Mínimo 6 caracteres" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setVerPw(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#b3b3b3', fontSize: 18 }}
              >{verPw ? '🙈' : '👁'}</button>
            </div>
            {form.contrasena && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, transition: 'background .3s',
                      background: i <= fuerza ? (fuerza<=1?'#ef4444':fuerza<=2?'#f97316':fuerza<=3?'#eab308':'#1db954') : '#282828' }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#b3b3b3' }}>{['','Muy débil','Débil','Regular','Fuerte'][fuerza]}</p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: 6, padding: '10px 14px', color: '#ff6b6b', fontSize: 13 }}
              >{error}</motion.div>
            )}
          </AnimatePresence>

          <button type="submit" className="btn-sp-verde" disabled={cargando} style={{ width: '100%', padding: '14px', marginTop: 4 }}>
            {cargando ? '⏳ Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div style={{ height: 1, background: '#282828', margin: '24px 0' }} />
        <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: 14 }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>Inicia sesión</Link>
        </p>
      </motion.div>
    </div>
  );
}
