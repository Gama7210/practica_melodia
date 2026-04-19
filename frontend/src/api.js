import axios from 'axios';

// ⚠️ Cambia esta IP por la tuya: CMD → ipconfig → Dirección IPv4
const IP_SERVIDOR = '192.168.1.100';
const PUERTO      = 4000;

// Detectar si estamos corriendo como app nativa (Capacitor)
// En Capacitor la URL es capacitor:// o http://localhost (no el dev server)
const esNativa = typeof window !== 'undefined' && (
  window.location.protocol === 'capacitor:' ||
  (window.location.protocol === 'http:' && window.location.port === '')
);

if (esNativa) {
  axios.defaults.baseURL = `http://${IP_SERVIDOR}:${PUERTO}`;
}
// En web (dev) el proxy de Vite maneja /api → localhost:4000

// Restaurar token guardado
const token = localStorage.getItem('mel_token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default axios;