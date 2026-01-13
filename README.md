<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🏋️ FitGenius AI - Sistema Integral de Entrenamiento

> Plataforma web inteligente que combina gestión de gimnasios con generación automática de rutinas y dietas personalizadas usando IA.

## ✨ Características Principales

- 🤖 **Generación de Rutinas con IA**: Planes de entrenamiento semanales personalizados usando Google Gemini
- 🥗 **Planes Nutricionales Inteligentes**: Dietas adaptadas a tus objetivos con recetas detalladas
- 📊 **Gestión de Gimnasio**: Panel administrativo para gestionar miembros, equipamiento y gastos
- 👤 **Perfiles Personalizados**: Sistema completo de perfiles con objetivos, medidas y preferencias
- 📅 **Sistema de Calendario**: Visualización y seguimiento de entrenamientos
- 📱 **Responsive**: Funciona perfectamente en móviles, tablets y desktop

---

## 🚀 DEPLOYMENT - Producción en la Nube

### Stack de Producción:
- **Frontend**: Netlify (React + Vite)
- **Backend**: Railway (Node.js + Express)
- **Base de Datos**: Railway MySQL
- **IA**: Google Gemini API

### 📚 Documentación Completa de Despliegue

Hemos preparado guías detalladas para desplegar tu aplicación:

| Documento | Descripción |
|-----------|-------------|
| **[📖 DOCUMENTACION-INDEX.md](DOCUMENTACION-INDEX.md)** | Índice completo de toda la documentación |
| **[⚡ README-DESPLIEGUE.md](README-DESPLIEGUE.md)** | Inicio rápido (5 minutos) |
| **[🚂 CONFIGURACION-RAILWAY.md](CONFIGURACION-RAILWAY.md)** | Guía completa de Railway |
| **[🔑 OBTENER-API-KEY.md](OBTENER-API-KEY.md)** | Cómo obtener Gemini API Key |
| **[🔧 VARIABLES-ENTORNO.md](VARIABLES-ENTORNO.md)** | Referencia de variables |
| **[🐛 SOLUCION-RUTINAS-DIETAS.md](SOLUCION-RUTINAS-DIETAS.md)** | Solucionar problemas de IA |

### ⚡ Despliegue Rápido

```powershell
# 1. Verificar configuración local
.\TEST-SIMPLE.ps1

# 2. Desplegar (con guía interactiva)
.\DEPLOY-COMPLETO.ps1
```

---

## 💻 Desarrollo Local

### Prerequisitos:
- Node.js >= 18.0.0
- MySQL (XAMPP, MySQL Workbench, o Railway)
- API Key de Google Gemini

### 1. Instalar Dependencias

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 2. Configurar Variables de Entorno

#### Frontend (`.env` o `.env.local`)
```env
VITE_API_URL=http://localhost:3001/api
```

#### Backend (`server/.env`)
```env
GEMINI_API_KEY=tu_api_key_aqui
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fitgenius_db
```

### 3. Ejecutar en Desarrollo

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
npm run dev
```

La app estará disponible en: `http://localhost:5173`

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐ │
│  │  Auth   │  │ Perfil  │  │ Rutinas │  │  Dietas  │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬─────┘ │
│       └───────────┬┴──────────────┘──────────┘        │
└───────────────────┼───────────────────────────────────┘
                    │ REST API
┌───────────────────┼───────────────────────────────────┐
│       └───────────▼────────────┐                      │
│  ┌──────────────────────────┐  │                      │
│  │   Backend (Node.js)      │  │   Gemini AI          │
│  │  ┌──────────────────┐    │  │   ┌────────────┐    │
│  │  │ Express Routes   │    │◄─┼───┤ Google AI  │    │
│  │  └──────────────────┘    │  │   └────────────┘    │
│  │  ┌──────────────────┐    │  │                      │
│  │  │  AI Generation   │────┘  │                      │
│  │  └──────────────────┘       │                      │
│  └──────────┬───────────────────┘                      │
│             │                                          │
│   ┌─────────▼──────────┐                              │
│   │  MySQL Database    │                              │
│   │  ┌──────────────┐  │                              │
│   │  │ users        │  │                              │
│   │  │ profiles     │  │                              │
│   │  │ workout_plans│  │                              │
│   │  │ diet_plans   │  │                              │
│   │  │ gym_members  │  │                              │
│   │  └──────────────┘  │                              │
│   └────────────────────┘                              │
└──────────────────────────────────────────────────────┘
```

---

## 📦 Tecnologías Utilizadas

### Frontend:
- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Lucide React** - Iconos
- **TailwindCSS** - Estilos (opcional)

### Backend:
- **Node.js** - Runtime
- **Express** - Framework web
- **MySQL2** - Cliente de base de datos
- **@google/genai** - SDK de Gemini AI
- **PDFKit** - Generación de PDFs
- **Compression** - Optimización de respuestas

### Infraestructura:
- **Railway** - Hosting backend + MySQL
- **Netlify** - Hosting frontend
- **Google Gemini** - IA generativa

---

## 🔐 Seguridad

- ✅ Variables de entorno para credenciales sensibles
- ✅ CORS configurado correctamente
- ✅ API Key de Gemini solo en backend
- ✅ Conexiones MySQL con timeout
- ✅ Sanitización de inputs

---

## 📊 Base de Datos

### Tablas Principales:

- **users**: Autenticación de usuarios
- **user_profiles**: Perfiles con objetivos y medidas
- **workout_plans**: Planes de entrenamiento generados
- **diet_plans**: Planes nutricionales generados
- **gym_members**: Gestión de miembros del gimnasio
- **gym_equipment**: Inventario de equipamiento
- **gym_expenses**: Registro de gastos

---

## 🧪 Testing

```bash
# Verificar configuración
.\TEST-SIMPLE.ps1

# Probar backend
cd server
node server.js
# Luego visita: http://localhost:3001/api/members
```

---

## 📄 Licencia

Este proyecto es de código abierto. Consulta el archivo LICENSE para más detalles.

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Soporte

- 📚 **Documentación**: [DOCUMENTACION-INDEX.md](DOCUMENTACION-INDEX.md)
- 🐛 **Issues**: Abre un issue en GitHub
- 💬 **Preguntas**: Consulta la documentación primero

---

## ✅ Roadmap

- [x] Sistema de autenticación
- [x] Gestión de perfiles
- [x] Generación de rutinas con IA
- [x] Generación de dietas con IA
- [x] Panel administrativo de gimnasio
- [x] Sistema de calendario
- [x] Exportación a PDF
- [ ] Sistema de notificaciones
- [ ] Tracking de progreso
- [ ] Integración con wearables
- [ ] App móvil nativa

---

<div align="center">

**⭐ Si te gusta este proyecto, dale una estrella en GitHub!**

Hecho con ❤️ y ☕ por developers apasionados

</div>
