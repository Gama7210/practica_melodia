import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './api.js';
import './index.css';

async function iniciarApp() {
  // Inicializar plugins de Capacitor solo en móvil
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    // Hace que la web se dibuje DETRÁS de la barra de estado del sistema
    // El contenido se posiciona con safe-area-inset-top en CSS
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#00000000' }); // transparente
  } catch {
    // No estamos en móvil nativo, ignorar
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch {
    // ignorar en web
  }

  ReactDOM.createRoot(document.getElementById('raiz')).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

iniciarApp();