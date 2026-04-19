import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export function PanelAdmin() {
  const [stats, setStats] = useState(null);
  useEffect(() => { axios.get('/api/canciones/estadisticas').then(r => setStats(r.data)).catch(console.error); }, []);
  const tarjetas = [
    { icono:'🎵', valor:stats?.canciones,     label:'Canciones',      color:'#1db954' },
    { icono:'👥', valor:stats?.usuarios,       label:'Usuarios',       color:'#7c3aed' },
    { icono:'📚', valor:stats?.playlists,      label:'Playlists',      color:'#ec4899' },
    { icono:'▶️', valor:stats?.reproducciones, label:'Reproducciones', color:'#f59e0b' },
  ];
  return (
    <div style={{ padding:'24px 24px 120px' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
        <h1 style={{ color:'#fff', fontSize:26, fontWeight:900, marginBottom:4 }}>📊 Panel de control</h1>
        <p style={{ color:'#b3b3b3', fontSize:13, marginBottom:28 }}>Gestiona tu plataforma Melodía</p>
      </motion.div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:36 }}>
        {tarjetas.map((t,i) => (
          <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.08 }}
            style={{ background:'#181818', borderRadius:10, padding:20, border:`1px solid ${t.color}20` }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:42, height:42, borderRadius:10, background:`${t.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{t.icono}</div>
              <span style={{ color:'#b3b3b3', fontSize:13 }}>{t.label}</span>
            </div>
            <p style={{ color:'#fff', fontSize:34, fontWeight:900 }}>{(t.valor||0).toLocaleString()}</p>
          </motion.div>
        ))}
      </div>
      {stats?.topCanciones?.length > 0 && (
        <div>
          <h2 style={{ color:'#fff', fontSize:20, fontWeight:800, marginBottom:14 }}>🏆 Más reproducidas</h2>
          <div style={{ background:'#181818', borderRadius:10, overflow:'hidden' }}>
            {stats.topCanciones.map((c,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 16px', borderBottom:'1px solid #282828' }}>
                <span style={{ color:i<3?'#1db954':'#b3b3b3', fontWeight:700, fontSize:16, minWidth:24 }}>#{i+1}</span>
                <div style={{ width:40, height:40, borderRadius:4, overflow:'hidden', flexShrink:0, background:'#282828' }}>
                  {c.imagen_url && <img src={c.imagen_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:'#fff', fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.titulo}</p>
                  <p style={{ color:'#b3b3b3', fontSize:12 }}>{c.artista||'—'}</p>
                </div>
                <span style={{ color:'#1db954', fontSize:13, fontWeight:600 }}>{(c.reproducciones||0).toLocaleString()} plays</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function GestionCanciones() {
  const [canciones,  setCanciones]  = useState([]);
  const [generos,    setGeneros]    = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [mostrando,  setMostrando]  = useState(false);
  const [guardando,  setGuardando]  = useState(false);
  const [buscar,     setBuscar]     = useState('');
  const [msg,        setMsg]        = useState(null);
  const [modoSubida, setModoSubida] = useState('youtube');
  const [form, setForm] = useState({ titulo:'', artista:'', genero_id:'', album:'', duracion_segundos:'', imagen_url:'', youtube_url:'' });
  const archivoRef = useRef(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const [c, g] = await Promise.all([
        axios.get('/api/canciones?buscar=' + buscar + '&limite=50'),
        axios.get('/api/generos'),
      ]);
      setCanciones(c.data.canciones || []);
      setGeneros(g.data.generos || []);
    } catch(e) { console.error(e); }
    finally { setCargando(false); }
  };
  useEffect(() => { cargar(); }, [buscar]);

  const mostrarMsg = (tipo, texto) => { setMsg({ tipo, texto }); setTimeout(() => setMsg(null), 4000); };

  const subir = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return mostrarMsg('err', 'El título es requerido');
    if (modoSubida === 'youtube' && !form.youtube_url.trim()) return mostrarMsg('err', 'Pega una URL de YouTube');
    if (modoSubida === 'mp3' && !archivoRef.current?.files[0]) return mostrarMsg('err', 'Selecciona un archivo MP3');
    setGuardando(true);
    try {
      const fd = new FormData();
      fd.append('titulo', form.titulo.trim());
      if (form.artista.trim())        fd.append('artista', form.artista.trim());
      if (form.genero_id)             fd.append('genero_id', form.genero_id);
      if (form.album.trim())          fd.append('album', form.album.trim());
      if (form.duracion_segundos)     fd.append('duracion_segundos', form.duracion_segundos);
      if (form.imagen_url.trim())     fd.append('imagen_url', form.imagen_url.trim());
      if (modoSubida === 'youtube')   fd.append('youtube_url', form.youtube_url.trim());
      if (modoSubida === 'mp3' && archivoRef.current?.files[0]) fd.append('archivo', archivoRef.current.files[0]);
      await axios.post('/api/canciones', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      mostrarMsg('ok', '✅ Canción subida correctamente');
      setForm({ titulo:'', artista:'', genero_id:'', album:'', duracion_segundos:'', imagen_url:'', youtube_url:'' });
      if (archivoRef.current) archivoRef.current.value = '';
      setMostrando(false);
      cargar();
    } catch (e) { mostrarMsg('err', e.response?.data?.mensaje || 'Error al subir'); }
    finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta canción?')) return;
    await axios.delete('/api/canciones/' + id);
    setCanciones(p => p.filter(c => c.id !== id));
    mostrarMsg('ok', 'Canción eliminada');
  };

  const fmt = (s) => s ? Math.floor(s/60) + ':' + String(s%60).padStart(2,'0') : '—';

  return (
    <div style={{ padding:'24px 24px 120px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ color:'#fff', fontSize:24, fontWeight:900 }}>🎵 Canciones</h1>
          <p style={{ color:'#b3b3b3', fontSize:13 }}>{canciones.length} en la biblioteca</p>
        </div>
        <button onClick={() => setMostrando(v => !v)} className="btn-sp-verde" style={{ padding:'10px 20px', fontSize:13 }}>
          {mostrando ? '✕ Cerrar' : '+ Subir canción'}
        </button>
      </div>

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
            style={{ marginBottom:14, padding:'10px 16px', borderRadius:8, fontSize:13, fontWeight:600,
              background: msg.tipo==='ok' ? 'rgba(29,185,84,0.1)' : 'rgba(220,38,38,0.1)',
              border: `1px solid ${msg.tipo==='ok' ? 'rgba(29,185,84,0.3)' : 'rgba(220,38,38,0.3)'}`,
              color: msg.tipo==='ok' ? '#1db954' : '#f87171',
            }}
          >{msg.texto}</motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrando && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            style={{ overflow:'hidden', marginBottom:20 }}
          >
            <div style={{ background:'#181818', borderRadius:12, padding:24, border:'1px solid #282828' }}>
              <h3 style={{ color:'#fff', fontWeight:700, marginBottom:18 }}>Subir nueva canción</h3>

              {/* Selector modo */}
              <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                {[{ id:'youtube', label:'▶ URL de YouTube' }, { id:'mp3', label:'🎵 Subir MP3' }].map(m => (
                  <button key={m.id} type="button" onClick={() => setModoSubida(m.id)}
                    style={{ padding:'9px 18px', borderRadius:500, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit',
                      background: modoSubida===m.id ? '#1db954' : '#282828',
                      color: modoSubida===m.id ? '#000' : '#b3b3b3', transition:'all .2s',
                    }}
                  >{m.label}</button>
                ))}
              </div>

              <form onSubmit={subir}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:16 }}>
                  {[
                    { k:'titulo',            label:'Título *',          type:'text',   ph:'Nombre de la canción' },
                    { k:'artista',           label:'Artista',           type:'text',   ph:'Nombre del artista' },
                    { k:'album',             label:'Álbum',             type:'text',   ph:'Nombre del álbum' },
                    { k:'duracion_segundos', label:'Duración (seg)',     type:'number', ph:'210' },
                  ].map(({ k, label, type, ph }) => (
                    <div key={k}>
                      <label style={{ display:'block', color:'#b3b3b3', fontSize:12, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</label>
                      <input className="input-sp" type={type} value={form[k]} placeholder={ph}
                        onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                    </div>
                  ))}

                  <div>
                    <label style={{ display:'block', color:'#b3b3b3', fontSize:12, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>
                      Género {generos.length === 0 && <span style={{ color:'#535353' }}>(cargando...)</span>}
                    </label>
                    <select value={form.genero_id} onChange={e => setForm(f => ({ ...f, genero_id: e.target.value }))}
                      style={{ background:'#282828', border:'1px solid transparent', color: form.genero_id ? '#fff':'#535353', borderRadius:4, padding:'14px 16px', width:'100%', fontSize:14, outline:'none', cursor:'pointer', fontFamily:'inherit' }}
                    >
                      <option value="">Sin género</option>
                      {generos.map(g => <option key={g.id} value={g.id}>{g.icono} {g.nombre}</option>)}
                    </select>
                  </div>

                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ display:'block', color:'#b3b3b3', fontSize:12, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>
                      URL de imagen (portada)
                    </label>
                    <input className="input-sp" type="text" value={form.imagen_url}
                      onChange={e => setForm(f => ({ ...f, imagen_url: e.target.value }))}
                      placeholder="https://... (opcional — YouTube usa el thumbnail automáticamente)" />
                  </div>
                </div>

                <div style={{ marginBottom:18 }}>
                  {modoSubida === 'youtube' ? (
                    <div>
                      <label style={{ display:'block', color:'#b3b3b3', fontSize:12, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>URL de YouTube *</label>
                      <input className="input-sp" type="text" value={form.youtube_url}
                        onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))}
                        placeholder="https://youtube.com/watch?v=... o https://youtu.be/..." />
                      <p style={{ color:'#535353', fontSize:11, marginTop:6 }}>💡 El thumbnail de YouTube se usa como portada automáticamente si no pones imagen.</p>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display:'block', color:'#b3b3b3', fontSize:12, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Archivo MP3 *</label>
                      <input ref={archivoRef} type="file" accept="audio/*"
                        style={{ background:'#282828', border:'1px solid #535353', color:'#b3b3b3', borderRadius:4, padding:10, width:'100%', fontSize:13, cursor:'pointer' }} />
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button type="submit" className="btn-sp-verde" disabled={guardando} style={{ padding:'10px 24px' }}>
                    {guardando ? '⏳ Subiendo...' : '⬆️ Subir canción'}
                  </button>
                  <button type="button" onClick={() => setMostrando(false)} className="btn-sp-outline" style={{ padding:'10px 18px' }}>Cancelar</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position:'relative', marginBottom:16 }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>🔍</span>
        <input className="input-sp" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar canciones..." style={{ paddingLeft:46 }} />
      </div>

      {cargando ? (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ width:30, height:30, border:'3px solid #282828', borderTopColor:'#1db954', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }} />
        </div>
      ) : (
        <div style={{ background:'#181818', borderRadius:10, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 130px 90px 60px 44px', gap:10, padding:'8px 14px', borderBottom:'1px solid #282828', color:'#b3b3b3', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>
            <span>#</span><span>Título</span><span>Género</span><span>Duración</span><span>Plays</span><span/>
          </div>
          {canciones.length === 0 ? (
            <div style={{ textAlign:'center', padding:40 }}>
              <p style={{ color:'#b3b3b3' }}>No hay canciones. Sube la primera usando el botón de arriba.</p>
            </div>
          ) : canciones.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*.02 }}
              style={{ display:'grid', gridTemplateColumns:'40px 1fr 130px 90px 60px 44px', gap:10, padding:'9px 14px', borderBottom:'1px solid #282828', alignItems:'center', transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.04)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <span style={{ color:'#b3b3b3', fontSize:13 }}>{i+1}</span>
              <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                <div style={{ width:40, height:40, borderRadius:4, overflow:'hidden', flexShrink:0, background:'#282828', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                  {c.imagen_url
                    ? <img src={c.imagen_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }}/>
                    : '🎵'
                  }
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ color:'#fff', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.titulo}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <p style={{ color:'#b3b3b3', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nombre_artista||'—'}</p>
                    <span style={{ background: c.fuente==='youtube'?'rgba(255,0,0,.2)':'rgba(29,185,84,.2)', color: c.fuente==='youtube'?'#ff6b6b':'#1db954', fontSize:9, padding:'1px 5px', borderRadius:99, fontWeight:700, flexShrink:0 }}>
                      {c.fuente==='youtube' ? 'YT' : 'MP3'}
                    </span>
                  </div>
                </div>
              </div>
              <span style={{ color:'#b3b3b3', fontSize:12 }}>{c.nombre_genero||'—'}</span>
              <span style={{ color:'#b3b3b3', fontSize:12 }}>{fmt(c.duracion_segundos)}</span>
              <span style={{ color:'#1db954', fontSize:12, fontWeight:600 }}>{(c.reproducciones||0).toLocaleString()}</span>
              <button onClick={() => eliminar(c.id)}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#535353', transition:'color .15s' }}
                onMouseEnter={e => e.target.style.color='#ef4444'} onMouseLeave={e => e.target.style.color='#535353'}
              >🗑️</button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  useEffect(() => { axios.get('/api/auth/usuarios').then(r => setUsuarios(r.data.usuarios||[])).finally(() => setCargando(false)); }, []);
  return (
    <div style={{ padding:'24px 24px 120px' }}>
      <h1 style={{ color:'#fff', fontSize:24, fontWeight:900, marginBottom:20 }}>👥 Usuarios</h1>
      {cargando ? <div style={{ textAlign:'center', padding:40 }}><div style={{ width:30, height:30, border:'3px solid #282828', borderTopColor:'#1db954', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }}/></div>
      : (
        <div style={{ background:'#181818', borderRadius:10, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 180px 80px 140px', gap:12, padding:'8px 16px', borderBottom:'1px solid #282828', color:'#b3b3b3', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>
            <span>Usuario</span><span>Correo</span><span>Rol</span><span>Registrado</span>
          </div>
          {usuarios.map((u,i) => (
            <motion.div key={u.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*.03 }}
              style={{ display:'grid', gridTemplateColumns:'1fr 180px 80px 140px', gap:12, padding:'10px 16px', borderBottom:'1px solid #282828', alignItems:'center' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.04)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'#1db954', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#000', flexShrink:0 }}>{u.nombre?.[0]?.toUpperCase()}</div>
                <p style={{ color:'#fff', fontSize:13 }} className="trunc">{u.nombre}</p>
              </div>
              <p style={{ color:'#b3b3b3', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.correo}</p>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, background:u.rol==='admin'?'rgba(29,185,84,.15)':'rgba(255,255,255,.08)', color:u.rol==='admin'?'#1db954':'#b3b3b3' }}>{u.rol}</span>
              <p style={{ color:'#b3b3b3', fontSize:12 }}>{new Date(u.creado_en).toLocaleDateString('es-MX')}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MiCuentaAdmin() {
  const [f,    setF]    = useState({ actual:'', nueva:'', confirmar:'' });
  const [ver,  setVer]  = useState({ actual:false, nueva:false, confirmar:false });
  const [load, setLoad] = useState(false);
  const [msg,  setMsg]  = useState(null);
  const fuerza = f.nueva.length===0?0:f.nueva.length<5?1:f.nueva.length<8?2:(f.nueva.match(/[A-Z]/)&&f.nueva.match(/[0-9]/))?4:3;

  const enviar = async (e) => {
    e.preventDefault();
    if (f.nueva !== f.confirmar) return setMsg({ ok:false, txt:'Las contraseñas no coinciden' });
    if (f.nueva.length < 6) return setMsg({ ok:false, txt:'Mínimo 6 caracteres' });
    setLoad(true);
    try {
      const { data } = await axios.post('/api/auth/cambiar-contrasena', { contrasenaActual:f.actual, nuevaContrasena:f.nueva });
      setMsg({ ok:true, txt: data.mensaje || '✅ Contraseña actualizada' });
      setF({ actual:'', nueva:'', confirmar:'' });
    } catch (e) { setMsg({ ok:false, txt: e.response?.data?.mensaje||'Error' }); }
    finally { setLoad(false); setTimeout(() => setMsg(null), 5000); }
  };

  return (
    <div style={{ padding:'24px 24px 120px' }}>
      <h1 style={{ color:'#fff', fontSize:24, fontWeight:900, marginBottom:4 }}>🔑 Mi cuenta</h1>
      <p style={{ color:'#b3b3b3', fontSize:14, marginBottom:28 }}>Cambia tu contraseña de administrador</p>
      <div style={{ maxWidth:460 }}>
        <div style={{ background:'#181818', borderRadius:12, padding:28, border:'1px solid #282828' }}>
          <h2 style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:20 }}>Cambiar contraseña</h2>
          <AnimatePresence>
            {msg && (
              <motion.div initial={{ opacity:0,y:-6 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
                style={{ marginBottom:16, padding:'12px 16px', borderRadius:8, fontSize:13, fontWeight:600,
                  background:msg.ok?'rgba(29,185,84,0.1)':'rgba(220,38,38,0.1)',
                  border:`1px solid ${msg.ok?'rgba(29,185,84,0.3)':'rgba(220,38,38,0.3)'}`,
                  color:msg.ok?'#1db954':'#f87171',
                }}
              >{msg.txt}</motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={enviar} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[{ k:'actual', label:'Contraseña actual' }, { k:'nueva', label:'Nueva contraseña' }, { k:'confirmar', label:'Confirmar nueva' }].map(({ k, label }) => (
              <div key={k}>
                <label style={{ display:'block', color:'#fff', fontSize:14, fontWeight:700, marginBottom:8 }}>{label}</label>
                <div style={{ position:'relative' }}>
                  <input className="input-sp" type={ver[k]?'text':'password'} required value={f[k]}
                    onChange={e => setF(p => ({ ...p, [k]: e.target.value }))} placeholder="••••••••" style={{ paddingRight:44 }} />
                  <button type="button" onClick={() => setVer(v => ({ ...v, [k]:!v[k] }))}
                    style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#b3b3b3', fontSize:18 }}
                  >{ver[k]?'🙈':'👁'}</button>
                </div>
                {k==='nueva' && f.nueva && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                      {[1,2,3,4].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, transition:'background .3s', background:i<=fuerza?(fuerza<=1?'#ef4444':fuerza<=2?'#f97316':fuerza<=3?'#eab308':'#1db954'):'#282828' }}/>)}
                    </div>
                    <p style={{ fontSize:11, color:'#b3b3b3' }}>{['','Muy débil','Débil','Regular','Fuerte'][fuerza]}</p>
                  </div>
                )}
                {k==='confirmar' && f.confirmar && f.nueva!==f.confirmar && <p style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>Las contraseñas no coinciden</p>}
              </div>
            ))}
            <button type="submit" className="btn-sp-verde" disabled={load||(f.confirmar&&f.nueva!==f.confirmar)} style={{ width:'100%', padding:'14px', marginTop:8 }}>
              {load ? '⏳ Cambiando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
