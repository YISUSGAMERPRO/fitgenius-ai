// ===== SERVIDOR FITGENIUS NEON POSTGRESQL =====
// Redeploy: 2026-01-14 08:55 - Agregar endpoints de IA
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const compression = require('compression');
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Biblioteca rápida de ejercicios para rellenar volumen mínimo
const fallbackExercises = [
    { name: 'Sentadilla con barra', sets: 4, reps: '8-10', rest: '120s', muscleGroup: 'Piernas', category: 'compound', tempo: '2-0-1-0', description: 'Ejercicio base para fuerza y masa', tips: 'Espalda recta, rodillas alineadas', videoQuery: 'barbell back squat form' },
    { name: 'Press banca', sets: 4, reps: '8-10', rest: '120s', muscleGroup: 'Pecho', category: 'compound', tempo: '2-0-1-0', description: 'Empuje horizontal principal', tips: 'Codos 45°, controla la bajada', videoQuery: 'bench press form' },
    { name: 'Peso muerto rumano', sets: 3, reps: '10-12', rest: '120s', muscleGroup: 'Isquios/Glúteo', category: 'compound', tempo: '2-1-1-0', description: 'Bisagra de cadera dominante', tips: 'Barra pegada al cuerpo', videoQuery: 'romanian deadlift form' },
    { name: 'Remo con barra', sets: 4, reps: '10-12', rest: '90s', muscleGroup: 'Espalda', category: 'compound', tempo: '2-0-1-1', description: 'Tracción horizontal', tips: 'Escápulas retraídas', videoQuery: 'barbell row form' },
    { name: 'Press militar con mancuernas', sets: 3, reps: '10-12', rest: '90s', muscleGroup: 'Hombro', category: 'compound', tempo: '2-0-1-0', description: 'Empuje vertical', tips: 'No hiperextiendas lumbar', videoQuery: 'dumbbell shoulder press form' },
    { name: 'Elevaciones laterales', sets: 3, reps: '12-15', rest: '75s', muscleGroup: 'Hombro lateral', category: 'isolation', tempo: '2-0-1-0', description: 'Aislamiento del deltoides medio', tips: 'Sin impulso, pausa arriba', videoQuery: 'lateral raise form' },
    { name: 'Curl bíceps con mancuernas', sets: 3, reps: '10-12', rest: '75s', muscleGroup: 'Bíceps', category: 'isolation', tempo: '2-0-1-0', description: 'Flexión de codo', tips: 'Codos pegados al torso', videoQuery: 'dumbbell biceps curl form' },
    { name: 'Extensión de tríceps en polea', sets: 3, reps: '12-15', rest: '75s', muscleGroup: 'Tríceps', category: 'isolation', tempo: '1-0-2-0', description: 'Extensión de codo', tips: 'Controla la fase excéntrica', videoQuery: 'triceps rope pushdown form' },
    { name: 'Plancha', sets: 3, reps: '30-45s', rest: '60s', muscleGroup: 'Core', category: 'core', tempo: 'isometric', description: 'Estabilidad anti-extensión', tips: 'Cadera neutra, glúteo activo', videoQuery: 'plank form' }
];

function padExercisesToMinimum(day) {
    const MIN = 6;
    // Si el día no tiene exercises o es un array vacío, crear uno nuevo
    if (!day.exercises) {
        day.exercises = [];
    }
    
    // Solo aplicar padding si hay menos del mínimo
    if (day.exercises.length >= MIN) return day;
    
    const needed = MIN - day.exercises.length;
    console.log(`📋 Padding day "${day.dayName || day.day}": adding ${needed} exercises (current: ${day.exercises.length})`);
    
    // Seleccionar ejercicios que no estén ya en el día
    const existingNames = new Set(day.exercises.map(e => e.name.toLowerCase()));
    const available = fallbackExercises.filter(e => !existingNames.has(e.name.toLowerCase()));
    const extras = available.slice(0, needed);
    
    // Si no hay suficientes únicos, usar todos los disponibles
    if (extras.length < needed) {
        const remaining = needed - extras.length;
        extras.push(...fallbackExercises.slice(0, remaining));
    }
    
    day.exercises = [...day.exercises, ...extras];
    return day;
}

const fallbackMeals = [
    { name: 'Desayuno', time: '07:00', items: ['Avena 60g', 'Leche 200ml', 'Banano 1'], calories: 350, protein: 18, carbs: 55, fats: 8 },
    { name: 'Snack AM', time: '10:30', items: ['Yogur griego 150g', 'Almendras 25g'], calories: 220, protein: 16, carbs: 15, fats: 12 },
    { name: 'Almuerzo', time: '13:30', items: ['Pechuga pollo 150g', 'Arroz integral 150g', 'Brócoli 100g'], calories: 600, protein: 48, carbs: 65, fats: 10 },
    { name: 'Snack PM', time: '17:00', items: ['Manzana 1', 'Mantequilla maní 1 cda'], calories: 200, protein: 6, carbs: 28, fats: 8 },
    { name: 'Cena', time: '20:00', items: ['Salmón 150g', 'Batata 150g', 'Espinacas 100g'], calories: 480, protein: 38, carbs: 42, fats: 14 }
];

function ensureSevenDaysSchedule(entries, restDays = []) {
    const days = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
    
    // Si no hay entries o está vacío, devolver días según restDays
    if (!entries || entries.length === 0) {
        console.log('⚠️ No hay schedule entries, creando estructura vacía');
        return days.map(d => {
            if (restDays.includes(d)) {
                return { dayName: d, focus: 'Descanso', exercises: [], isRestDay: true };
            }
            return { dayName: d, focus: 'General', exercises: [] };
        });
    }
    
    console.log(`📅 Processing ${entries.length} days from AI response`);
    
    // Crear mapa con múltiples claves posibles para cada día
    const map = new Map();
    entries.forEach((d, idx) => {
        const dayKey = d.dayName || d.day || `Día ${idx + 1}`;
        map.set(dayKey, d);
        
        // También guardar por nombre de día estándar si coincide parcialmente
        days.forEach(standardDay => {
            if (dayKey.toLowerCase().includes(standardDay.toLowerCase())) {
                map.set(standardDay, d);
            }
        });
    });
    
    // Si hay menos de 7 entries, asignar los existentes a días en orden
    if (entries.length > 0 && entries.length < 7 && map.size < 7) {
        let entryIdx = 0;
        return days.map((d, idx) => {
            // Si es día de descanso
            if (restDays.includes(d)) {
                return { dayName: d, focus: 'Descanso', exercises: [], isRestDay: true };
            }
            
            // Si ya existe en el mapa
            const existing = map.get(d);
            if (existing) {
                return { ...existing, dayName: d };
            }
            
            // Si hay entries disponibles, usar el siguiente
            if (entryIdx < entries.length) {
                const entry = entries[entryIdx];
                entryIdx++;
                return { ...entry, dayName: d };
            }
            
            // Si no hay más entries y no es descanso, marcar como General vacío
            return { dayName: d, focus: 'General', exercises: [] };
        });
    }
    
    return days.map(d => {
        const existing = map.get(d);
        if (existing) return { ...existing, dayName: d };
        
        // Si es día de descanso, crear entrada sin ejercicios
        if (restDays.includes(d)) {
            return { dayName: d, focus: 'Descanso', exercises: [], isRestDay: true };
        }
        
        // Si no existe y no es descanso, crear con estructura básica
        return { dayName: d, focus: 'General', exercises: [] };
    });
}

function ensureSevenDaysMeals(entries) {
    const days = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
    const map = new Map((entries || []).map(d => [d.day || d.dayName, d]));
    
    return days.map(d => {
        const existing = map.get(d);
        if (existing && existing.meals && existing.meals.length > 0) {
            // Asegurar que cada comida tenga ingredients e instructions
            existing.meals = existing.meals.map(meal => ({
                ...meal,
                name: meal.name || 'Comida',
                description: meal.description || `${meal.name || 'Comida'} nutritiva`,
                calories: meal.calories || 400,
                protein: meal.protein || 25,
                carbs: meal.carbs || 40,
                fats: meal.fats || 15,
                ingredients: meal.ingredients || meal.items || ['Ingrediente 1', 'Ingrediente 2', 'Ingrediente 3'],
                instructions: meal.instructions || ['Preparar ingredientes', 'Cocinar según preferencia', 'Servir y disfrutar'],
                prepTime: meal.prepTime || '15 min'
            }));
            return { ...existing, day: d };
        }
        return { day: d, meals: [...fallbackMeals].map(m => ({
            ...m,
            description: `${m.name} nutritivo y balanceado`,
            ingredients: m.items || ['Ingrediente 1', 'Ingrediente 2'],
            instructions: ['Preparar ingredientes', 'Cocinar según preferencia', 'Servir'],
            prepTime: '15 min'
        })) };
    });
}

// Función para limpiar y reparar JSON malformado de Gemini
function cleanAndParseJSON(text) {
    // Extraer JSON de bloque markdown si existe
    let jsonText = text;
    const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (markdownMatch) {
        jsonText = markdownMatch[1].trim();
    } else {
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        }
    }
    
    // Intentar parsear directamente
    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.log('⚠️ JSON malformado, intentando reparar...');
    }
    
    // Reparaciones comunes
    let fixed = jsonText
        // Eliminar comas finales antes de ] o }
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}')
        // Eliminar caracteres de control
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        // Arreglar comillas escapadas mal formadas
        .replace(/\\'/g, "'")
        // Eliminar trailing commas en arrays
        .replace(/,(\s*[\]}])/g, '$1');
    
    try {
        return JSON.parse(fixed);
    } catch (e2) {
        console.error('❌ No se pudo reparar el JSON:', e2.message);
        console.error('JSON original (primeros 500 chars):', jsonText.substring(0, 500));
        throw new Error(`Error parseando JSON: ${e2.message}`);
    }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Inicializar Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
let ai = null;

if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY no está configurada. Las funciones de IA no estarán disponibles.');
} else {
    ai = new GoogleGenerativeAI(apiKey);
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

// Verificar existencia de usuario para evitar violaciones de FK
async function ensureUserExists(userId) {
    if (!userId) return { exists: false };
    
    // Verificar si userId es un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(userId);
    
    if (!isValidUUID) {
        console.log(`⚠️ userId "${userId}" no es un UUID válido. Generando uno nuevo...`);
        // Generar un UUID válido basado en el userId original
        userId = crypto.randomUUID();
        console.log(`✅ Nuevo UUID generado: ${userId}`);
    }
    
    try {
        const result = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [userId]);
        
        if (result.rows.length > 0) {
            return { exists: true, id: userId };
        }
        
        // Usuario no existe - crearlo automáticamente con datos dummy
        console.log(`⚠️ Usuario ${userId} no existe en BD. Creándolo automáticamente...`);
        
        try {
            await pool.query(
                'INSERT INTO users (id, email, password, created_at) VALUES ($1::uuid, $2, $3, NOW())',
                [userId, `user_${userId.substring(0, 8)}@fitgenius.app`, 'auto_created']
            );
            console.log(`✅ Usuario ${userId} creado automáticamente`);
            return { exists: true, created: true, id: userId };
        } catch (insertErr) {
            console.error('❌ Error creando usuario automáticamente:', insertErr.message);
            return { exists: false, error: insertErr.message };
        }
    } catch (e) {
        console.error('⚠️ Error verificando usuario:', e.message);
        return { exists: false };
    }
}

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
                    throw err;
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
                console.log('ℹ️ Índice ya existe:', sql.split(' ')[4]);
            }
        }

        console.log('✅ Tablas inicializadas correctamente');
        return true;
    } catch (err) {
        console.error('❌ Error inicializando tablas:', err.message);
        console.error('Stack:', err.stack);
        throw err;
    }
}

// Ejecutar inicialización Y LUEGO iniciar servidor
console.log('⏳ Iniciando función de arranque del servidor...');

// Inicializar tablas de forma asíncrona pero sin bloquear
initializeTables()
    .then(() => console.log('✅ Base de datos lista'))
    .catch(err => console.error('⚠️ Error en inicialización de tablas:', err.message));

// Iniciar servidor INMEDIATAMENTE (sin esperar tablas)
console.log(`📡 Intentando escuchar en 0.0.0.0:${PORT}...`);
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor corriendo en 0.0.0.0:${PORT}`);
    const dbConfigured = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL || process.env.POSTGRES_URL;
    console.log(`📡 Base de Datos: ${dbConfigured ? 'Configurada ✅' : 'NO configurada ❌'}`);
    console.log(`🤖 GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Configurada ✅' : 'NO configurada ❌'}\n`);
});

console.log('✅ app.listen() se ha iniciado');

// Prevenir cierre del servidor
server.on('error', (err) => {
    console.error('❌ Error del servidor:', err);
});

server.on('close', () => {
    console.warn('⚠️ Servidor cerrado');
});

// Mantener el proceso activo
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM recibido, cerrando gracefully...');
    server.close(() => {
        process.exit(0);
    });
});

console.log('✅ Función de arranque iniciada');

// Manejo de errores del pool

// Health check inmediato
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint para ver la API key (solo primeros/últimos caracteres)
app.get('/api/debug-env', (req, res) => {
    const key = process.env.GEMINI_API_KEY || '';
    res.json({
        geminiKeyPrefix: key.substring(0, 10),
        geminiKeySuffix: key.substring(key.length - 4),
        geminiKeyLength: key.length,
        hasKey: !!key
    });
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

// DEBUG: Listar todos los usuarios (temporal)
app.get('/api/debug/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, username, created_at FROM users ORDER BY created_at DESC LIMIT 20');
        res.json({ 
            count: result.rows.length,
            users: result.rows 
        });
    } catch (err) {
        console.error('Error listando usuarios:', err.message);
        res.status(500).json({ error: err.message });
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
        
        console.log(`📝 Intento de registro: email=${email}, id=${id}`);
        
        // Verificar si el usuario ya existe (email o username)
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $1 LIMIT 1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            console.log(`⚠️ Usuario ya existe con id: ${existingUser.rows[0].id}`);
            return res.status(409).json({ error: 'El email ya está registrado' });
        }
        
        // Crear nuevo usuario; si no existe la columna email, usar username
        const userId = id || crypto.randomUUID();
        console.log(`✅ Creando usuario con id: ${userId}`);
        
        try {
            const result = await pool.query(
                'INSERT INTO users (id, email, password, created_at) VALUES ($1::uuid, $2, $3, NOW()) RETURNING id, email',
                [userId, email, password]
            );
            console.log(`✅ Usuario creado exitosamente:`, result.rows[0]);
            res.json({ id: result.rows[0].id, email: result.rows[0].email, success: true });
        } catch (e) {
            // Si falla por falta de columna email, intentar con username (compatibilidad)
            if (e.code === '42703') {
                const result = await pool.query(
                    'INSERT INTO users (id, username, password, created_at) VALUES ($1::uuid, $2, $3, NOW()) RETURNING id, username',
                    [userId, email, password]
                );
                console.log(`✅ Usuario creado con username:`, result.rows[0]);
                res.json({ id: result.rows[0].id, email: email, success: true });
            } else {
                console.error('❌ Error en INSERT:', e.message, 'Code:', e.code);
                throw e;
            }
        }
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
        const userCheck = await ensureUserExists(userId);
        if (!userCheck.exists) {
            return res.status(400).json({ error: 'Usuario no encontrado. Regístrate o inicia sesión antes de guardar la rutina.' });
        }
        
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
        const userCheck = await ensureUserExists(userId);
        if (!userCheck.exists) {
            return res.status(400).json({ error: 'Usuario no encontrado. Regístrate o inicia sesión antes de guardar la dieta.' });
        }
        
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

// Obtener rutinas del usuario (plural)
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

// Obtener última rutina del usuario (singular - compatibilidad con frontend)
app.get('/api/workout/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.params.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró rutina' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo workout:', err.message);
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
        const recentUsers = await pool.query('SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 10');
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

// Obtener dietas del usuario (plural)
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

// Obtener última dieta del usuario (singular - compatibilidad con frontend)
app.get('/api/diet/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM diet_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.params.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró dieta' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo diet:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Generar rutina con IA
app.post('/api/generate-workout', async (req, res) => {
    if (!ai) {
        return res.status(503).json({ error: 'Servicio de IA no disponible. Configura GEMINI_API_KEY en variables de entorno.' });
    }

    try {
        let { userId, profile, workoutType } = req.body;
        
        if (!userId || !profile || !workoutType) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos: userId, profile, workoutType' });
        }

        console.log(`🤖 Generando rutina para usuario ${userId}, tipo: ${workoutType}`);

        // Validar existencia del usuario para evitar violación de FK
        const userCheck = await ensureUserExists(userId);
        console.log(`🔍 Verificación de usuario:`, userCheck);
        
        if (!userCheck.exists) {
            console.error(`❌ Usuario NO pudo ser verificado/creado`);
            return res.status(400).json({ error: 'Usuario no encontrado. Regístrate o inicia sesión antes de generar una rutina.' });
        }
        
        // Usar el ID validado/generado
        userId = userCheck.id || userId;
        console.log(`✅ Usuario ${userId} verificado, procediendo con generación...`);

        // Desestructurar datos del perfil y opciones
        const { age, gender, weight, height, goal, activityLevel, equipment, injuries } = profile;
        const { frequency, selectedDays, focus, duration } = req.body;
        
        // Determinar días de entrenamiento y descanso
        const allDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const trainingDays = selectedDays && selectedDays.length > 0 ? selectedDays : ['Lunes', 'Miércoles', 'Viernes'];
        const restDays = allDays.filter(d => !trainingDays.includes(d));
        
        console.log(`📅 Días de entrenamiento: ${trainingDays.join(', ')}`);
        console.log(`😴 Días de descanso: ${restDays.join(', ')}`);

        // Construir prompt científicamente fundamentado
        const prompt = `ERES UN ESPECIALISTA EN CIENCIAS DEL DEPORTE Y ENTRENAMIENTO. Crea un plan de entrenamiento PERSONALIZADO y DETALLADO basado en:

PERFIL DEL USUARIO:
- Edad: ${age} años
- Género: ${gender}
- Peso: ${weight}kg | Altura: ${height}cm
- Objetivo: ${goal}
- Nivel de actividad: ${activityLevel}
- Equipo disponible: ${equipment ? (Array.isArray(equipment) ? equipment.join(', ') : equipment) : 'Ninguno'}
- Lesiones/limitaciones: ${injuries || 'Ninguna'}
- Tipo de rutina: ${workoutType}
${focus ? `- Enfoque muscular especial: ${focus}` : ''}

DÍAS DE LA SEMANA:
- DÍAS DE ENTRENAMIENTO (crear rutina con ejercicios): ${trainingDays.join(', ')}
- DÍAS DE DESCANSO (sin ejercicios, solo recuperación): ${restDays.join(', ')}

IMPORTANTE: 
- Los días de DESCANSO deben tener "focus": "Descanso" y "exercises": [] (array vacío)
- Solo los días de ENTRENAMIENTO tienen ejercicios

DIRECTRICES:
1. Crea una rutina adaptada al objetivo (ganancia muscular: 4-6 series x 6-12 reps; pérdida grasa: 3-4 series x 8-15 reps; resistencia: 2-3 series x 12-20 reps)
2. MÍNIMO 6-9 ejercicios por día de entrenamiento (no menos de 6)
3. Varía series según el tipo: ejercicios compuestos 4-6 series, aislados 3-4 series
4. Incluye compound lifts (sentadillas, press, deadlifts, rows)
5. Estructura: calentamiento dinámico, ejercicios principales, accesorios, core
6. Rest periods: 2-3 min compuestos, 60-90s aislados
7. Progresión: aumenta peso/reps cada semana
8. Adapta a lesiones si las hay

FORMATO RESPUESTA (SOLO JSON):
{
  "title": "Nombre plan descriptivo",
  "description": "Descripción científica del enfoque",
  "frequency": "X días/semana",
  "estimatedDuration": "X min por sesión",
  "difficulty": "Principiante|Intermedio|Avanzado",
  "durationWeeks": 8-12,
  "progressionNotes": "Cómo progresar cada semana",
  "recommendations": ["Consejo 1", "Consejo 2", "Consejo 3", "Consejo 4"],
  "schedule": [
    {
      "dayName": "Nombre del día",
      "focus": "Grupo muscular principal",
      "warmup": {"exercises": [{"name": "Ejercicio", "sets": 2, "reps": "10-15", "rest": "30s", "intensity": "Baja"}]},
      "exercises": [
        {"name": "Ejercicio 1", "sets": 5, "reps": "5-6", "rest": "180s", "muscleGroup": "Pecho", "category": "compound", "tempo": "2-0-1-0", "description": "Movimiento principal", "tips": "Mantén el pecho arriba", "videoQuery": "bench press form"},
        {"name": "Ejercicio 2", "sets": 4, "reps": "8-10", "rest": "120s", "muscleGroup": "Pecho", "category": "compound", "tempo": "2-0-2-0", "description": "Accesorio", "tips": "Control total", "videoQuery": "incline dumbbell press"},
        {"name": "Ejercicio 3", "sets": 3, "reps": "10-12", "rest": "90s", "muscleGroup": "Tríceps", "category": "compound", "tempo": "2-0-1-0", "description": "Movimiento multi-articular", "tips": "Codos atrás", "videoQuery": "close grip bench press"},
        {"name": "Ejercicio 4", "sets": 3, "reps": "10-12", "rest": "90s", "muscleGroup": "Pecho", "category": "isolation", "tempo": "2-1-1-0", "description": "Aislamiento", "tips": "Stretch máximo", "videoQuery": "cable fly"},
        {"name": "Ejercicio 5", "sets": 3, "reps": "12-15", "rest": "75s", "muscleGroup": "Tríceps", "category": "isolation", "tempo": "1-0-2-0", "description": "Aislamiento", "tips": "Control negativo", "videoQuery": "tricep rope pushdown"},
        {"name": "Ejercicio 6", "sets": 3, "reps": "12-15", "rest": "75s", "muscleGroup": "Hombro anterior", "category": "isolation", "tempo": "2-0-1-0", "description": "Aislamiento", "tips": "Sin momentum", "videoQuery": "lateral raise"},
        {"name": "Ejercicio 7", "sets": 2, "reps": "15-20", "rest": "60s", "muscleGroup": "Pecho", "category": "burnout", "tempo": "1-0-1-0", "description": "Ejercicio de bombeo", "tips": "Alto volumen", "videoQuery": "push ups"}
      ],
      "cooldown": {"exercises": [{"name": "Core trabajo", "sets": 2, "reps": "8-12", "rest": "45s", "muscleGroup": "Core", "category": "core"}]}
    }
  ]
}

GENERA AHORA LA RUTINA COMPLETA EN JSON:`;

        console.log('📤 Llamando a Gemini...');
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const response = result.response;
        const responseText = response.text();

        if (!responseText) {
            throw new Error('Gemini no devolvió respuesta');
        }

        console.log('📥 Respuesta recibida, primeros 200 chars:', responseText.substring(0, 200));

        // Usar función de limpieza y parsing robusta
        let workoutPlan;
        try {
            workoutPlan = cleanAndParseJSON(responseText);
        } catch (parseErr) {
            console.error('❌ Error parseando JSON:', parseErr.message);
            throw parseErr;
        }

        // Log del plan parseado
        console.log('📊 Plan parseado - schedule length:', workoutPlan?.schedule?.length || 0);
        if (workoutPlan?.schedule) {
            workoutPlan.schedule.forEach((d, i) => {
                console.log(`  📅 Día ${i}: ${d.dayName || d.day} - ${d.exercises?.length || 0} ejercicios`);
            });
        }

        // Asegurar 7 días y volumen mínimo de ejercicios por día (6+) excepto descansos
        if (workoutPlan) {
            const schedule = ensureSevenDaysSchedule(workoutPlan.schedule || [], restDays);
            workoutPlan.schedule = schedule.map(day => {
                // Si es día de descanso, no agregar ejercicios
                const isRestDay = day.focus && day.focus.toLowerCase().includes('descanso');
                const isDayInRestList = restDays.includes(day.dayName || day.day);
                
                if (isRestDay || isDayInRestList) {
                    return { 
                        dayName: day.dayName || day.day, 
                        focus: 'Descanso', 
                        exercises: [],
                        isRestDay: true
                    };
                }
                return padExercisesToMinimum(day);
            });
            
            // Log final
            console.log('📊 Schedule final después de procesamiento:');
            workoutPlan.schedule.forEach((d, i) => {
                console.log(`  ✅ ${d.dayName}: ${d.focus} - ${d.exercises?.length || 0} ejercicios`);
            });
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
        let { userId, profile, dietType } = req.body;
        
        if (!userId || !profile || !dietType) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos: userId, profile, dietType' });
        }

        console.log(`🤖 Generando dieta para usuario ${userId}, tipo: ${dietType}`);

        // Validar existencia del usuario para evitar violación de FK
        const userCheck = await ensureUserExists(userId);
        if (!userCheck.exists) {
            return res.status(400).json({ error: 'Usuario no encontrado. Regístrate o inicia sesión antes de generar una dieta.' });
        }
        
        // Usar el ID validado/generado
        userId = userCheck.id || userId;

        // Desestructurar datos del perfil
        const { age, gender, weight, height, goal, activityLevel } = profile;
        
        // Calcular calorías estimadas
        const bmr = gender === 'Femenino' 
            ? 10 * weight + 6.25 * height - 5 * age - 161
            : 10 * weight + 6.25 * height - 5 * age + 5;
        
        const activityMultipliers = {
            'Sedentario': 1.2, 'Ligero': 1.375, 'Moderado': 1.55, 'Activo': 1.725, 'Muy activo': 1.9
        };
        
        const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.55));
        const calorieTarget = goal === 'Ganar masa' ? tdee + 300 : goal === 'Perder grasa' ? tdee - 400 : tdee;
        const proteinG = Math.round(weight * 1.6);

        // Prompt simplificado pero científico
        const prompt = `Crea un plan de dieta DETALLADO de 7 días en JSON puro. Usuario: ${age} años, ${weight}kg, objetivo: ${goal}, ${dietType}.

REQUISITOS:
- Calorías diarias: ${calorieTarget}kcal
- Proteína mínima: ${proteinG}g
- 5 comidas por día (Desayuno, Snack AM, Almuerzo, Snack PM, Cena)
- Alimentos reales con calorías exactas
- OBLIGATORIO: Incluir ingredients (lista de ingredientes con cantidades) e instructions (pasos de preparación) para CADA comida

RESPONDE SOLO CON JSON (sin markdown, explicaciones ni comillas extras):
{
  "title": "Plan ${dietType}",
  "description": "Plan nutricional personalizado de 7 días",
  "dailyCalories": ${calorieTarget},
  "proteinTarget": ${proteinG},
  "dailyTargets": {"calories": ${calorieTarget}, "protein": ${proteinG}, "carbs": ${Math.round(calorieTarget * 0.45 / 4)}, "fats": ${Math.round(calorieTarget * 0.25 / 9)}},
  "mealPlan": [
    {
      "day": "Lunes",
      "meals": [
        {
          "name": "Desayuno",
          "type": "Desayuno",
          "time": "7:00",
          "description": "Descripción breve del platillo",
          "calories": 450,
          "protein": 25,
          "carbs": 45,
          "fats": 15,
          "prepTime": "15 min",
          "ingredients": ["3 huevos enteros", "2 rebanadas pan integral", "1 plátano mediano", "1 cucharada aceite oliva"],
          "instructions": ["Calentar sartén con aceite", "Batir huevos y cocinar revolviendo", "Tostar el pan", "Servir con plátano cortado"]
        }
      ]
    }
  ],
  "hydrationRecommendation": "Bebe 2-3 litros de agua al día",
  "scientificBasis": ["Base científica 1", "Base científica 2"],
  "tips": ["Consejo 1", "Consejo 2"]
}

IMPORTANTE: Cada comida DEBE tener ingredients (array de strings) e instructions (array de strings con pasos). Genera los 7 días COMPLETOS con 5 comidas cada uno.`;

        console.log('📤 Llamando a Gemini...');
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const response = result.response;
        const responseText = response.text();

        if (!responseText) {
            throw new Error('Gemini no devolvió respuesta');
        }

        console.log('📥 Respuesta recibida');

        // Usar función de limpieza y parsing robusta
        let dietPlan;
        try {
            dietPlan = cleanAndParseJSON(responseText);
        } catch (parseErr) {
            console.error('❌ Error parseando JSON:', parseErr.message);
            throw parseErr;
        }

        // Normalizar estructura para el frontend: asegurar schedule (alias de mealPlan) y 7 días con comidas
        if (dietPlan) {
            if (!dietPlan.schedule && dietPlan.mealPlan) {
                dietPlan.schedule = dietPlan.mealPlan;
            }
            dietPlan.schedule = ensureSevenDaysMeals(dietPlan.schedule || dietPlan.mealPlan || []);
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

// ===== INTERCAMBIAR EJERCICIO =====
app.post('/api/swap-exercise', async (req, res) => {
    if (!ai) {
        return res.status(503).json({ error: 'Servicio de IA no disponible' });
    }

    try {
        const { currentExercise, muscleGroup, availableEquipment, exercisesToAvoid, userProfile } = req.body;
        
        console.log(`🔄 Intercambiando ejercicio: ${currentExercise} (${muscleGroup})`);
        
        const equipmentStr = availableEquipment?.length > 0 
            ? availableEquipment.join(', ') 
            : 'Gimnasio completo';
        
        const avoidStr = exercisesToAvoid?.length > 0 
            ? `NO uses estos ejercicios: ${exercisesToAvoid.join(', ')}` 
            : '';

        const prompt = `Genera UN ejercicio alternativo para reemplazar "${currentExercise}" que trabaje el mismo grupo muscular (${muscleGroup}).

Equipamiento disponible: ${equipmentStr}
${avoidStr}

RESPONDE SOLO CON JSON (sin markdown):
{
  "name": "Nombre del ejercicio alternativo",
  "sets": 4,
  "reps": "8-12",
  "rest": "90s",
  "muscleGroup": "${muscleGroup}",
  "category": "compound o isolation",
  "tempo": "2-0-1-0",
  "description": "Descripción breve del movimiento",
  "tips": "Consejo de técnica",
  "videoQuery": "nombre ejercicio form tutorial"
}`;

        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const responseText = result.response.text();
        const newExercise = cleanAndParseJSON(responseText);

        console.log('✅ Ejercicio alternativo:', newExercise.name);
        res.json({ newExercise });
    } catch (err) {
        console.error('❌ Error swap-exercise:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ===== INTERCAMBIAR PLATILLO =====
app.post('/api/swap-meal', async (req, res) => {
    if (!ai) {
        return res.status(503).json({ error: 'Servicio de IA no disponible' });
    }

    try {
        const { currentMeal, mealType, dietType, targetMacros, preferences, mealsToAvoid, userProfile } = req.body;
        
        console.log(`🔄 Intercambiando platillo: ${currentMeal?.name} (${mealType})`);
        
        const prefsStr = preferences?.length > 0 
            ? `Preferencias: ${preferences.join(', ')}` 
            : '';
        
        const avoidStr = mealsToAvoid?.length > 0 
            ? `NO uses estos platillos: ${mealsToAvoid.slice(0, 10).join(', ')}` 
            : '';
        
        const macrosStr = targetMacros 
            ? `Macros objetivo: ~${targetMacros.calories}kcal, ${targetMacros.protein}g proteína, ${targetMacros.carbs}g carbos, ${targetMacros.fats}g grasas`
            : '';

        const prompt = `Genera UN platillo alternativo para reemplazar "${currentMeal?.name || mealType}" para ${mealType}.

Tipo de dieta: ${dietType}
${macrosStr}
${prefsStr}
${avoidStr}

RESPONDE SOLO CON JSON (sin markdown):
{
  "name": "Nombre del platillo",
  "type": "${mealType}",
  "time": "${currentMeal?.time || '12:00'}",
  "description": "Descripción apetitosa del platillo",
  "calories": 450,
  "protein": 30,
  "carbs": 40,
  "fats": 15,
  "prepTime": "20 min",
  "ingredients": ["Ingrediente 1 con cantidad", "Ingrediente 2 con cantidad", "Ingrediente 3 con cantidad"],
  "instructions": ["Paso 1 de preparación", "Paso 2 de preparación", "Paso 3 de preparación"]
}`;

        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const responseText = result.response.text();
        let newMeal = cleanAndParseJSON(responseText);
        
        // Asegurar que tiene todos los campos necesarios
        newMeal = {
            ...newMeal,
            name: newMeal.name || 'Platillo alternativo',
            type: newMeal.type || mealType,
            calories: newMeal.calories || targetMacros?.calories || 400,
            protein: newMeal.protein || targetMacros?.protein || 25,
            carbs: newMeal.carbs || targetMacros?.carbs || 40,
            fats: newMeal.fats || targetMacros?.fats || 15,
            ingredients: newMeal.ingredients || ['Ingrediente 1', 'Ingrediente 2'],
            instructions: newMeal.instructions || ['Preparar ingredientes', 'Cocinar', 'Servir'],
            prepTime: newMeal.prepTime || '15 min'
        };

        console.log('✅ Platillo alternativo:', newMeal.name);
        res.json({ newMeal });
    } catch (err) {
        console.error('❌ Error swap-meal:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('❌ Excepción no capturada:', err);
    // NO hacer exit para mantener el servidor corriendo
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
});

// Mantener el proceso vivo
setInterval(() => {}, 1 << 30); // Keepalive
