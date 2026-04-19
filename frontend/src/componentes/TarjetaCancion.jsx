import { useState } from 'react';
import { motion } from 'framer-motion';
import { useReproductor } from '../contexto/ContextoReproductor.jsx';
import ModalAgregarPlaylist from './ModalAgregarPlaylist.jsx';

const fmt = (s) => {
  if (!s) return '';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

export default function TarjetaCancion({
  cancion, canciones = [], indice = 0,
  mostrarNumero = false, mostrarAlbum = false,
  onFavorito, esFavorito = false,
  animDelay = 0,
}) {
  const { reproducir, actual, play } = useReproductor();
  const [hover, setHover]       = useState(false);
  const [menuPlaylist, setMenuPlaylist] = useState(false);

  const esActual = actual?.id === cancion.id ||
    (actual?.deezer_id && actual.deezer_id === cancion.deezer_id) ||
    (actual?.jamendo_id && actual.jamendo_id === cancion.jamendo_id);

  const dur = cancion.duracion || cancion.duracion_segundos;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animDelay }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="sp-fila"
        style={{
          gridTemplateColumns: mostrarNumero
            ? (mostrarAlbum ? '40px 1fr 1fr 80px' : '40px 1fr 80px')
            : (mostrarAlbum ? '1fr 1fr 80px' : '1fr 80px'),
          gap: 12,
        }}
      >
        {/* Número / Ecualiz */}
        {mostrarNumero && (
          <div style={{ width: 24, textAlign: 'center' }}>
            {hover ? (
              <motion.button whileTap={{ scale: 0.85 }}
                onClick={() => reproducir(canciones, indice)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18 }}
              >▶</motion.button>
            ) : esActual && play ? (
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'flex-end', height: 16 }}>
                {[1,2,3,4].map(i => <span key={i} className="eq-bar" style={{ animationDelay: `${i*0.1}s`, height: `${6+i*2}px` }} />)}
              </div>
            ) : (
              <span style={{ color: esActual ? '#1db954' : '#b3b3b3', fontSize: 14, fontWeight: 500 }}>{indice + 1}</span>
            )}
          </div>
        )}

        {/* Info principal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}
          onClick={() => reproducir(canciones, indice)}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {cancion.imagen_url ? (
              <img src={cancion.imagen_url} alt="" style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 4, background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
            )}
            {!mostrarNumero && (hover || (esActual && play)) && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {esActual && play && !hover
                  ? <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>{[1,2,3].map(i => <span key={i} className="eq-bar" style={{ animationDelay: `${i*0.1}s`, height: `${4+i*2}px` }} />)}</div>
                  : <span style={{ color: '#fff', fontSize: 18 }}>▶</span>
                }
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="truncar" style={{ color: esActual ? '#1db954' : '#fff', fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
              {cancion.titulo}
            </p>
            <p className="truncar" style={{ color: '#b3b3b3', fontSize: 12 }}>
              {cancion.artista || cancion.nombre_artista || '—'}
            </p>
          </div>
        </div>

        {/* Álbum */}
        {mostrarAlbum && (
          <p className="truncar" style={{ color: '#b3b3b3', fontSize: 13, cursor: 'default' }}>
            {cancion.album || cancion.nombre_album || '—'}
          </p>
        )}

        {/* Acciones + duración */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          {hover && (
            <>
              {onFavorito && (
                <motion.button whileTap={{ scale: 0.8 }}
                  onClick={e => { e.stopPropagation(); onFavorito(cancion); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: esFavorito ? '#1db954' : '#b3b3b3' }}
                  title={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >{esFavorito ? '❤️' : '🤍'}</motion.button>
              )}
              <motion.button whileTap={{ scale: 0.8 }}
                onClick={e => { e.stopPropagation(); setMenuPlaylist(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#b3b3b3' }}
                title="Agregar a playlist"
              >➕</motion.button>
            </>
          )}
          <span style={{ color: '#b3b3b3', fontSize: 13, minWidth: 36, textAlign: 'right' }}>
            {fmt(dur)}
          </span>
        </div>
      </motion.div>

      {menuPlaylist && (
        <ModalAgregarPlaylist cancion={cancion} onCerrar={() => setMenuPlaylist(false)} />
      )}
    </>
  );
}
