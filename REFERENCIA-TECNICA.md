# 🏗️ FITGENIUS AI - REFERENCIA TÉCNICA COMPLETA

## 📦 Estructura de Archivos

```
fitgenius-ai/
├── 📁 server/                          # Backend Node.js
│   ├── server.js                       # Main server (3000+ líneas, todos endpoints)
│   ├── init-db.sql                    # Migraciones de BD
│   ├── package.json
│   └── Procfile                       # Config para Railway
│
├── 📁 components/                      # Componentes React
│   ├── LandingPage.tsx                # Página de inicio
│   ├── UserAuth.tsx                   # Registro/Login
│   ├── ProfileSetup.tsx               # Configuración de perfil
│   ├── WorkoutView.tsx                # Generación y tracking de rutinas
│   ├── DietView.tsx                   # Planes de dieta
│   ├── CalendarView.tsx               # Tracking diario (con API fallback)
│   ├── MedicalAssistantView.tsx       # Asistente de IA
│   └── GymAdminView.tsx               # Panel de administrador
│
├── 📁 services/                        # API client
│   └── api.ts                         # Funciones para llamar endpoints
│
├── 📁 netlify/
│   └── 📁 functions/
│       ├── generate-workout.ts        # Backup function (opcional)
│       └── generate-diet.ts           # Backup function (opcional)
│
├── 📁 public/                          # Assets estáticos
│
├── App.tsx                             # Root component
├── index.tsx                           # Entry point React
├── vite.config.ts                      # Config de Vite
├── netlify.toml                        # Config de Netlify
├── tailwind.config.js                  # Estilos TailwindCSS
└── tsconfig.json                       # TypeScript config
```

---

## 🔌 API Endpoints - REFERENCIA COMPLETA

### **1. Autenticación**

#### `POST /api/register`
```javascript
// Request
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

// Response (201)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "success": true
}

// Error (400)
{
  "error": "Email already exists"
}
```

#### `POST /api/login`
```javascript
// Request
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

// Response (200)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "token": "jwt_token_here"
}

// Auto-creates session in user_sessions table
```

---

### **2. Perfiles**

#### `GET /api/profile/:userId`
```javascript
// Response (200)
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "age": 28,
  "weight": 75,
  "height": 180,
  "goal": "muscle_gain",
  "fitnessLevel": "intermediate",
  "availableDays": 4,
  "preferences": ["strength", "compound"],
  "medicalHistory": ""
}
```

#### `POST /api/profile`
```javascript
// Request
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "age": 28,
  "weight": 75,
  "height": 180,
  "goal": "muscle_gain",
  "fitnessLevel": "intermediate",
  "availableDays": 4,
  "preferences": ["strength", "compound"],
  "medicalHistory": "Ningún historial relevante"
}

// Response (200)
{
  "success": true,
  "profile": { ...profile object... }
}
```

---

### **3. Generación con IA**

#### `POST /api/generate-workout`
```javascript
// Request
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "goal": "muscle_gain",
  "daysAvailable": 4,
  "equipmentAvailable": ["dumbbells", "barbell", "bench", "cables"]
}

// Response (200) - Llama a Gemini automáticamente
{
  "title": "4-Day Push/Pull/Legs Split",
  "schedule": [
    {
      "day": "Monday",
      "focus": "Push",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps": "6-8",
          "rest": "2-3 minutes",
          "notes": "Primary chest builder"
        },
        // ... más ejercicios
      ]
    },
    // ... más días
  ],
  "totalDuration": "60-90 minutes per session",
  "estimatedCalories": 500,
  "progression": "Increase weight by 2.5-5kg when target reps achieved"
}

// Error si API key no es válida
{
  "error": "API key not valid"
}
```

#### `POST /api/generate-diet`
```javascript
// Request
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "goal": "muscle_gain",
  "calories": 2500,
  "restrictions": ["no peanuts"]
}

// Response (200)
{
  "title": "Muscle Gain - 2500 Calorie Meal Plan",
  "days": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": {
          "meal": "Oatmeal with Berries and Almonds",
          "calories": 500,
          "macros": { "protein": 15, "carbs": 65, "fat": 18 }
        },
        "lunch": {
          "meal": "Grilled Chicken Breast with Rice and Broccoli",
          "calories": 650,
          "macros": { "protein": 45, "carbs": 70, "fat": 8 }
        },
        // ... cena y snacks
      }
    },
    // ... 7 días únicos
  ],
  "totalCalories": 2500,
  "macros": {
    "protein": 175,
    "carbs": 312,
    "fat": 83
  }
}
```

---

### **4. Guardado en Base de Datos**

#### `POST /api/save-workout`
```javascript
// Request
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "4-Day Push/Pull/Legs Split",
  "planData": { 
    // Todo el objeto de rutina desde generate-workout
  }
}

// Response (200)
{
  "id": "1768498258906",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "4-Day Push/Pull/Legs Split",
  "success": true
}

// En BD: INSERT INTO workout_plans (userId, title, planData, saved_date)
```

#### `POST /api/save-diet`
```javascript
// Request
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Muscle Gain - 2500 Calorie Meal Plan",
  "planData": { 
    // Todo el objeto de dieta desde generate-diet
  }
}

// Response (200)
{
  "id": "1768498258907",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Muscle Gain - 2500 Calorie Meal Plan",
  "success": true
}
```

---

### **5. Obtención de Planes**

#### `GET /api/workout/:userId`
```javascript
// Response (200)
{
  "id": "1768498258906",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "4-Day Push/Pull/Legs Split",
  "planData": { ...full plan... },
  "saved_date": "2026-01-15T10:30:00Z"
}
```

#### `GET /api/diet/:userId`
```javascript
// Response (200)
{
  "id": "1768498258907",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Muscle Gain - 2500 Calorie Meal Plan",
  "planData": { ...full plan... },
  "saved_date": "2026-01-15T10:35:00Z"
}
```

---

### **6. Funcionalidades Avanzadas**

#### `POST /api/swap-exercise`
```javascript
// Request
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "exerciseName": "Barbell Bench Press",
  "reason": "No tengo barras disponibles"
}

// Response (200)
{
  "original": "Barbell Bench Press",
  "replacement": "Dumbbell Bench Press",
  "rationale": "Similar muscle activation, easier to scale with dumbbells",
  "sets": 4,
  "reps": "8-10",
  "rest": "2 minutes"
}
```

#### `POST /api/swap-meal`
```javascript
// Request
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "meal": "Grilled Chicken Breast with Rice and Broccoli",
  "reason": "No me gusta el pollo"
}

// Response (200)
{
  "original": "Grilled Chicken Breast with Rice and Broccoli",
  "replacement": "Salmon Fillet with Sweet Potato and Spinach",
  "macros": {
    "protein": 45,
    "carbs": 70,
    "fat": 8
  },
  "rationale": "Similar macros, omega-3 benefits"
}
```

#### `POST /api/medical-assistant`
```javascript
// Request
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "¿Cuándo debo descansar después de un entrenamiento de piernas?"
}

// Response (200)
{
  "response": "After a leg workout, 48-72 hours of rest is recommended for muscle recovery...",
  "personalized": "Based on your intermediate fitness level and 4-day split..."
}
```

#### `GET /api/sessions/:userId`
```javascript
// Response (200)
[
  {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "login_time": "2026-01-15T08:30:00Z",
    "logout_time": "2026-01-15T10:45:00Z"
  },
  {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "login_time": "2026-01-14T18:15:00Z",
    "logout_time": "2026-01-14T20:30:00Z"
  }
  // ... más sesiones
]
```

---

### **7. Verificación del Sistema**

#### `GET /api/health`
```javascript
// Response (200)
{
  "status": "healthy",
  "database": "connected",
  "gemini": "available",
  "uptime": 345600,
  "timestamp": "2026-01-15T10:30:00Z"
}
```

---

## 🗄️ Estructura de Base de Datos

### `users` table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `user_profiles` table
```sql
CREATE TABLE user_profiles (
  userId UUID PRIMARY KEY REFERENCES users(id),
  age INTEGER,
  weight DECIMAL,
  height INTEGER,
  goal VARCHAR(50),
  fitnessLevel VARCHAR(50),
  availableDays INTEGER,
  preferences TEXT[],
  medicalHistory TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `workout_plans` table
```sql
CREATE TABLE workout_plans (
  id SERIAL PRIMARY KEY,
  userId UUID REFERENCES users(id),
  title VARCHAR(255),
  planData JSONB,
  saved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `diet_plans` table
```sql
CREATE TABLE diet_plans (
  id SERIAL PRIMARY KEY,
  userId UUID REFERENCES users(id),
  title VARCHAR(255),
  planData JSONB,
  saved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `user_sessions` table
```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  userId UUID REFERENCES users(id),
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_time TIMESTAMP
);
```

---

## 🔐 Seguridad

### SSL/TLS
- ✅ Neon: `sslmode=require`
- ✅ Railway: HTTPS automático
- ✅ Netlify: HTTPS obligatorio

### CORS
```javascript
app.use(cors({
  origin: ['https://ubiquitous-phoenix-9851dd.netlify.app', 'http://localhost:3000'],
  credentials: true
}));
```

### Variables de Entorno
```
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require&uselibpqcompat=true
GEMINI_API_KEY=AIzaSyBbErHgWYj8Dbl0m61ANr0wsTgKronTGvU
PORT=3001
```

---

## 📊 Performance

| Operación | Tiempo | Notas |
|-----------|--------|-------|
| Health check | < 100ms | Simple DB query |
| Registro | 200-500ms | Insert + session create |
| Gen. Rutina | 8-15s | Gemini API call |
| Gen. Dieta | 10-20s | Gemini API call |
| Guardado BD | < 500ms | INSERT query |
| Recuperación | < 200ms | SELECT query |

---

## 🚀 Deployment

### Frontend (Netlify)
```bash
# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist

# Auto-deploy from GitHub on push to main
```

### Backend (Railway)
```bash
# Railway auto-deploys from GitHub
railway link
railway redeploy

# Environment variables set in Railway dashboard
```

### Database (Neon)
```bash
# Connection string includes pooler
postgresql://user:password@pooler.region.aws.neon.tech/db?sslmode=require&uselibpqcompat=true
```

---

## 📝 Logs y Debugging

### Railway Logs
```bash
railway logs

# Filtrar errores
railway logs | grep ERROR
```

### Frontend Console (F12)
```javascript
// Ver requests
console.log('API calls')

// LocalStorage
localStorage.getItem('STORAGE_KEY_WORKOUT')
localStorage.getItem('STORAGE_KEY_DIET')
```

### Database Queries (Neon)
```bash
# Connect to Neon
psql $DATABASE_URL

# Ver tablas
\dt

# Ver usuarios
SELECT * FROM users;
```

---

## 🔄 CI/CD Pipeline

1. Push a GitHub
2. Railway detecta cambios
3. Auto-redeploy en Railway
4. Netlify detecta cambios
5. Auto-build y deploy en Netlify

---

## 📚 Dependencies

### Backend
- `express` - Framework web
- `pg` - PostgreSQL driver
- `@google/generative-ai` - Gemini SDK
- `cors` - CORS middleware
- `uuid` - UUID generation
- `pdfkit` - PDF generation (futuro)

### Frontend
- `react` - UI library
- `typescript` - Type safety
- `vite` - Build tool
- `tailwindcss` - Styling
- `@google/generative-ai` - Client-side AI

---

**Referencia Técnica Completa - FitGenius AI**
*Última actualización: 15 de enero de 2026*
