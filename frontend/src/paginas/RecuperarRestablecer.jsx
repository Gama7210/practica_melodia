import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export function Recuperar() {
  const [correo,   setCorreo]   = useState('');
  const [enviado,  setEnviado]  = useState(false);
  const [error,    setError]    = useState(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null); setCargando(true);
    try { await axios.post('/api/auth/recuperar', { correo }); setEnviado(true); }
    catch { setError('Error al enviar correo'); }
    finally { setCargando(false); }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 16 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 420, background: '#121212', borderRadius: 16, padding: '48px 40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Recuperar contraseña</h1>
          <p style={{ color: '#b3b3b3', fontSize: 14, marginTop: 8 }}>
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {enviado ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
            <p style={{ color: '#1db954', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>¡Correo enviado!</p>
            <p style={{ color: '#b3b3b3', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Revisa tu bandeja de entrada en <strong style={{ color: '#fff' }}>{correo}</strong> y sigue las instrucciones.
            </p>
            <Link to="/login" className="btn-sp-verde" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 32px' }}>
              Volver al login
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                Correo electrónico
              </label>
              <input className="input-sp" type="email" required value={correo}
                onChange={e => setCorreo(e.target.value)} placeholder="tu@correo.com" />
            </div>
            {error && <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>}
            <button type="submit" className="btn-sp-verde" disabled={cargando} style={{ width: '100%', padding: '14px' }}>
              {cargando ? '⏳ Enviando...' : 'Enviar enlace de recuperación'}
            </button>
            <Link to="/login" style={{ textAlign: 'center', color: '#b3b3b3', fontSize: 14, textDecoration: 'none' }}>
              ← Volver al login
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export function Restablecer() {
  const { token } = useParams();
  const navegar = useNavigate();
  const [form,     setForm]     = useState({ nueva: '', confirmar: '' });
  const [error,    setError]    = useState(null);
  const [exito,    setExito]    = useState(false);
  const [cargando, setCargando] = useState(false);
  const [verPw,    setVerPw]    = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (form.nueva !== form.confirmar) return setError('Las contraseñas no coinciden');
    if (form.nueva.length < 6) return setError('Mínimo 6 caracteres');
    setError(null); setCargando(true);
    try {
      await axios.post('/api/auth/restablecer', { token, nuevaContrasena: form.nueva });
      setExito(true);
      setTimeout(() => navegar('/login'), 3000);
    } catch (e) { setError(e.response?.data?.mensaje || 'Token inválido o expirado'); }
    finally { setCargando(false); }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 16 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 420, background: '#121212', borderRadius: 16, padding: '48px 40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Nueva contraseña</h1>
        </div>

        {exito ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <p style={{ color: '#1db954', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>¡Contraseña actualizada!</p>
            <p style={{ color: '#b3b3b3', fontSize: 14 }}>Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { k: 'nueva',     label: 'Nueva contraseña' },
              { k: 'confirmar', label: 'Confirmar contraseña' },
            ].map(({ k, label }) => (
              <div key={k}>
                <label style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-sp" type={verPw ? 'text' : 'password'} required
                    value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    placeholder="••••••••" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setVerPw(v => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#b3b3b3', fontSize: 18 }}
                  >{verPw ? '🙈' : '👁'}</button>
                </div>
              </div>
            ))}
            {form.confirmar && form.nueva !== form.confirmar && (
              <p style={{ color: '#ef4444', fontSize: 12 }}>Las contraseñas no coinciden</p>
            )}
            {error && <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>}
            <button type="submit" className="btn-sp-verde" disabled={cargando} style={{ width: '100%', padding: '14px' }}>
              {cargando ? '⏳ Guardando...' : 'Guardar nueva contraseña'}
            </button>
            <Link to="/login" style={{ textAlign: 'center', color: '#b3b3b3', fontSize: 14, textDecoration: 'none' }}>← Volver al login</Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default Recuperar;
