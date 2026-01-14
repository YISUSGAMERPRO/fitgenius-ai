// ===== SERVIDOR FITGENIUS NEON POSTGRESQL =====
// Redeploy: 2026-01-14 08:55 - Agregar endpoints de IA
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const compression = require('compression');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Inicializar Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
let ai = null;

if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY no está configurada. Las funciones de IA no estarán disponibles.');
} else {
    ai = new GoogleGenAI({ apiKey });
    console.log('✅ Gemini AI inicializado correctamente');
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(compression());

// DEBUG: Mostrar todas las variables de entorno disponibles
console.log('=== DEBUG: Variables de Entorno Disponibles ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SÍ' : 'NO');
console.log('NETLIFY_DATABASE_URL_UNPOOLED:', process.env.NETLIFY_DATABASE_URL_UNPOOLED ? 'SÍ' : 'NO');
console.log('NETLIFY_DATABASE_URL:', process.env.NETLIFY_DATABASE_URL ? 'SÍ' : 'NO');
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'SÍ' : 'NO');
console.log('PORT:', process.env.PORT);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SÍ' : 'NO');
console.log('=========================================');

// Conexión a Neon PostgreSQL
console.log('📡 Buscando configuración de base de datos...');

// Función para obtener la URL de conexión correcta
function getDatabaseURL() {
    // PRIORIDAD 1: DATABASE_URL estándar
    if (process.env.DATABASE_URL) {
        console.log('✅ Encontrada: DATABASE_URL');
        return process.env.DATABASE_URL;
    }
    
    // PRIORIDAD 2: Netlify Neon (variables de extensión)
    if (process.env.NETLIFY_DATABASE_URL_UNPOOLED) {
        console.log('✅ Encontrada: NETLIFY_DATABASE_URL_UNPOOLED');
        return process.env.NETLIFY_DATABASE_URL_UNPOOLED;
    }
    
    if (process.env.NETLIFY_DATABASE_URL) {
        console.log('✅ Encontrada: NETLIFY_DATABASE_URL');
        return process.env.NETLIFY_DATABASE_URL;
    }
    
    // PRIORIDAD 3: Postgres explícito
    if (process.env.POSTGRES_URL) {
        console.log('✅ Encontrada: POSTGRES_URL');
        return process.env.POSTGRES_URL;
    }
    
    // FALLBACK
    console.error('❌ No se encontró URL de base de datos en variables de entorno');
    return null;
}

const DATABASE_URL = getDatabaseURL();

if (!DATABASE_URL) {
    console.error('❌ CRÍTICO: DATABASE_URL no está configurada');
    process.exit(1);
}

console.log('📝 DATABASE_URL:', DATABASE_URL.substring(0, 50) + '...');

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Manejo de errores del pool
pool.on('error', (err) => {
    console.error('❌ Error en pool de BD:', err);
});

pool.on('connect', () => {
    console.log('✅ Conexión a Neon establecida');
});

// Health check inmediato
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const result = await pool.query(
            'SELECT id, username, email FROM users WHERE username = $1 AND password = $2 LIMIT 1',
            [username, password]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error en login:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Obtener miembros
app.get('/api/members', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM gym_members');
        res.json(result.rows);
    } catch (err) {
        console.error('Error en members:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Guardar rutina
app.post('/api/save-workout', async (req, res) => {
    try {
        const { userId, title, planData } = req.body;
        const id = Date.now().toString();
        
        await pool.query(
            `INSERT INTO workout_plans (id, user_id, title, plan_data, created_at) 
             VALUES ($1, $2, $3, $4, NOW())`,
            [id, userId, title, JSON.stringify(planData)]
        );
        
        res.json({ id, success: true });
    } catch (err) {
        console.error('Error guardando workout:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Guardar dieta
app.post('/api/save-diet', async (req, res) => {
    try {
        const { userId, title, planData } = req.body;
        const id = Date.now().toString();
        
        await pool.query(
            `INSERT INTO diet_plans (id, user_id, title, plan_data, created_at) 
             VALUES ($1, $2, $3, $4, NOW())`,
            [id, userId, title, JSON.stringify(planData)]
        );
        
        res.json({ id, success: true });
    } catch (err) {
        console.error('Error guardando diet:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Obtener rutinas del usuario
app.get('/api/workouts/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC',
            [req.params.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo workouts:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Obtener dietas del usuario
app.get('/api/diets/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM diet_plans WHERE user_id = $1 ORDER BY created_at DESC',
            [req.params.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo diets:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Generar rutina con IA
app.post('/api/generate-workout', async (req, res) => {
    if (!ai) {
        return res.status(503).json({ error: 'Servicio de IA no disponible. Configura GEMINI_API_KEY en variables de entorno.' });
    }

    try {
        const { userId, profile, workoutType } = req.body;
        
        if (!userId || !profile || !workoutType) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos: userId, profile, workoutType' });
        }

        console.log(`🤖 Generando rutina para usuario ${userId}, tipo: ${workoutType}`);

        // Construir un prompt MÁS SIMPLE
        const prompt = `Genera un plan de entrenamiento en formato JSON válido. El usuario es:
        - Edad: ${profile.age}
        - Objetivo: ${profile.goal}
        - Tipo: ${workoutType}
        
        Responde SOLO con JSON sin explicaciones previas:
        {
          "title": "Plan ${workoutType}",
          "description": "Un plan personalizado",
          "frequency": "5 días/semana",
          "estimatedDuration": "60 minutos",
          "difficulty": "intermedio",
          "durationWeeks": 4,
          "recommendations": ["Descansar", "Hidratarse"],
          "schedule": [
            {"dayName": "Lunes", "focus": "Pecho", "exercises": [{"name": "Flexiones", "sets": 3, "reps": "10-12", "rest": "60s", "muscleGroup": "Pecho", "category": "main", "tempo": "2-0-1-0", "description": "Ejercicio básico", "tips": "Respira correctamente", "videoQuery": "flexiones"}]},
            {"dayName": "Martes", "focus": "Espalda", "exercises": []},
            {"dayName": "Miércoles", "focus": "Piernas", "exercises": []},
            {"dayName": "Jueves", "focus": "Brazos", "exercises": []},
            {"dayName": "Viernes", "focus": "Hombros", "exercises": []},
            {"dayName": "Sábado", "focus": "Cardio", "exercises": []},
            {"dayName": "Domingo", "focus": "Descanso", "exercises": []}
          ]
        }`;

        // Llamar a Gemini SIN responseMimeType
        console.log('📤 Llamando a Gemini API...');
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: prompt
        });

        console.log('📥 Respuesta de Gemini recibida');
        
        if (!response.text) {
            console.error('❌ No se recibió texto en la respuesta:', response);
            throw new Error('No se recibió respuesta de la IA');
        }

        console.log('🔍 Parseando JSON...');
        
        // Intentar encontrar JSON en la respuesta
        let jsonText = response.text;
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }
        
        let workoutPlan;
        try {
            workoutPlan = JSON.parse(jsonText);
        } catch (parseErr) {
            console.error('❌ Error parseando JSON. Respuesta cruda:', response.text.substring(0, 500));
            throw new Error(`Error parseando JSON: ${parseErr.message}`);
        }

        const planId = Date.now().toString();

        // Guardar en la base de datos
        console.log('💾 Guardando en base de datos...');
        await pool.query(
            `INSERT INTO workout_plans (id, user_id, title, plan_data, created_at) 
             VALUES ($1, $2, $3, $4, NOW())`,
            [planId, userId, workoutPlan.title || 'Plan de Entrenamiento', JSON.stringify(workoutPlan)]
        );

        console.log('✅ Rutina generada exitosamente');
        res.json({ ...workoutPlan, id: planId });
    } catch (err) {
        console.error('❌ Error generando workout:', err.message);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ error: err.message, details: err.stack });
    }
});

// Generar dieta con IA
app.post('/api/generate-diet', async (req, res) => {
    if (!ai) {
        return res.status(503).json({ error: 'Servicio de IA no disponible. Configura GEMINI_API_KEY en variables de entorno.' });
    }

    try {
        const { userId, profile, dietType, budget } = req.body;
        
        if (!userId || !profile || !dietType) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos: userId, profile, dietType' });
        }

        console.log(`🤖 Generando dieta para usuario ${userId}, tipo: ${dietType}`);

        // Construir un prompt MÁS SIMPLE
        const prompt = `Genera un plan nutricional en formato JSON válido. El usuario es:
        - Edad: ${profile.age}
        - Objetivo: ${profile.goal}
        - Tipo de dieta: ${dietType}
        
        Responde SOLO con JSON sin explicaciones previas:
        {
          "title": "Plan ${dietType}",
          "description": "Un plan nutricional personalizado",
          "weeklyCalories": 2000,
          "macros": {"protein": 30, "carbs": 40, "fats": 30},
          "mealPlan": [
            {
              "day": "Lunes",
              "meals": [
                {"name": "Desayuno", "time": "7:00 AM", "items": ["Avena", "Miel"], "calories": 350, "macros": {"protein": 10, "carbs": 50, "fats": 8}},
                {"name": "Almuerzo", "time": "1:00 PM", "items": ["Pollo", "Arroz"], "calories": 600, "macros": {"protein": 40, "carbs": 60, "fats": 10}},
                {"name": "Cena", "time": "7:00 PM", "items": ["Pescado", "Vegetales"], "calories": 400, "macros": {"protein": 35, "carbs": 30, "fats": 12}}
              ]
            },
            {"day": "Martes", "meals": []},
            {"day": "Miércoles", "meals": []},
            {"day": "Jueves", "meals": []},
            {"day": "Viernes", "meals": []},
            {"day": "Sábado", "meals": []},
            {"day": "Domingo", "meals": []}
          ],
          "shoppingList": ["Pollo", "Arroz", "Vegetales", "Pescado"],
          "tips": ["Hidratate bien", "Come despacio"]
        }`;

        // Llamar a Gemini SIN responseMimeType
        console.log('📤 Llamando a Gemini API para dieta...');
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: prompt
        });

        console.log('📥 Respuesta de Gemini recibida');
        
        if (!response.text) {
            console.error('❌ No se recibió texto en la respuesta:', response);
            throw new Error('No se recibió respuesta de la IA');
        }

        console.log('🔍 Parseando JSON...');
        
        // Intentar encontrar JSON en la respuesta
        let jsonText = response.text;
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }
        
        let dietPlan;
        try {
            dietPlan = JSON.parse(jsonText);
        } catch (parseErr) {
            console.error('❌ Error parseando JSON. Respuesta cruda:', response.text.substring(0, 500));
            throw new Error(`Error parseando JSON: ${parseErr.message}`);
        }

        const planId = Date.now().toString();

        // Guardar en la base de datos
        console.log('💾 Guardando en base de datos...');
        await pool.query(
            `INSERT INTO diet_plans (id, user_id, title, plan_data, created_at) 
             VALUES ($1, $2, $3, $4, NOW())`,
            [planId, userId, dietPlan.title || 'Plan de Nutrición', JSON.stringify(dietPlan)]
        );

        console.log('✅ Dieta generada exitosamente');
        res.json({ ...dietPlan, id: planId });
    } catch (err) {
        console.error('❌ Error generando diet:', err.message);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ error: err.message, details: err.stack });
    }
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📡 DATABASE_URL: ${process.env.DATABASE_URL ? 'Configurada ✅' : 'NO configurada ❌'}`);
    console.log(`🤖 GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Configurada ✅' : 'NO configurada ❌'}`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('❌ Excepción no capturada:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
});

module.exports = app;
