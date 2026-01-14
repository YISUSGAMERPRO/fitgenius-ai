// ===== SERVIDOR FITGENIUS NEON POSTGRESQL =====
// Redeploy: 2026-01-14 08:55 - Agregar endpoints de IA
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const compression = require('compression');
const crypto = require('crypto');
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

// Test de Gemini API
app.get('/api/test-gemini', async (req, res) => {
    if (!ai) {
        return res.json({ status: 'error', message: 'Gemini no inicializado' });
    }
    
    try {
        console.log('🧪 Testeando Gemini API...');
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: "Escribe un JSON simple con un plan de entrenamiento básico de 1 día"
        });
        
        console.log('Respuesta recibida:', response.text?.substring(0, 200));
        
        res.json({ 
            status: 'ok', 
            response: response.text?.substring(0, 500),
            fullLength: response.text?.length
        });
    } catch (err) {
        console.error('Error en test:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await pool.query(
            'SELECT id, email FROM users WHERE email = $1 AND password = $2 LIMIT 1',
            [email, password]
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

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, id } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }
        
        // Verificar si el email ya existe
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 LIMIT 1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }
        
        // Crear nuevo usuario
        const userId = id || crypto.randomUUID();
        await pool.query(
            'INSERT INTO users (id, email, password, created_at) VALUES ($1, $2, $3, NOW())',
            [userId, email, password]
        );
        
        res.json({ id: userId, email, success: true });
    } catch (err) {
        console.error('Error en registro:', err.message);
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

        // Prompt MUY simple para probar
        const prompt = `Responde SOLO con JSON válido (sin explicaciones):
{"title":"Plan ${workoutType}","description":"Plan personalizado","frequency":"5 días","estimatedDuration":"60 min","difficulty":"intermedio","durationWeeks":4,"recommendations":["Descansa bien","Hidratate"],"schedule":[{"dayName":"Lunes","focus":"Pecho","exercises":[{"name":"Flexiones","sets":3,"reps":"10-12","rest":"60s","muscleGroup":"Pecho","category":"main","tempo":"2-0-1-0","description":"Básico","tips":"Respira","videoQuery":"flexiones"}]},{"dayName":"Martes","focus":"Espalda","exercises":[]},{"dayName":"Miércoles","focus":"Piernas","exercises":[]},{"dayName":"Jueves","focus":"Brazos","exercises":[]},{"dayName":"Viernes","focus":"Hombros","exercises":[]},{"dayName":"Sábado","focus":"Cardio","exercises":[]},{"dayName":"Domingo","focus":"Descanso","exercises":[]}]}`;

        console.log('📤 Llamando a Gemini...');
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: prompt
        });

        if (!response.text) {
            throw new Error('Gemini no devolvió respuesta');
        }

        console.log('📥 Respuesta recibida, primeros 200 chars:', response.text.substring(0, 200));

        // Extraer JSON - puede estar dentro de bloque markdown ```json...```
        let jsonText = response.text;
        
        // Si está dentro de bloque markdown, extraerlo
        const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (markdownMatch) {
            console.log('🔍 Encontrado JSON dentro de bloque markdown');
            jsonText = markdownMatch[1].trim();
        } else {
            // Si no, buscar directamente el JSON entre { y }
            const firstBrace = jsonText.indexOf('{');
            const lastBrace = jsonText.lastIndexOf('}');
            
            if (firstBrace === -1 || lastBrace === -1) {
                console.error('❌ No se encontró JSON en la respuesta');
                console.error('Respuesta completa:', response.text);
                throw new Error('No se encontró JSON en la respuesta de Gemini');
            }
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        }
        
        console.log('🔍 JSON extraído:', jsonText.substring(0, 150));

        let workoutPlan;
        try {
            workoutPlan = JSON.parse(jsonText);
        } catch (parseErr) {
            console.error('❌ Error parseando JSON:', parseErr.message);
            console.error('JSON intentado:', jsonText.substring(0, 300));
            throw new Error(`Error parseando JSON: ${parseErr.message}`);
        }

        const planId = Date.now().toString();

        // Guardar en BD
        console.log('💾 Guardando...');
        await pool.query(
            `INSERT INTO workout_plans (id, user_id, title, plan_data, created_at) 
             VALUES ($1, $2, $3, $4, NOW())`,
            [planId, userId, workoutPlan.title || 'Plan', JSON.stringify(workoutPlan)]
        );

        console.log('✅ Rutina guardada');
        res.json({ ...workoutPlan, id: planId });
    } catch (err) {
        console.error('❌ Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Generar dieta con IA
app.post('/api/generate-diet', async (req, res) => {
    if (!ai) {
        return res.status(503).json({ error: 'Servicio de IA no disponible. Configura GEMINI_API_KEY en variables de entorno.' });
    }

    try {
        const { userId, profile, dietType } = req.body;
        
        if (!userId || !profile || !dietType) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos: userId, profile, dietType' });
        }

        console.log(`🤖 Generando dieta para usuario ${userId}, tipo: ${dietType}`);

        // Prompt MUY simple
        const prompt = `Responde SOLO con JSON válido (sin explicaciones):
{"title":"Plan ${dietType}","description":"Plan nutricional","weeklyCalories":2000,"macros":{"protein":30,"carbs":40,"fats":30},"mealPlan":[{"day":"Lunes","meals":[{"name":"Desayuno","time":"7:00","items":["Avena","Leche"],"calories":350,"macros":{"protein":10,"carbs":50,"fats":8}},{"name":"Almuerzo","time":"13:00","items":["Pollo","Arroz"],"calories":600,"macros":{"protein":40,"carbs":60,"fats":10}},{"name":"Cena","time":"19:00","items":["Pescado","Verduras"],"calories":400,"macros":{"protein":35,"carbs":30,"fats":12}}]},{"day":"Martes","meals":[]},{"day":"Miércoles","meals":[]},{"day":"Jueves","meals":[]},{"day":"Viernes","meals":[]},{"day":"Sábado","meals":[]},{"day":"Domingo","meals":[]}],"shoppingList":["Pollo","Arroz","Pescado","Verduras"],"tips":["Hidratate","Come despacio"]}`;

        console.log('📤 Llamando a Gemini...');
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: prompt
        });

        if (!response.text) {
            throw new Error('Gemini no devolvió respuesta');
        }

        console.log('📥 Respuesta recibida');

        // Extraer JSON - puede estar dentro de bloque markdown ```json...```
        let jsonText = response.text;
        
        // Si está dentro de bloque markdown, extraerlo
        const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (markdownMatch) {
            console.log('🔍 Encontrado JSON dentro de bloque markdown');
            jsonText = markdownMatch[1].trim();
        } else {
            // Si no, buscar directamente el JSON entre { y }
            const firstBrace = jsonText.indexOf('{');
            const lastBrace = jsonText.lastIndexOf('}');
            
            if (firstBrace === -1 || lastBrace === -1) {
                console.error('❌ No se encontró JSON en la respuesta');
                throw new Error('No se encontró JSON en la respuesta de Gemini');
            }
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        }

        let dietPlan;
        try {
            dietPlan = JSON.parse(jsonText);
        } catch (parseErr) {
            console.error('❌ Error parseando JSON:', parseErr.message);
            throw new Error(`Error parseando JSON: ${parseErr.message}`);
        }

        const planId = Date.now().toString();

        // Guardar en BD
        console.log('💾 Guardando...');
        await pool.query(
            `INSERT INTO diet_plans (id, user_id, title, plan_data, created_at) 
             VALUES ($1, $2, $3, $4, NOW())`,
            [planId, userId, dietPlan.title || 'Plan', JSON.stringify(dietPlan)]
        );

        console.log('✅ Dieta guardada');
        res.json({ ...dietPlan, id: planId });
    } catch (err) {
        console.error('❌ Error:', err.message);
        res.status(500).json({ error: err.message });
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
