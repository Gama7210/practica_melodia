import axios from 'axios';

// Detectar entorno
const esCapacitor = typeof window !== 'undefined' && (
  window.location.protocol === 'capacitor:' ||
  (window.location.protocol === 'http:' && window.location.port === '')
);

// En Capacitor usa IP local, en web usa el backend de Render
const BACKEND_URL = esCapacitor
  ? 'http://192.168.100.17:4000'
  : 'https://practica-melodia.onrender.com';

axios.defaults.baseURL = BACKEND_URL;

const token = localStorage.getItem('mel_token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default axios;