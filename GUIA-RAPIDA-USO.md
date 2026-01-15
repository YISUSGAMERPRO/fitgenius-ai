# 🎯 FITGENIUS AI - GUÍA DE USO RÁPIDA

## ✨ La App Está Lista

FitGenius AI está completamente funcional y desplegada en producción. Aquí está todo lo que necesitas saber:

---

## 🌐 URLs de Acceso

### Frontend
👉 **https://ubiquitous-phoenix-9851dd.netlify.app**

### Backend API
👉 **https://fitgenius-ai-production.up.railway.app**

---

## 🚀 Flujo de Uso

### 1. **Registro**
- Abre la app
- Haz clic en "Sign Up"
- Ingresa email y contraseña
- ✅ Te registras como nuevo usuario

### 2. **Configuración del Perfil**
- Completa tu información:
  - Edad, peso, altura
  - Objetivo de fitness (ganancia muscular, pérdida de peso, etc.)
  - Nivel de fitness (principiante, intermedio, avanzado)
  - Días disponibles para entrenar (3-6 días/semana)
  - Equipamiento disponible (mancuernas, barras, máquinas, etc.)
- Haz clic en "Save Profile"
- ✅ Los datos se guardan automáticamente

### 3. **Generar Rutina Personalizada**
- Ve a la sección "Workouts"
- Haz clic en "Generate Workout"
- La IA (Gemini) genera automáticamente:
  - Rutina de 4-6 días
  - 6-12 ejercicios por día
  - Series, repeticiones y descanso
  - Enfocado en tu objetivo personal
- ✅ Se guarda automáticamente en la base de datos

### 4. **Generar Plan de Dieta**
- Ve a la sección "Diet"
- Haz clic en "Generate Diet Plan"
- La IA genera:
  - 7 días de comidas únicas
  - Desayuno, almuerzo, cena, snacks
  - Macros personalizados (proteína, carbos, grasas)
  - Calorías adaptadas a tu objetivo
- ✅ Se guarda automáticamente

### 5. **Seguimiento Diario**
- Abre el "Calendar"
- Marca los días que completaste el entrenamiento
- ¡Celebración animada al completar un día!
- Sigue tu progreso visual

### 6. **Funciones Avanzadas**

#### Intercambiar Ejercicios
- Si no te gusta un ejercicio
- Haz clic en "Swap Exercise"
- La IA sugiere alternativas con el mismo beneficio
- Mantiene la efectividad del entrenamiento

#### Intercambiar Comidas
- Si no quieres comer algo específico
- Haz clic en "Swap Meal"
- La IA sugiere platillos con macros similares
- Mantiene tu balance nutricional

#### Asistente Médico (Dr. FitGenius)
- Haz clic en "Medical Assistant"
- Haz preguntas sobre fitness y salud
- La IA responde basada en tu perfil
- Ej: "¿Cuándo debo descansar?", "¿Qué comer post-workout?"

---

## ⚙️ Características Principales

### Generación Inteligente
- Rutinas basadas en ciencia del entrenamiento
- Dietas con macros personalizados
- Progresión adaptativa

### Seguimiento
- Tracking diario visual
- Historial de sesiones
- Progreso en tiempo real

### Inteligencia Artificial
- Gemini 2.0 Flash
- Personalizaciones únicas para cada usuario
- Recomendaciones adaptativas

### Datos Seguros
- Base de datos PostgreSQL en Neon
- Encriptación SSL/TLS
- Datos persistentes en la nube

### Disponibilidad
- Funciona en web (escritorio y móvil)
- Modo offline (localStorage)
- Sincronización automática online

---

## 📱 Responsive Design

La app funciona perfectamente en:
- 💻 Desktop (navegadores modernos)
- 📱 Tablet (iPad, etc.)
- 📲 Móvil (iPhone, Android)

---

## 🎨 Componentes de la App

1. **Landing Page** - Introducción y características
2. **Auth** - Registro e inicio de sesión
3. **Profile Setup** - Configuración personal
4. **Workout View** - Generación y tracking de rutinas
5. **Diet View** - Planes de alimentación
6. **Calendar** - Progreso diario visual
7. **Medical Assistant** - Asistencia de IA en salud
8. **Admin Panel** - Gestión de miembros (premium)

---

## 🔧 API Endpoints (Para desarrolladores)

### Autenticación
```bash
POST /api/register
POST /api/login
```

### Perfiles
```bash
GET /api/profile/:userId
POST /api/profile
```

### Generación
```bash
POST /api/generate-workout
POST /api/generate-diet
```

### Guardado
```bash
POST /api/save-workout
POST /api/save-diet
```

### Recuperación
```bash
GET /api/workout/:userId
GET /api/diet/:userId
GET /api/sessions/:userId
```

### Funciones Avanzadas
```bash
POST /api/swap-exercise
POST /api/swap-meal
POST /api/medical-assistant
```

---

## ❓ FAQ

### ¿Dónde se guardan mis datos?
✅ En base de datos PostgreSQL en Neon (nube segura)

### ¿Funciona sin internet?
✅ Sí, usa localStorage. Se sincroniza cuando vuelvas online.

### ¿Puedo cambiar mi rutina después?
✅ Sí, puedes hacer swap de ejercicios o generar una nueva.

### ¿La IA entiende mis objetivos?
✅ Sí, Gemini personaliza basándose en tu perfil.

### ¿Cuánto tarda la generación?
⏱️ ~10-20 segundos (espera normal para IA)

### ¿Es gratis?
✅ Sí, versión completa y funcional.

---

## 🐛 Soporte

Si encuentras problemas:
1. Recarga la página (Ctrl+Shift+R)
2. Limpia localStorage (F12 → Application → Clear)
3. Intenta nuevamente

Si persiste:
- Revisa la consola (F12) para ver errores
- Abre un issue en GitHub

---

## 🚀 Estado de Producción

✅ Backend activo  
✅ Base de datos conectada  
✅ IA funcionando  
✅ Frontend desplegado  
✅ Todos los endpoints operativos  

**Status: 🟢 LISTO PARA USAR**

---

¡Disfruta tu viaje de fitness con FitGenius AI! 💪

*Última actualización: 15 de enero de 2026*
