
const express = require('express');
const mysql = require('mysql2');
const { Pool } = require('pg');
const cors = require('cors');
const compression = require('compression');
const PDFDocument = require('pdfkit');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
require('dotenv').config();

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

// Middlewares de Performance
app.use(compression()); // Comprime respuestas gzip
app.use(cors()); // Permite comunicación entre frontend y backend
app.use(express.json()); // Permite leer JSON en las peticiones

// Configuración de la conexión a MySQL
let db;
let usePostgres = false;
let pgPool = null;

// Construir URL de conexión automáticamente desde variables de entorno
function getConnectionConfig() {
    // PRIORIDAD 1: Si existe DATABASE_URL, usar esa (Railway automáticamente la proporciona)
    if (process.env.DATABASE_URL) {
        const isPg = process.env.DATABASE_URL.startsWith('postgres');
        console.log(`📡 Conectando usando DATABASE_URL (${isPg ? 'PostgreSQL' : 'MySQL'})...`);
        console.log('DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
        return process.env.DATABASE_URL;
    }
    
    // PRIORIDAD 1.5: Si existe MYSQL_URL (alternativa de Railway), usar esa
    if (process.env.MYSQL_URL) {
        console.log('📡 Conectando a Railway MySQL usando MYSQL_URL...');
        console.log('MYSQL_URL:', process.env.MYSQL_URL.replace(/:[^:]*@/, ':****@'));
        return process.env.MYSQL_URL;
    }
    
    // PRIORIDAD 1.6: Postgres explícito
    if (process.env.PG_DATABASE_URL || process.env.POSTGRES_URL) {
        const url = process.env.PG_DATABASE_URL || process.env.POSTGRES_URL;
        console.log('📡 Conectando a PostgreSQL usando PG_DATABASE_URL/POSTGRES_URL...');
        console.log('PG URL:', url.replace(/:[^:]*@/, ':****@'));
        return url;
    }

    // PRIORIDAD 1.7: Netlify Neon (variables de extensión)
    if (process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL) {
        const url = process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL;
        console.log('📡 Conectando a PostgreSQL (Neon) usando NETLIFY_DATABASE_URL...');
        console.log('NETLIFY DB URL:', url.replace(/:[^:]*@/, ':****@'));
        return url;
    }
    
    // PRIORIDAD 2: Si existe DB_HOST, usar esos parámetros (configuración manual)
    if (process.env.DB_HOST) {
        console.log('📡 Conectando a MySQL con variables de entorno manuales...');
        console.log('DB_HOST:', process.env.DB_HOST);
        console.log('DB_PORT:', process.env.DB_PORT || 3306);
        console.log('DB_USER:', process.env.DB_USER || 'root');
        console.log('DB_NAME:', process.env.DB_NAME || 'railway');
        return {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'railway',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 60000,
            timezone: '+00:00'
        };
    }
    
    // FALLBACK: Usar localhost (solo para desarrollo local)
    console.log('📡 Usando configuración local XAMPP (desarrollo)');
    return {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'fitgenius_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

const connectionConfig = getConnectionConfig();

// Detectar driver según esquema
if (typeof connectionConfig === 'string' && connectionConfig.startsWith('postgres')) {
    usePostgres = true;
    try {
        // Usar el connection string directamente para respetar query params (sslmode, uselibpqcompat, channel_binding)
        console.log('📡 Inicializando Pool PostgreSQL con connectionString (parámetros respetados)');
        pgPool = new Pool({ connectionString: connectionConfig, ssl: { rejectUnauthorized: false } });

        // Wrapper para uniformar interfaz (convertir ? a $1, $2 ...)
        db = {
            query: (sql, params, cb) => {
                let idx = 0;
                const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
                pgPool.query(pgSql, params)
                    .then(result => cb(null, result.rows))
                    .catch(err => cb(err));
            }
        };

        pgPool.connect()
            .then(client => {
                client.release();
                console.log('✅ Conectado a la base de datos PostgreSQL con éxito.');
                createTablesIfNotExist();
            })
            .catch(err => {
                console.error('❌ Error conectando a PostgreSQL:', err.message);
            });
    } catch (err) {
        console.error('❌ Error inicializando PostgreSQL Pool:', err.message);
        console.error('Stack:', err.stack);
    }
} else {
    // MySQL por defecto
    db = mysql.createConnection(connectionConfig);
    db.connect(err => {
        if (err) {
            console.error('❌ Error conectando a MySQL:', err.message);
            console.error('Código de error:', err.code);
            console.log('\n🔍 Revisa tu configuración de base de datos:');
            console.log('  - DATABASE_URL (proporcionada por Railway automáticamente)');
            console.log('  - O configura manualmente: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
            console.log('\n⚠️ Variables de entorno actuales:');
            console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada ✓' : 'No configurada ✗');
            console.log('  DB_HOST:', process.env.DB_HOST || 'No configurada');
            console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Configurada ✓' : 'No configurada ✗');
            console.log('  PORT:', process.env.PORT || PORT);
            return;
        }
        console.log('✅ Conectado a la base de datos MySQL con éxito.');
        console.log('🗄️ Base de datos:', process.env.DB_NAME || 'railway');
        createTablesIfNotExist();
    });
}

// Función para crear tablas automáticamente
function createTablesIfNotExist() {
    if (usePostgres) {
        const tablesPg = [
            `CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS user_profiles (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                age INT NOT NULL,
                height NUMERIC(5,2) NOT NULL,
                weight NUMERIC(5,2) NOT NULL,
                gender TEXT NOT NULL,
                body_type VARCHAR(50) NOT NULL,
                goal VARCHAR(100) NOT NULL,
                activity_level VARCHAR(50) NOT NULL,
                equipment JSONB,
                injuries TEXT,
                is_cycle_tracking BOOLEAN DEFAULT FALSE,
                last_period_start DATE,
                cycle_length INT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS gym_members (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                phone VARCHAR(20),
                plan VARCHAR(50) NOT NULL,
                start_date DATE,
                status TEXT DEFAULT 'active',
                last_payment_date DATE,
                last_payment_amount NUMERIC(10,2),
                subscription_end_date DATE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS workout_plans (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                frequency VARCHAR(100),
                estimated_duration VARCHAR(100),
                difficulty VARCHAR(50),
                duration_weeks INT,
                plan_data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS diet_plans (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                total_calories_per_day INT,
                plan_data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                login_time TIMESTAMP DEFAULT NOW(),
                ip_address VARCHAR(45),
                user_agent TEXT,
                session_duration_minutes INT,
                logout_time TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`
        ];
        tablesPg.forEach((sql, i) => {
            pgPool.query(sql).then(() => {
                console.log(`✅ Tabla ${i + 1} verificada/creada correctamente`);
            }).catch(err => {
                console.error(`❌ Error creando tabla ${i + 1}:`, err.message);
            });
        });
    } else {
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_username (username)
            )`,
            `CREATE TABLE IF NOT EXISTS user_profiles (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                age INT NOT NULL,
                height DECIMAL(5,2) NOT NULL,
                weight DECIMAL(5,2) NOT NULL,
                gender ENUM('male', 'female', 'other') NOT NULL,
                body_type VARCHAR(50) NOT NULL,
                goal VARCHAR(100) NOT NULL,
                activity_level VARCHAR(50) NOT NULL,
                equipment JSON,
                injuries TEXT,
                is_cycle_tracking BOOLEAN DEFAULT FALSE,
                last_period_start DATE,
                cycle_length INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS gym_members (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                phone VARCHAR(20),
                plan VARCHAR(50) NOT NULL,
                start_date DATE NOT NULL,
                status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
                last_payment_date DATE,
                last_payment_amount DECIMAL(10,2),
                subscription_end_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status)
            )`,
            `CREATE TABLE IF NOT EXISTS workout_plans (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                frequency VARCHAR(100),
                estimated_duration VARCHAR(100),
                difficulty VARCHAR(50),
                duration_weeks INT,
                plan_data JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_workout (user_id),
                INDEX idx_created (created_at)
            )`,
            `CREATE TABLE IF NOT EXISTS diet_plans (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                total_calories_per_day INT,
                plan_data JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_diet (user_id),
                INDEX idx_created_diet (created_at)
            )`,
            `CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT,
                session_duration_minutes INT,
                logout_time TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_session (user_id),
                INDEX idx_login_time (login_time)
            )`
        ];
        tables.forEach((tableSQL, index) => {
            db.query(tableSQL, (err) => {
                if (err) {
                    console.error(`❌ Error creando tabla ${index + 1}:`, err.message);
                } else {
                    console.log(`✅ Tabla ${index + 1} verificada/creada correctamente`);
                }
            });
        });
    }
}

// Middleware de caché HTTP para respuestas GET (no usar en datos sensibles)
const cacheControl = (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutos
    next();
};

// Middleware para desactivar caché
const noCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
};

// --- RUTAS DE LA API ---

// 1. LOGIN DE USUARIOS
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT id, username, created_at FROM users WHERE username = ? AND password = ?';
    
    // Obtener IP y User-Agent para el registro de sesión
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            const user = results[0];
            
            // Registrar la sesión en user_sessions
            const sessionSql = 'INSERT INTO user_sessions (user_id, ip_address, user_agent) VALUES (?, ?, ?)';
            db.query(sessionSql, [user.id, ipAddress, userAgent], (sessionErr) => {
                if (sessionErr) {
                    console.error('⚠️ Error registrando sesión:', sessionErr.message);
                    // No bloquear el login si falla el registro de sesión
                } else {
                    console.log(`✅ Sesión registrada para usuario: ${user.username}`);
                }
            });
            
            res.json(user);
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    });
});

// 2. REGISTRO DE USUARIOS
app.post('/api/register', (req, res) => {
    const { id, username, password } = req.body;
    const sql = 'INSERT INTO users (id, username, password) VALUES (?, ?, ?)';
    
    db.query(sql, [id, username, password], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    });
});

// 3. OBTENER MIEMBROS DEL GIMNASIO
app.get('/api/members', cacheControl, (req, res) => {
    db.query('SELECT id, name, plan, status, last_payment_date, last_payment_amount, subscription_end_date FROM gym_members ORDER BY last_payment_date DESC LIMIT 100', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 4. GUARDAR NUEVO MIEMBRO
app.post('/api/members', (req, res) => {
    const { id, name, plan, status, lastPaymentDate, lastPaymentAmount, subscriptionEndDate, joinDate } = req.body;
    
    const sql = `INSERT INTO gym_members 
        (id, name, plan, status, last_payment_date, last_payment_amount, subscription_end_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [
        id, 
        name, 
        plan, 
        status || 'Activo', 
        lastPaymentDate, 
        lastPaymentAmount || 0, 
        subscriptionEndDate
    ], (err, result) => {
        if (err) {
            console.error('❌ Error al guardar miembro:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('✅ Miembro guardado con éxito');
        res.status(201).json({ message: 'Miembro guardado', id: result.insertId });
    });
});

// 5. ELIMINAR MIEMBRO
app.delete('/api/members/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM gym_members WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Miembro eliminado' });
    });
});

// --- RUTAS DE PERFILES DE USUARIO ---

// 6. OBTENER PERFIL DE USUARIO
app.get('/api/profile/:userId', noCache, (req, res) => {
    const { userId } = req.params;
    const sql = 'SELECT id, user_id, name, age, height, weight, gender, body_type, goal, activity_level, equipment, injuries, is_cycle_tracking, last_period_start, cycle_length FROM user_profiles WHERE user_id = ?';
    
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            // Parsear JSON fields
            const profile = results[0];
            if (profile.equipment) {
                try {
                    profile.equipment = JSON.parse(profile.equipment);
                } catch (e) {
                    profile.equipment = [];
                }
            }
            // Mapear género desde DB (inglés) a frontend (español)
            const genderMapFromDb = {
                male: 'Masculino',
                female: 'Femenino',
                other: 'Otro'
            };
            if (profile.gender && genderMapFromDb[profile.gender]) {
                profile.gender = genderMapFromDb[profile.gender];
            }
            res.json(profile);
        } else {
            res.status(404).json({ message: 'Perfil no encontrado' });
        }
    });
});

// 7. GUARDAR O ACTUALIZAR PERFIL DE USUARIO
app.post('/api/profile', (req, res) => {
    const { id, user_id, name, age, height, weight, gender, body_type, goal, activity_level, equipment, injuries, is_cycle_tracking, last_period_start, cycle_length } = req.body;
    
    console.log('📥 Perfil recibido del frontend:', {
        id: id ? 'OK' : 'MISSING',
        user_id: user_id ? 'OK' : 'MISSING',
        name: name || 'MISSING/UNDEFINED',
        age: age || 'MISSING/UNDEFINED',
        height: height || 'MISSING/UNDEFINED',
        weight: weight || 'MISSING/UNDEFINED',
        gender: gender || 'MISSING/UNDEFINED',
        goal: goal || 'MISSING/UNDEFINED',
        activity_level: activity_level || 'MISSING/UNDEFINED'
    });
    
    // Validación de campos requeridos (con fallbacks)
    const validatedName = name || 'Usuario';
    const validatedId = id || `profile_${Date.now()}`;
    
    if (!user_id || !age || !height || !weight || !gender || !goal || !activity_level) {
        console.error('❌ Validación fallida:', {
            user_id: !user_id,
            age: !age,
            height: !height,
            weight: !weight,
            gender: !gender,
            goal: !goal,
            activity_level: !activity_level
        });
        
        return res.status(400).json({ 
            error: 'Faltan campos requeridos',
            missing: {
                user_id: !user_id,
                age: !age,
                height: !height,
                weight: !weight,
                gender: !gender,
                goal: !goal,
                activity_level: !activity_level
            }
        });
    }
    
    // Mapear género desde frontend (español) a DB (inglés)
    const genderMapToDb = {
        'Masculino': 'male',
        'Femenino': 'female',
        'Otro': 'other'
    };
    const normalizedGender = genderMapToDb[gender] || 'other';
    
    // Verificar si el perfil ya existe
    const checkSql = 'SELECT id FROM user_profiles WHERE user_id = ?';
    
    db.query(checkSql, [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let sql;
        let params;
        
        if (results.length > 0) {
            // UPDATE
            sql = `UPDATE user_profiles SET 
                name = ?, age = ?, height = ?, weight = ?, gender = ?, body_type = ?, 
                goal = ?, activity_level = ?, equipment = ?, injuries = ?, 
                is_cycle_tracking = ?, last_period_start = ?, cycle_length = ?
                WHERE user_id = ?`;
            params = [validatedName, age, height, weight, normalizedGender, body_type, goal, activity_level, JSON.stringify(equipment || []), injuries, is_cycle_tracking, last_period_start, cycle_length, user_id];
        } else {
            // INSERT
            sql = `INSERT INTO user_profiles (id, user_id, name, age, height, weight, gender, body_type, goal, activity_level, equipment, injuries, is_cycle_tracking, last_period_start, cycle_length)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            params = [validatedId, user_id, validatedName, age, height, weight, normalizedGender, body_type, goal, activity_level, JSON.stringify(equipment || []), injuries, is_cycle_tracking, last_period_start, cycle_length];
        }
        
        db.query(sql, params, (err, result) => {
            if (err) {
                console.error('❌ Error al guardar perfil:', err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log('✅ Perfil guardado/actualizado con éxito');
            res.json({ message: 'Perfil guardado correctamente' });
        });
    });
});

// --- GENERADOR DE PDF PARA RECETAS ---
app.post('/api/generate-recipe-pdf', (req, res) => {
    const { meal, frequency } = req.body;
    
    if (!meal) {
        return res.status(400).json({ error: 'Datos de comida no proporcionados' });
    }

    try {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `${meal.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        doc.pipe(res);

        // Título
        doc.fontSize(28).font('Helvetica-Bold').text(meal.name, { align: 'center' });
        doc.moveDown(0.5);
        doc.strokeColor('#4ade80').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // Info nutricional
        doc.fontSize(11).font('Helvetica-Bold').text('Información Nutricional', { underline: true });
        doc.moveDown(0.3);
        
        const nutritionData = [
            { label: 'Calorías', value: meal.calories || 0 },
            { label: 'Proteína', value: `${meal.protein || 0}g` },
            { label: 'Carbohidratos', value: `${meal.carbs || 0}g` },
            { label: 'Grasas', value: `${meal.fats || 0}g` },
        ];

        doc.fontSize(10).font('Helvetica');
        const colWidth = 120;
        nutritionData.forEach((item, idx) => {
            const x = 50 + (idx % 2) * (colWidth + 100);
            const y = doc.y + (Math.floor(idx / 2) * 25);
            
            doc.text(`${item.label}:`, x, y, { width: colWidth });
            doc.font('Helvetica-Bold').text(item.value, x + 100, y, { width: 60, align: 'right' });
            doc.font('Helvetica');
        });
        
        doc.moveDown(2);

        // Ingredientes
        doc.fontSize(14).font('Helvetica-Bold').text('Ingredientes', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(10).font('Helvetica');
        if (meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach(ingredient => {
                doc.text(`• ${ingredient}`, { indent: 20 });
            });
        } else {
            doc.text('No hay ingredientes especificados');
        }
        
        doc.moveDown(1.5);

        // Porciones (si están disponibles)
        if (meal.servings) {
            doc.fontSize(14).font('Helvetica-Bold').text('Porciones', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').text(`Rinde: ${meal.servings} porciones`);
            doc.moveDown(1.5);
        }

        // Instrucciones
        doc.fontSize(14).font('Helvetica-Bold').text('Instrucciones', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(10).font('Helvetica');
        if (meal.instructions && Array.isArray(meal.instructions)) {
            meal.instructions.forEach((instruction, idx) => {
                const step = idx + 1;
                doc.font('Helvetica-Bold').text(`Paso ${step}:`, { indent: 0 });
                doc.font('Helvetica').text(instruction, { indent: 20 });
                doc.moveDown(0.3);
            });
        } else {
            doc.text('No hay instrucciones disponibles');
        }

        doc.moveDown(2);

        // Pie de página
        doc.fontSize(8).font('Helvetica').fillColor('#888888')
            .text(`Generado por FitGenius AI - ${new Date().toLocaleDateString('es-ES')}`, {
                align: 'center'
            });

        doc.end();
    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).json({ error: 'Error al generar PDF: ' + error.message });
    }
});

// --- NUEVOS ENDPOINTS PARA GENERACIÓN DE RUTINAS Y DIETAS CON IA ---

// 8. GENERAR RUTINA DE ENTRENAMIENTO
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

        // Construir el prompt para Gemini
        const systemPrompt = `Eres un entrenador personal experto. Crea un plan de entrenamiento SEMANAL (7 días) tipo "${workoutType}" para:
        - Perfil: ${profile.age} años, ${profile.gender}, ${profile.weight}kg, ${profile.height}cm
        - Objetivo: ${profile.goal}
        - Nivel de actividad: ${profile.activityLevel}
        - Equipo disponible: ${(profile.equipment || []).join(', ') || 'Sin equipo específico'}
        - Lesiones: ${profile.injuries || 'Ninguna'}
        
        GENERA 7 DÍAS (Lunes a Domingo). Si hay días de descanso, marca el focus como "Descanso" y deja exercises vacío o con ejercicios de recuperación.
        Cada ejercicio debe tener: name, sets (número), reps (string con rango), rest (tiempo), muscleGroup, category (warmup/main/cooldown), tempo, description, tips, videoQuery.
        
        Genera JSON estructurado.`;

        // Definir schema para la respuesta
        const workoutDaySchema = {
            type: SchemaType.OBJECT,
            properties: {
                dayName: { type: SchemaType.STRING },
                focus: { type: SchemaType.STRING },
                exercises: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            name: { type: SchemaType.STRING },
                            sets: { type: SchemaType.INTEGER },
                            reps: { type: SchemaType.STRING },
                            rest: { type: SchemaType.STRING },
                            muscleGroup: { type: SchemaType.STRING },
                            category: { type: SchemaType.STRING },
                            tempo: { type: SchemaType.STRING },
                            description: { type: SchemaType.STRING },
                            tips: { type: SchemaType.STRING },
                            videoQuery: { type: SchemaType.STRING }
                        },
                        required: ["name", "sets", "reps", "rest", "muscleGroup", "description", "tips", "videoQuery", "category"]
                    }
                }
            },
            required: ["dayName", "focus", "exercises"]
        };

        const workoutPlanSchema = {
            type: SchemaType.OBJECT,
            properties: {
                title: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                frequency: { type: SchemaType.STRING },
                estimatedDuration: { type: SchemaType.STRING },
                difficulty: { type: SchemaType.STRING },
                durationWeeks: { type: SchemaType.INTEGER },
                recommendations: { 
                    type: SchemaType.ARRAY, 
                    items: { type: SchemaType.STRING }
                },
                schedule: {
                    type: SchemaType.ARRAY,
                    items: workoutDaySchema
                }
            },
            required: ["title", "description", "frequency", "schedule", "estimatedDuration", "difficulty", "recommendations", "durationWeeks"]
        };

        // Llamar a Gemini
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const response = await model.generateContent({
            contents: [{role: "user", parts: [{text: systemPrompt}]}],
                generationConfig: {
                responseMimeType: "application/json",
                responseSchema: workoutPlanSchema,
                temperature: 0.8
            }
        });

        if (!response.text) {
            throw new Error('No se recibió respuesta de la IA');
        }

        const workoutPlan = JSON.parse(response.text);
        const planId = require('crypto').randomUUID();

        // Guardar en la base de datos
        const sql = `INSERT INTO workout_plans 
            (id, user_id, title, description, frequency, estimated_duration, difficulty, duration_weeks, plan_data) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [
            planId,
            userId,
            workoutPlan.title,
            workoutPlan.description,
            workoutPlan.frequency,
            workoutPlan.estimatedDuration,
            workoutPlan.difficulty,
            workoutPlan.durationWeeks,
            JSON.stringify(workoutPlan)
        ], (err) => {
            if (err) {
                console.error('❌ Error al guardar rutina en BD:', err);
                return res.status(500).json({ error: 'Error al guardar en base de datos: ' + err.message });
            }
            
            console.log('✅ Rutina generada y guardada con éxito:', planId);
            res.json({ 
                success: true, 
                planId,
                plan: workoutPlan 
            });
        });

    } catch (error) {
        console.error('❌ Error generando rutina:', error);
        res.status(500).json({ error: 'Error al generar rutina: ' + error.message });
    }
});

// 9. GENERAR PLAN DE DIETA
app.post('/api/generate-diet', async (req, res) => {
    if (!ai) {
        return res.status(503).json({ error: 'Servicio de IA no disponible. Configura GEMINI_API_KEY en variables de entorno.' });
    }

    try {
        const { userId, profile, dietType, preferences, budget } = req.body;
        
        if (!userId || !profile || !dietType) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos: userId, profile, dietType' });
        }

        console.log(`🍽️ Generando dieta para usuario ${userId}, tipo: ${dietType}`);

        const preferencesText = (preferences && preferences.length > 0) 
            ? `RESTRICCIONES: ${preferences.join(', ')}` 
            : '';
        
        const budgetText = (budget && budget.amount > 0) 
            ? `PRESUPUESTO: ${budget.amount} MXN (${budget.frequency})` 
            : '';

        // Construir el prompt para Gemini
        const systemPrompt = `Eres un nutricionista deportivo experto. Crea un PLAN SEMANAL (7 DÍAS) de dieta tipo "${dietType}" para:
        - Perfil: ${profile.age} años, ${profile.gender}, ${profile.weight}kg, ${profile.height}cm
        - Objetivo: ${profile.goal}
        - Nivel de actividad: ${profile.activityLevel}
        ${preferencesText}
        ${budgetText}
        
        GENERA 5 COMIDAS DIARIAS: Desayuno, Colación Matutina, Comida, Colación Vespertina, Cena.
        Usa ingredientes disponibles en México con CANTIDADES EXACTAS.
        Cada comida debe incluir: name, description, calories, protein, carbs, fats, ingredients (array con cantidades), instructions (array de pasos).
        
        Genera JSON estructurado para 7 días.`;

        // Schema para la respuesta
        const mealSchema = {
            type: SchemaType.OBJECT,
            properties: {
                name: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                calories: { type: SchemaType.INTEGER },
                protein: { type: SchemaType.INTEGER },
                carbs: { type: SchemaType.INTEGER },
                fats: { type: SchemaType.INTEGER },
                ingredients: { 
                    type: SchemaType.ARRAY, 
                    items: { type: SchemaType.STRING }
                },
                instructions: { 
                    type: SchemaType.ARRAY, 
                    items: { type: SchemaType.STRING }
                }
            },
            required: ["name", "description", "calories", "protein", "carbs", "fats", "ingredients", "instructions"]
        };

        const dailyMealsSchema = {
            type: SchemaType.OBJECT,
            properties: {
                day: { type: SchemaType.STRING },
                meals: {
                    type: SchemaType.ARRAY,
                    items: mealSchema
                }
            },
            required: ["day", "meals"]
        };

        const dietPlanSchema = {
            type: SchemaType.OBJECT,
            properties: {
                title: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                totalCaloriesPerDay: { type: SchemaType.INTEGER },
                weeklyPlan: {
                    type: SchemaType.ARRAY,
                    items: dailyMealsSchema
                }
            },
            required: ["title", "description", "totalCaloriesPerDay", "weeklyPlan"]
        };

        // Llamar a Gemini
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const response = await model.generateContent({
            contents: [{role: "user", parts: [{text: systemPrompt}]}],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: dietPlanSchema,
                temperature: 0.6
            }
        });

        if (!response.text) {
            throw new Error('No se recibió respuesta de la IA');
        }

        const dietPlan = JSON.parse(response.text);
        const planId = require('crypto').randomUUID();

        // Guardar en la base de datos
        const sql = `INSERT INTO diet_plans 
            (id, user_id, title, description, total_calories_per_day, plan_data) 
            VALUES (?, ?, ?, ?, ?, ?)`;

        db.query(sql, [
            planId,
            userId,
            dietPlan.title,
            dietPlan.description,
            dietPlan.totalCaloriesPerDay,
            JSON.stringify(dietPlan)
        ], (err) => {
            if (err) {
                console.error('❌ Error al guardar dieta en BD:', err);
                return res.status(500).json({ error: 'Error al guardar en base de datos: ' + err.message });
            }
            
            console.log('✅ Dieta generada y guardada con éxito:', planId);
            res.json({ 
                success: true, 
                planId,
                plan: dietPlan 
            });
        });

    } catch (error) {
        console.error('❌ Error generando dieta:', error);
        res.status(500).json({ error: 'Error al generar dieta: ' + error.message });
    }
});

// 10. OBTENER ÚLTIMA RUTINA DE USUARIO
app.get('/api/workout/:userId', cacheControl, (req, res) => {
    const { userId } = req.params;
    const sql = 'SELECT * FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
    
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            const workout = results[0];
            workout.plan_data = JSON.parse(workout.plan_data);
            res.json(workout);
        } else {
            res.status(404).json({ message: 'No se encontró rutina' });
        }
    });
});

// 11. OBTENER ÚLTIMA DIETA DE USUARIO
app.get('/api/diet/:userId', cacheControl, (req, res) => {
    const { userId } = req.params;
    const sql = 'SELECT * FROM diet_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
    
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            const diet = results[0];
            diet.plan_data = JSON.parse(diet.plan_data);
            res.json(diet);
        } else {
            res.status(404).json({ message: 'No se encontró dieta' });
        }
    });
});

// 12. HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: pgPool ? 'PostgreSQL' : 'MySQL',
        ai: ai ? 'Gemini AI disponible' : 'IA no configurada'
    });
});

// 13. INTERCAMBIO DE EJERCICIOS
app.post('/api/swap-exercise', async (req, res) => {
    try {
        const { currentExercise, muscleGroup, availableEquipment, exercisesToAvoid, userProfile } = req.body;
        
        if (!ai) {
            return res.status(503).json({ error: 'Servicio de IA no disponible' });
        }

        console.log('🔄 Intercambiando ejercicio:', currentExercise);

        const prompt = `Eres un entrenador personal experto. Sugiere UN ejercicio alternativo para reemplazar "${currentExercise}".

Grupo muscular objetivo: ${muscleGroup}
Equipamiento disponible: ${availableEquipment?.join(', ') || 'Sin restricciones'}
Ejercicios a evitar: ${exercisesToAvoid?.join(', ') || 'Ninguno'}
${userProfile?.injuries ? `Lesiones del usuario: ${userProfile.injuries}` : ''}

Responde SOLO con un objeto JSON válido (sin markdown, sin texto adicional):
{
    "name": "Nombre del ejercicio",
    "sets": 3,
    "reps": "10-12",
    "rest": "60s",
    "description": "Breve descripción de la técnica",
    "muscleGroup": "${muscleGroup}"
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt
        });

        let responseText = response.text.trim();
        // Limpiar markdown si existe
        if (responseText.startsWith('```')) {
            responseText = responseText.replace(/```json?\n?/g, '').replace(/```\n?/g, '');
        }

        const newExercise = JSON.parse(responseText);
        console.log('✅ Ejercicio alternativo generado:', newExercise.name);
        
        res.json({ newExercise });
    } catch (error) {
        console.error('❌ Error intercambiando ejercicio:', error);
        res.status(500).json({ error: 'Error al obtener alternativa: ' + error.message });
    }
});

// 14. INTERCAMBIO DE PLATILLOS
app.post('/api/swap-meal', async (req, res) => {
    try {
        const { currentMeal, mealType, dietType, targetMacros, preferences, mealsToAvoid, userProfile } = req.body;
        
        if (!ai) {
            return res.status(503).json({ error: 'Servicio de IA no disponible' });
        }

        console.log('🔄 Intercambiando platillo:', currentMeal?.name);

        const prompt = `Eres un nutricionista experto. Sugiere UN platillo alternativo para reemplazar "${currentMeal?.name || 'el platillo actual'}".

Tipo de comida: ${mealType}
Tipo de dieta: ${dietType}
${targetMacros ? `Macros objetivo: ~${targetMacros.calories} kcal, ${targetMacros.protein}g proteína, ${targetMacros.carbs}g carbohidratos, ${targetMacros.fats}g grasas` : ''}
Preferencias: ${preferences?.join(', ') || 'Sin preferencias específicas'}
Platillos a evitar: ${mealsToAvoid?.join(', ') || 'Ninguno'}
${userProfile?.goal ? `Objetivo del usuario: ${userProfile.goal}` : ''}

Responde SOLO con un objeto JSON válido (sin markdown, sin texto adicional):
{
    "name": "Nombre del platillo",
    "ingredients": ["ingrediente1", "ingrediente2"],
    "instructions": "Instrucciones breves de preparación",
    "macros": {
        "calories": 400,
        "protein": 30,
        "carbs": 40,
        "fats": 15
    },
    "prepTime": "15 min"
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt
        });

        let responseText = response.text.trim();
        if (responseText.startsWith('```')) {
            responseText = responseText.replace(/```json?\n?/g, '').replace(/```\n?/g, '');
        }

        const newMeal = JSON.parse(responseText);
        console.log('✅ Platillo alternativo generado:', newMeal.name);
        
        res.json({ newMeal });
    } catch (error) {
        console.error('❌ Error intercambiando platillo:', error);
        res.status(500).json({ error: 'Error al obtener alternativa: ' + error.message });
    }
});

// 15. ASISTENTE MÉDICO (Dr. FitGenius)
app.post('/api/medical-assistant', async (req, res) => {
    try {
        const { messages, userProfile, workout, diet } = req.body;
        
        if (!ai) {
            return res.status(503).json({ error: 'Servicio de IA no disponible' });
        }

        console.log('🩺 Consulta al Dr. FitGenius...');

        const userContext = userProfile ? `
Datos del paciente:
- Edad: ${userProfile.age} años
- Peso: ${userProfile.weight} kg
- Altura: ${userProfile.height} cm
- Género: ${userProfile.gender}
- Objetivo: ${userProfile.goal}
- Nivel de actividad: ${userProfile.activityLevel}
${userProfile.injuries ? `- Lesiones/Condiciones: ${userProfile.injuries}` : ''}
` : '';

        const conversationHistory = messages?.map(m => `${m.role === 'user' ? 'Paciente' : 'Dr. FitGenius'}: ${m.text}`).join('\n') || '';

        const prompt = `Eres el Dr. FitGenius, un asistente virtual de salud y fitness con conocimientos médicos generales. 

IMPORTANTE:
- Proporciona consejos generales de salud y fitness
- Siempre recomienda consultar con un profesional médico para diagnósticos o tratamientos
- Sé empático, claro y profesional
- Usa emojis ocasionalmente para ser más amigable
- Responde en español

${userContext}

${workout ? 'El paciente tiene una rutina de ejercicios activa.' : ''}
${diet ? 'El paciente tiene un plan de dieta activo.' : ''}

Conversación previa:
${conversationHistory}

Responde como Dr. FitGenius de manera concisa y útil (máximo 200 palabras).`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt
        });

        const responseText = response.text.trim();
        console.log('✅ Dr. FitGenius respondió');
        
        res.json({ response: responseText });
    } catch (error) {
        console.error('❌ Error en asistente médico:', error);
        res.status(500).json({ error: 'Error en consulta: ' + error.message });
    }
});

// 16. OBTENER HISTORIAL DE SESIONES DE UN USUARIO
app.get('/api/sessions/:userId', cacheControl, (req, res) => {
    const { userId } = req.params;
    const sql = 'SELECT * FROM user_sessions WHERE user_id = ? ORDER BY login_time DESC LIMIT 50';
    
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 14. GUARDAR PLAN DE ENTRENAMIENTO (usado por Netlify Functions)
app.post('/api/save-workout', async (req, res) => {
    try {
        const { userId, title, planData } = req.body || {};

        if (!userId || !planData) {
            return res.status(400).json({ error: 'Faltan parámetros: userId y planData son obligatorios' });
        }

        const id = require('crypto').randomUUID();
        const sql = `INSERT INTO workout_plans (id, user_id, title, plan_data) VALUES (?, ?, ?, ?)`;
        const params = [id, userId, title || 'Plan de Entrenamiento', JSON.stringify(planData)];

        db.query(sql, params, (err) => {
            if (err) {
                console.error('❌ Error al guardar rutina en BD:', err);
                return res.status(500).json({ error: 'Error al guardar en base de datos: ' + err.message });
            }
            console.log('✅ Rutina guardada con éxito:', id);
            res.json({ success: true, planId: id });
        });
    } catch (error) {
        console.error('❌ Error en /api/save-workout:', error);
        res.status(500).json({ error: 'Error al guardar rutina: ' + error.message });
    }
});

// 15. GUARDAR PLAN DE DIETA (usado por Netlify Functions)
app.post('/api/save-diet', async (req, res) => {
    try {
        const { userId, title, description, totalCaloriesPerDay, planData } = req.body || {};

        if (!userId || !planData) {
            return res.status(400).json({ error: 'Faltan parámetros: userId y planData son obligatorios' });
        }

        const id = require('crypto').randomUUID();
        const sql = `INSERT INTO diet_plans (id, user_id, title, description, total_calories_per_day, plan_data) VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [
            id,
            userId,
            title || 'Plan de Dieta',
            description || null,
            Number.isFinite(totalCaloriesPerDay) ? totalCaloriesPerDay : null,
            JSON.stringify(planData)
        ];

        db.query(sql, params, (err) => {
            if (err) {
                console.error('❌ Error al guardar dieta en BD:', err);
                return res.status(500).json({ error: 'Error al guardar en base de datos: ' + err.message });
            }
            console.log('✅ Dieta guardada con éxito:', id);
            res.json({ success: true, planId: id });
        });
    } catch (error) {
        console.error('❌ Error en /api/save-diet:', error);
        res.status(500).json({ error: 'Error al guardar dieta: ' + error.message });
    }
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});

// Manejo de errores
server.on('error', (err) => {
    console.error('❌ Error del servidor:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada sin manejar:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Excepción no capturada:', err);
    process.exit(1);
});
