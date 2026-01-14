const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(compression());

// Conexión a Neon PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📡 DATABASE_URL: ${process.env.DATABASE_URL ? 'Configurada ✅' : 'NO configurada ❌'}`);
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
