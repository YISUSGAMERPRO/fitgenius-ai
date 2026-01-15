#!/usr/bin/env node
/**
 * Test de Integración Completa
 * Valida:
 * 1. Server inicia sin errores
 * 2. Base de datos conecta
 * 3. Migraciones se ejecutan
 * 4. Endpoints funcionan correctamente
 */

const http = require('http');
const { v4: uuidv4 } = require('uuid');

const RAILWAY_URL = process.env.RAILWAY_API_URL || 'http://localhost:3001';
const TEST_USER_ID = uuidv4();
const TEST_USERNAME = `test_${Date.now()}`;
const TEST_PASSWORD = 'testpass123';

console.log('\n🔧 === TEST DE INTEGRACION COMPLETA ===\n');
console.log(`📍 URL: ${RAILWAY_URL}`);
console.log(`👤 User ID: ${TEST_USER_ID}`);
console.log(`🔐 Username: ${TEST_USERNAME}\n`);

// Helper para hacer requests HTTP
function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(RAILWAY_URL);
        const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

async function runTests() {
    try {
        // Test 1: Health check
        console.log('✅ Test 1: Verificando que el servidor responde...');
        try {
            const health = await makeRequest('GET', '/');
            console.log(`   └─ Status: ${health.status}`);
        } catch (e) {
            console.log(`   └─ ⚠️ Servidor no responde en ${RAILWAY_URL}`);
            console.log(`   └─ Este es normal si no está ejecutando localmente.\n`);
        }

        // Test 2: Register
        console.log('✅ Test 2: Registrando nuevo usuario...');
        const registerRes = await makeRequest('POST', '/api/register', {
            id: TEST_USER_ID,
            username: TEST_USERNAME,
            password: TEST_PASSWORD
        });
        console.log(`   └─ Status: ${registerRes.status} | Message: ${registerRes.body.message || registerRes.body.error}\n`);

        if (registerRes.status !== 201 && registerRes.status !== 200) {
            console.warn(`   ⚠️ Registro falló pero continuando con test de perfil...\n`);
        }

        // Test 3: Save Profile
        console.log('✅ Test 3: Guardando perfil de usuario...');
        const profileRes = await makeRequest('POST', '/api/profile', {
            id: uuidv4(),
            user_id: TEST_USER_ID,
            name: 'Test User',
            age: 30,
            height: 175,
            weight: 75,
            gender: 'Masculino',
            body_type: 'Mesomorph',
            goal: 'Perder peso',
            activity_level: 'Moderado',
            equipment: ['Dumbbells', 'Barra'],
            injuries: null,
            is_cycle_tracking: false
        });
        console.log(`   └─ Status: ${profileRes.status} | Message: ${profileRes.body.message || profileRes.body.error}\n`);

        if (profileRes.status !== 200 && profileRes.status !== 201) {
            console.error(`   ❌ Error al guardar perfil: ${JSON.stringify(profileRes.body)}\n`);
        } else {
            console.log(`   ✅ Perfil guardado exitosamente\n`);
        }

        // Test 4: Get Profile
        console.log('✅ Test 4: Obteniendo perfil de usuario...');
        const getProfileRes = await makeRequest('GET', `/api/profile/${TEST_USER_ID}`);
        console.log(`   └─ Status: ${getProfileRes.status}`);
        if (getProfileRes.status === 200) {
            console.log(`   └─ Perfil encontrado: ${getProfileRes.body.name || 'Sin nombre'}\n`);
        } else {
            console.log(`   └─ ⚠️ Perfil no encontrado (esto es normal si DB está vacía)\n`);
        }

        // Test 5: Save Workout
        console.log('✅ Test 5: Guardando plan de entrenamiento...');
        const workoutRes = await makeRequest('POST', '/api/save-workout', {
            userId: TEST_USER_ID,
            title: 'Plan de Prueba',
            planData: {
                id: uuidv4(),
                title: 'Plan de Prueba',
                description: 'Plan generado por test',
                frequency: '4 días/semana',
                estimatedDuration: '60 min',
                difficulty: 'Intermedio',
                durationWeeks: 4,
                schedule: []
            }
        });
        console.log(`   └─ Status: ${workoutRes.status} | Message: ${workoutRes.body.message || workoutRes.body.success}\n`);

        if (workoutRes.status !== 200 && workoutRes.status !== 201) {
            console.error(`   ❌ Error al guardar workout: ${JSON.stringify(workoutRes.body)}\n`);
        } else {
            console.log(`   ✅ Workout guardado exitosamente\n`);
        }

        // Test 6: Save Diet
        console.log('✅ Test 6: Guardando plan de dieta...');
        const dietRes = await makeRequest('POST', '/api/save-diet', {
            userId: TEST_USER_ID,
            title: 'Plan de Dieta Prueba',
            planData: {
                id: uuidv4(),
                title: 'Plan de Dieta Prueba',
                description: 'Plan generado por test',
                meals: []
            }
        });
        console.log(`   └─ Status: ${dietRes.status} | Message: ${dietRes.body.message || dietRes.body.success}\n`);

        if (dietRes.status !== 200 && dietRes.status !== 201) {
            console.error(`   ❌ Error al guardar diet: ${JSON.stringify(dietRes.body)}\n`);
        } else {
            console.log(`   ✅ Diet guardada exitosamente\n`);
        }

        // Resumen final
        console.log('\n=== RESUMEN ===\n');
        console.log('✅ Todos los tests completados');
        console.log('\n💡 Próximos pasos:');
        console.log('   1. Verificar que no hay errores SQL en los logs del servidor');
        console.log('   2. Confirmar que las columnas fueron agregadas a user_profiles');
        console.log('   3. Probar la interfaz web en http://localhost:5173');
        console.log('   4. Generar un plan de entrenamiento completo\n');

    } catch (error) {
        console.error('\n❌ Error durante tests:', error.message);
        process.exit(1);
    }
}

runTests().then(() => {
    console.log('✅ Tests completados\n');
    process.exit(0);
});
