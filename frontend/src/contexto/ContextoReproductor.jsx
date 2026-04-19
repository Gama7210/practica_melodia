import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

const Ctx = createContext(null);

// Detecta si una URL o fuente es de YouTube
function esYoutube(cancion) {
  if (!cancion) return false;
  if (cancion.fuente === 'youtube') return true;
  const url = cancion.archivo_url || '';
  return url.includes('youtube.com') || url.includes('youtu.be');
}

// Extrae el ID de YouTube de una URL
function extraerYtId(cancion) {
  const url = cancion?.archivo_url || '';
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function ProveedorReproductor({ children }) {
  const [cola,           setCola]           = useState([]);
  const [indice,         setIndice]         = useState(0);
  const [play,           setPlay]           = useState(false);
  const [progreso,       setProgreso]       = useState(0);
  const [duracion,       setDuracion]       = useState(0);
  const [volumen,        setVolumen]        = useState(0.8);
  const [silencio,       setSilencio]       = useState(false);
  const [aleatorio,      setAleatorio]      = useState(false);
  const [repetir,        setRepetir]        = useState('none');
  const [verReproductor, setVerReproductor] = useState(false);
  const [cargandoAudio,  setCargandoAudio]  = useState(false);

  const audioRef = useRef(new Audio());
  const audio    = audioRef.current;
  const actual   = cola[indice] || null;
  const volRef   = useRef(volumen);
  volRef.current = volumen;

  // YouTube ID de la canción actual
  const ytId = actual ? extraerYtId(actual) : null;
  const esYT = actual ? esYoutube(actual) : false;

  // Aplicar volumen al audio HTML
  useEffect(() => {
    audio.volume = silencio ? 0 : volumen;
  }, [volumen, silencio]);

  // Cuando cambia la canción
  useEffect(() => {
    if (!actual) return;

    // Si es YouTube: pausar audio HTML y abrir vista expandida automáticamente
    if (esYT) {
      audio.pause();
      audio.src = '';
      setPlay(true); // marcar como reproduciendo para que el iframe haga autoplay
      setVerReproductor(true); // abrir vista expandida automáticamente
      setCargandoAudio(false);

      // Registrar en historial
      const id = actual.id;
      if (id && !String(id).startsWith('deezer_') && !String(id).startsWith('jamendo_')) {
        axios.post('/api/canciones/reproduccion', { cancion_id: id, duracion_escuchada: 0 }).catch(() => {});
      }
      return;
    }

    // Canción normal (MP3 local o preview Deezer)
    const url = actual.preview_url || actual.archivo_url;
    if (!url) return;

    setCargandoAudio(true);
    audio.src = url;
    audio.load();

    if (play) {
      audio.play()
        .then(() => setCargandoAudio(false))
        .catch(() => { setPlay(false); setCargandoAudio(false); });
    } else {
      setCargandoAudio(false);
    }

    const onTime     = () => setProgreso(audio.currentTime);
    const onDuration = () => setDuracion(audio.duration || 0);
    const onEnded    = () => {
      if (repetir === 'one') { audio.currentTime = 0; audio.play(); return; }
      siguiente();
    };
    const onCanPlay  = () => setCargandoAudio(false);
    const onWaiting  = () => setCargandoAudio(true);

    audio.addEventListener('timeupdate',     onTime);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('ended',          onEnded);
    audio.addEventListener('canplay',        onCanPlay);
    audio.addEventListener('waiting',        onWaiting);

    const id = actual.id;
    if (id && !String(id).startsWith('deezer_') && !String(id).startsWith('jamendo_')) {
      axios.post('/api/canciones/reproduccion', { cancion_id: id, duracion_escuchada: 0 }).catch(() => {});
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title:  actual.titulo || '',
        artist: actual.artista || actual.nombre_artista || '',
        artwork: actual.imagen_url ? [{ src: actual.imagen_url }] : [],
      });
      navigator.mediaSession.setActionHandler('nexttrack',     () => siguiente());
      navigator.mediaSession.setActionHandler('previoustrack', () => anterior());
      navigator.mediaSession.setActionHandler('play',  () => { audio.play(); setPlay(true); });
      navigator.mediaSession.setActionHandler('pause', () => { audio.pause(); setPlay(false); });
    }

    return () => {
      audio.removeEventListener('timeupdate',     onTime);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('ended',          onEnded);
      audio.removeEventListener('canplay',        onCanPlay);
      audio.removeEventListener('waiting',        onWaiting);
    };
  }, [actual?.id, actual?.archivo_url, actual?.preview_url]);

  const reproducir = useCallback((canciones, idx = 0) => {
    setCola(canciones);
    setIndice(idx);
    setPlay(true);
    setProgreso(0);
    const c = canciones[idx];
    if (c && esYoutube(c)) {
      audio.pause();
      audio.src = '';
      setVerReproductor(true);
      return;
    }
    const url = c?.preview_url || c?.archivo_url;
    if (url) {
      audio.src = url;
      audio.load();
      audio.play().catch(() => setPlay(false));
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (esYT) {
      // Para YouTube, solo toggleamos el estado — el iframe maneja su propio play/pause
      setPlay(p => !p);
      return;
    }
    if (play) { audio.pause(); setPlay(false); }
    else       { audio.play().catch(() => {}); setPlay(true); }
  }, [play, esYT]);

  const siguiente = useCallback(() => {
    if (!cola.length) return;
    const idx = aleatorio
      ? Math.floor(Math.random() * cola.length)
      : (indice + 1) % cola.length;
    setIndice(idx);
    setProgreso(0);
    setPlay(true);
    const c = cola[idx];
    if (c && esYoutube(c)) {
      audio.pause(); audio.src = '';
      setVerReproductor(true);
      return;
    }
    const url = c?.preview_url || c?.archivo_url;
    if (url) { audio.src = url; audio.load(); audio.play().catch(() => {}); }
  }, [cola, indice, aleatorio]);

  const anterior = useCallback(() => {
    if (!cola.length) return;
    if (!esYT && progreso > 3) { audio.currentTime = 0; return; }
    const idx = indice === 0 ? cola.length - 1 : indice - 1;
    setIndice(idx);
    setProgreso(0);
    setPlay(true);
    const c = cola[idx];
    if (c && esYoutube(c)) {
      audio.pause(); audio.src = '';
      setVerReproductor(true);
      return;
    }
    const url = c?.preview_url || c?.archivo_url;
    if (url) { audio.src = url; audio.load(); audio.play().catch(() => {}); }
  }, [cola, indice, progreso, esYT]);

  const buscarPosicion = (t) => { if (!esYT) { audio.currentTime = t; setProgreso(t); } };
  const cambiarVolumen = (v) => { audio.volume = v; setVolumen(v); setSilencio(v === 0); };
  const toggleSilencio = () => { setSilencio(s => { audio.volume = s ? volRef.current : 0; return !s; }); };
  const ciclarRepetir  = () => setRepetir(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none');

  return (
    <Ctx.Provider value={{
      actual, cola, indice, play, progreso, duracion, volumen, silencio,
      aleatorio, repetir, verReproductor, cargandoAudio,
      esYT, ytId,
      reproducir, togglePlay, siguiente, anterior,
      buscarPosicion, cambiarVolumen, toggleSilencio,
      setAleatorio, ciclarRepetir, setVerReproductor,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useReproductor = () => useContext(Ctx);