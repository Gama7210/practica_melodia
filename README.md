# 🎵 Melodía App

Plataforma de streaming musical full stack inspirada en Spotify. Incluye aplicación web y app móvil Android.

## 🌐 Liga de la Aplicación Web
👉 **https://practica-melodia-k8hn.vercel.app**

## 📱 Descargar App Móvil (APK)
El APK se encuentra en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 📁 Repositorio
👉 **https://github.com/Gama7210/practica_melodia**

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + Framer Motion |
| Backend | Node.js + Express |
| Base de Datos | MySQL |
| App Móvil | Capacitor 6 (Android) |
| Deploy Frontend | Vercel |
| Deploy Backend | Render.com |
| BD en la Nube | Clever Cloud |

---

## ✨ Funcionalidades

- 🔐 Autenticación con JWT (registro, login, recuperar contraseña)
- 🎵 Reproductor completo (play, pausa, siguiente, anterior, shuffle, repeat)
- 🔍 Búsqueda de canciones vía API de Deezer
- 📋 Playlists personales (crear, editar, eliminar, compartir)
- ❤️ Sistema de favoritos con animación de partículas
- 📝 Letra de canciones automática (lyrics.ovh)
- 🔗 Compartir playlists públicamente sin necesidad de cuenta
- 🎛️ Panel de administración (subir canciones MP3 o YouTube)
- 📱 App móvil Android con reproductor expandido táctil
- 🌙 Diseño oscuro estilo Spotify

---

## 🚀 Instalación Local

### Requisitos
- Node.js 18+
- MySQL

### Backend
```bash
cd backend
npm install
# Configura .env con tus credenciales de BD
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### App Móvil
```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

---

## 🔑 Credenciales de Prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Admin | admin@melodia.com | password |
| Cliente | Regístrate en la app | — |

---

## 👨‍💻 Autor

**Edgar Gamino**  
