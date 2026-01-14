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

// ========================================
// INICIALIZAR TABLAS SI NO EXISTEN
// ========================================
async function initializeTables() {
    try {
        console.log('📋 Inicializando tablas...');

        const tables = [
            // Tabla users
            `CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE,
                username VARCHAR(255),
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabla user_profiles
            `CREATE TABLE IF NOT EXISTS user_profiles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                name VARCHAR(255),
                age INT,
                weight DECIMAL(5,2),
                height DECIMAL(5,2),
                gender VARCHAR(20),
                goal VARCHAR(255),
                activity_level VARCHAR(100),
                body_type VARCHAR(100),
                equipment TEXT,
                injuries TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Tabla gym_members
            `CREATE TABLE IF NOT EXISTS gym_members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                plan VARCHAR(100),
                status VARCHAR(50) DEFAULT 'Activo',
                last_payment_date DATE,
                last_payment_amount DECIMAL(10,2),
                subscription_end_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabla workout_plans
            `CREATE TABLE IF NOT EXISTS workout_plans (
                id VARCHAR(255) PRIMARY KEY,
                user_id UUID NOT NULL,
                title VARCHAR(255),
                plan_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Tabla diet_plans
            `CREATE TABLE IF NOT EXISTS diet_plans (
                id VARCHAR(255) PRIMARY KEY,
                user_id UUID NOT NULL,
                title VARCHAR(255),
                plan_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`
        ];

        // Ejecutar cada CREATE TABLE
        for (const sql of tables) {
            try {
                await pool.query(sql);
            } catch (err) {
                if (err.code !== '42P07') { // 42P07 = relación ya existe
                    console.error('❌ Error creando tabla:', err.message);
                }
            }
        }

        // Crear índices
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON diet_plans(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)'
        ];

        for (const sql of indices) {
            try {
                await pool.query(sql);
            } catch (err) {
                // Ignorar si el índice ya existe
            }
        }

        console.log('✅ Tablas inicializadas correctamente');
    } catch (err) {
        console.error('❌ Error inicializando tablas:', err.message);
    }
}

// Ejecutar inicialización Y LUEGO iniciar servidor
(async () => {
    try {
        await initializeTables();
        console.log('✅ Base de datos lista');
        
        // Iniciar servidor después de la inicialización
        const server = app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
            console.log(`📡 DATABASE_URL: ${process.env.DATABASE_URL ? 'Configurada ✅' : 'NO configurada ❌'}`);
            console.log(`🤖 GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Configurada ✅' : 'NO configurada ❌'}`);
        });
    } catch (err) {
        console.error('❌ Fallo crítico en inicialización:', err);
        process.exit(1);
    }
})();

// Manejo de errores del pool

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

// Login (soporta esquemas con email o username)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Intentar con email o username (COALESCE) para compatibilidad de esquemas
        const result = await pool.query(
            'SELECT id, COALESCE(email, username) AS email FROM users WHERE (email = $1 OR username = $1) AND password = $2 LIMIT 1',
            [email, password]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        res.json({ id: result.rows[0].id, email: result.rows[0].email });
    } catch (err) {
        console.error('Error en login:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Register (soporta esquemas con email o username)
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, id } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }
        
        // Verificar si el usuario ya existe (email o username)
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $1 LIMIT 1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }
        
        // Crear nuevo usuario; si no existe la columna email, usar username
        const userId = id || crypto.randomUUID();
        try {
            await pool.query(
                'INSERT INTO users (id, email, password, created_at) VALUES ($1, $2, $3, NOW())',
                [userId, email, password]
            );
        } catch (e) {
            // Si falla por falta de columna email, intentar con username (compatibilidad)
            if (e.code === '42703') {
                await pool.query(
                    'INSERT INTO users (id, username, password, created_at) VALUES ($1, $2, $3, NOW())',
                    [userId, email, password]
                );
            } else {
                throw e;
            }
        }
        
        console.log('✅ Usuario registrado:', { id: userId, email });
        res.json({ id: userId, email, success: true });
    } catch (err) {
        console.error('❌ Error en registro:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Obtener perfil de usuario
app.get('/api/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM user_profiles WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo perfil:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Guardar/Actualizar perfil de usuario
app.post('/api/profile', async (req, res) => {
    try {
        const profile = req.body;
        const { user_id, name, age, weight, height, gender, goal, activityLevel, bodyType, equipment, injuries } = profile;
        
        if (!user_id) {
            return res.status(400).json({ error: 'user_id es requerido' });
        }
        
        const validatedName = name || 'Usuario';
        
        console.log('💾 Guardando perfil para usuario:', user_id);
        console.log('📊 Datos recibidos:', { user_id, name: validatedName, age, weight, height, gender, goal });
        
        // Verificar si el perfil ya existe
        const existing = await pool.query(
            'SELECT id FROM user_profiles WHERE user_id = $1 LIMIT 1',
            [user_id]
        );
        
        if (existing.rows.length > 0) {
            // Actualizar perfil existente
            await pool.query(
                `UPDATE user_profiles SET 
                    name = $1, age = $2, weight = $3, height = $4, gender = $5, 
                    goal = $6, activity_level = $7, body_type = $8, 
                    equipment = $9, injuries = $10, updated_at = NOW()
                 WHERE user_id = $11`,
                [validatedName, age, weight, height, gender, goal, activityLevel, bodyType, 
                 JSON.stringify(equipment), injuries, user_id]
            );
            console.log('✅ Perfil actualizado');
        } else {
            // Crear nuevo perfil
            const profileId = crypto.randomUUID();
            await pool.query(
                `INSERT INTO user_profiles 
                    (id, user_id, name, age, weight, height, gender, goal, activity_level, 
                     body_type, equipment, injuries, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
                [profileId, user_id, validatedName, age, weight, height, gender, goal, activityLevel, 
                 bodyType, JSON.stringify(equipment), injuries]
            );
            console.log('✅ Perfil creado correctamente');
        }
        
        res.json({ success: true, message: 'Perfil guardado correctamente' });
    } catch (err) {
        console.error('❌ Error guardando perfil:', err.message);
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

// Guardar miembro
app.post('/api/members', async (req, res) => {
    try {
        const { id, name, plan, status, lastPaymentDate, lastPaymentAmount, subscriptionEndDate } = req.body;
        
        if (!id || !name) {
            return res.status(400).json({ error: 'id y name son requeridos' });
        }

        console.log('💾 Guardando miembro:', { id, name, plan });

        // Generar ID si no está proporcionado
        const memberId = id || crypto.randomUUID();

        const result = await pool.query(
            `INSERT INTO gym_members (id, name, plan, status, last_payment_date, last_payment_amount, subscription_end_date, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             RETURNING id`,
            [memberId, name, plan || 'Estándar', status || 'Activo', lastPaymentDate || null, lastPaymentAmount || 0, subscriptionEndDate || null]
        );

        console.log('✅ Miembro guardado correctamente:', memberId);
        res.status(201).json({ id: memberId, success: true, message: 'Miembro guardado correctamente' });
    } catch (err) {
        console.error('❌ Error guardando miembro:', err.message);
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

// ADMIN: Ver todas las tablas y estadísticas
app.get('/api/admin/database-stats', async (req, res) => {
    try {
        const stats = {};
        
        // Contar usuarios
        const users = await pool.query('SELECT COUNT(*) as count FROM users');
        stats.users = parseInt(users.rows[0].count);
        
        // Contar perfiles
        const profiles = await pool.query('SELECT COUNT(*) as count FROM user_profiles');
        stats.profiles = parseInt(profiles.rows[0].count);
        
        // Contar rutinas
        const workouts = await pool.query('SELECT COUNT(*) as count FROM workout_plans');
        stats.workouts = parseInt(workouts.rows[0].count);
        
        // Contar dietas
        const diets = await pool.query('SELECT COUNT(*) as count FROM diet_plans');
        stats.diets = parseInt(diets.rows[0].count);
        
        // Últimos 10 registros
        const recentUsers = await pool.query('SELECT id, COALESCE(email, username) AS email, created_at FROM users ORDER BY created_at DESC LIMIT 10');
        const recentWorkouts = await pool.query('SELECT id, user_id, title, created_at FROM workout_plans ORDER BY created_at DESC LIMIT 10');
        const recentDiets = await pool.query('SELECT id, user_id, title, created_at FROM diet_plans ORDER BY created_at DESC LIMIT 10');
        
        res.json({
            stats,
            recent: {
                users: recentUsers.rows,
                workouts: recentWorkouts.rows,
                diets: recentDiets.rows
            }
        });
    } catch (err) {
        console.error('Error obteniendo stats:', err.message);
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

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('❌ Excepción no capturada:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
});

module.exports = app;
