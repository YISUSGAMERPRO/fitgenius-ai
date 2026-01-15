import { Pool } from 'pg';

// Conexión a Neon PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Verificar existencia de usuario para evitar violaciones de FK
async function ensureUserExists(userId) {
    if (!userId) return { exists: false };
    try {
        const result = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [userId]);
        return { exists: result.rows.length > 0 };
    } catch (e) {
        console.error('⚠️ Error verificando usuario:', e.message);
        return { exists: false };
    }
}

// Función handler de Netlify Functions
export const handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    const path = event.path.replace('/.netlify/functions/api', '') || '/';
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    try {
        // ============ RUTAS ============

        // Login
        if (path === '/login' && method === 'POST') {
            const { username, password } = body;
            
            const result = await pool.query(
                'SELECT * FROM users WHERE username = $1 AND password = $2',
                [username, password]
            );
            
            if (result.rows.length === 0) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Credenciales inválidas' })
                };
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.rows[0])
            };
        }

        // Obtener miembros del gym
        if (path === '/members' && method === 'GET') {
            const result = await pool.query('SELECT * FROM gym_members');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.rows)
            };
        }

        // Generar rutina con IA
        if (path === '/generate-workout' && method === 'POST') {
            if (!ai) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'IA no disponible' })
                };
            }

            const { userGoal, frequency, duration } = body;
            
            const prompt = `Crea una rutina de ejercicios detallada:
- Objetivo: ${userGoal}
- Frecuencia: ${frequency} días/semana
- Duración de sesión: ${duration} minutos
Formato: JSON con ejercicios, series, repeticiones`;

            const response = await ai.generateContent(prompt);
            const text = response.response?.text?.();
            
            const jsonMatch = text?.match(/\{[\s\S]*\}/);
            const workout = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'No se pudo generar' };
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(workout)
            };
        }

        // Generar dieta con IA
        if (path === '/generate-diet' && method === 'POST') {
            if (!ai) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'IA no disponible' })
                };
            }

            const { userGoal, calories, dietary } = body;
            
            const prompt = `Crea un plan de dieta detallado:
- Objetivo: ${userGoal}
- Calorías/día: ${calories}
- Restricciones: ${dietary}
Formato: JSON con comidas, macros, recetas`;

            const response = await ai.generateContent(prompt);
            const text = response.response?.text?.();
            
            const jsonMatch = text?.match(/\{[\s\S]*\}/);
            const diet = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'No se pudo generar' };
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(diet)
            };
        }

        // Guardar rutina
        if (path === '/save-workout' && method === 'POST') {
            const { userId, title, planData } = body;
            const id = Date.now().toString();
            
            // Verificar existencia del usuario para evitar violación de FK
            const userCheck = await ensureUserExists(userId);
            if (!userCheck.exists) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Usuario no encontrado. Regístrate o inicia sesión antes de guardar la rutina.' })
                };
            }
            
            await pool.query(
                'INSERT INTO workout_plans (id, user_id, title, plan_data) VALUES ($1, $2, $3, $4)',
                [id, userId, title, JSON.stringify(planData)]
            );
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ id, success: true })
            };
        }

        // Guardar dieta
        if (path === '/save-diet' && method === 'POST') {
            const { userId, title, planData } = body;
            const id = Date.now().toString();
            
            // Verificar existencia del usuario para evitar violación de FK
            const userCheck = await ensureUserExists(userId);
            if (!userCheck.exists) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Usuario no encontrado. Regístrata o inicia sesión antes de guardar la dieta.' })
                };
            }
            
            await pool.query(
                'INSERT INTO diet_plans (id, user_id, title, plan_data) VALUES ($1, $2, $3, $4)',
                [id, userId, title, JSON.stringify(planData)]
            );
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ id, success: true })
            };
        }

        // Health check
        if (path === '/health' && method === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() })
            };
        }

        // Ruta no encontrada
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Ruta no encontrada' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
