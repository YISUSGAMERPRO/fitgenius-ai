const https = require('https');

const API_URL = 'fitgenius-ai-production.up.railway.app';

// Generar UUID válido
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const testUserId = generateUUID();

function makeRequest(path, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: API_URL,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: body });
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function makeGetRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_URL,
            path: path,
            method: 'GET'
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: body });
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function runTests() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         FITGENIUS API - PRUEBAS COMPLETAS                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🔑 Test User ID: ${testUserId}`);
    console.log(`🌐 API URL: https://${API_URL}`);
    console.log('');

    let passed = 0;
    let failed = 0;

    // Test 1: Health Check
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 TEST 1: Health Check (/api/health)');
    try {
        const res = await makeGetRequest('/api/health');
        if (res.status === 200) {
            console.log('   ✅ PASSED - Server is running');
            passed++;
        } else {
            console.log(`   ❌ FAILED - Status: ${res.status}`);
            failed++;
        }
    } catch (e) {
        console.log(`   ❌ FAILED - Error: ${e.message}`);
        failed++;
    }

    // Test 2: Register User
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 TEST 2: Registro de Usuario (/api/register)');
    try {
        const res = await makeRequest('/api/register', {
            id: testUserId,
            email: `test_${Date.now()}@fitgenius.app`,
            password: 'test123456'
        });
        const data = JSON.parse(res.body);
        if (res.status === 200 && data.success) {
            console.log('   ✅ PASSED - Usuario registrado');
            console.log(`   📧 Email: ${data.email}`);
            passed++;
        } else {
            console.log(`   ❌ FAILED - Status: ${res.status}, Body: ${res.body.substring(0, 100)}`);
            failed++;
        }
    } catch (e) {
        console.log(`   ❌ FAILED - Error: ${e.message}`);
        failed++;
    }

    // Test 3: Save Profile
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 TEST 3: Guardar Perfil (/api/profile)');
    try {
        const res = await makeRequest('/api/profile', {
            user_id: testUserId,
            name: 'Usuario Test',
            age: 25,
            weight: 75,
            height: 175,
            gender: 'Masculino',
            goal: 'Ganar masa',
            activityLevel: 'Moderado',
            equipment: ['gym', 'dumbbells'],
            injuries: null
        });
        const data = JSON.parse(res.body);
        if (res.status === 200 && data.success) {
            console.log('   ✅ PASSED - Perfil guardado');
            passed++;
        } else {
            console.log(`   ❌ FAILED - Status: ${res.status}, Body: ${res.body.substring(0, 100)}`);
            failed++;
        }
    } catch (e) {
        console.log(`   ❌ FAILED - Error: ${e.message}`);
        failed++;
    }

    // Test 4: Generate Workout
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 TEST 4: Generar Rutina (/api/generate-workout)');
    console.log('   ⏳ Esperando respuesta de IA (puede tardar 10-20s)...');
    try {
        const res = await makeRequest('/api/generate-workout', {
            userId: testUserId,
            profile: {
                age: 25,
                gender: 'Masculino',
                weight: 75,
                height: 175,
                goal: 'Ganar masa',
                activityLevel: 'Moderado',
                equipment: ['gym', 'dumbbells', 'barbell'],
                injuries: null
            },
            workoutType: 'Fuerza'
        });
        
        if (res.status === 200) {
            const data = JSON.parse(res.body);
            const days = data.schedule ? data.schedule.length : 0;
            const exercises = data.schedule ? data.schedule.reduce((acc, d) => acc + (d.exercises ? d.exercises.length : 0), 0) : 0;
            
            console.log('   ✅ PASSED - Rutina generada');
            console.log(`   📋 Título: ${data.title}`);
            console.log(`   📅 Días: ${days}`);
            console.log(`   💪 Ejercicios totales: ${exercises}`);
            
            if (days >= 7 && exercises >= 20) {
                console.log('   ✅ Estructura correcta (7 días, suficientes ejercicios)');
            } else {
                console.log(`   ⚠️  Estructura incompleta (días: ${days}/7, ejercicios: ${exercises})`);
            }
            passed++;
        } else {
            console.log(`   ❌ FAILED - Status: ${res.status}`);
            console.log(`   Error: ${res.body.substring(0, 200)}`);
            failed++;
        }
    } catch (e) {
        console.log(`   ❌ FAILED - Error: ${e.message}`);
        failed++;
    }

    // Test 5: Generate Diet
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 TEST 5: Generar Dieta (/api/generate-diet)');
    console.log('   ⏳ Esperando respuesta de IA (puede tardar 10-20s)...');
    try {
        const res = await makeRequest('/api/generate-diet', {
            userId: testUserId,
            profile: {
                age: 25,
                gender: 'Masculino',
                weight: 75,
                height: 175,
                goal: 'Ganar masa',
                activityLevel: 'Moderado'
            },
            dietType: 'Balanceada'
        });
        
        if (res.status === 200) {
            const data = JSON.parse(res.body);
            const days = data.schedule ? data.schedule.length : (data.mealPlan ? data.mealPlan.length : 0);
            const meals = data.schedule ? data.schedule.reduce((acc, d) => acc + (d.meals ? d.meals.length : 0), 0) : 0;
            
            console.log('   ✅ PASSED - Dieta generada');
            console.log(`   📋 Título: ${data.title}`);
            console.log(`   🔥 Calorías: ${data.dailyCalories}`);
            console.log(`   📅 Días: ${days}`);
            console.log(`   🍽️  Comidas totales: ${meals}`);
            
            if (days >= 7 && meals >= 20) {
                console.log('   ✅ Estructura correcta (7 días, suficientes comidas)');
            } else {
                console.log(`   ⚠️  Estructura incompleta (días: ${days}/7, comidas: ${meals})`);
            }
            passed++;
        } else {
            console.log(`   ❌ FAILED - Status: ${res.status}`);
            console.log(`   Error: ${res.body.substring(0, 200)}`);
            failed++;
        }
    } catch (e) {
        console.log(`   ❌ FAILED - Error: ${e.message}`);
        failed++;
    }

    // Test 6: Get Workout
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 TEST 6: Obtener Rutina Guardada (/api/workout/:userId)');
    try {
        const res = await makeGetRequest(`/api/workout/${testUserId}`);
        if (res.status === 200) {
            const data = JSON.parse(res.body);
            console.log('   ✅ PASSED - Rutina recuperada de BD');
            console.log(`   📋 ID: ${data.id}`);
            passed++;
        } else {
            console.log(`   ❌ FAILED - Status: ${res.status}`);
            failed++;
        }
    } catch (e) {
        console.log(`   ❌ FAILED - Error: ${e.message}`);
        failed++;
    }

    // Test 7: Get Diet
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 TEST 7: Obtener Dieta Guardada (/api/diet/:userId)');
    try {
        const res = await makeGetRequest(`/api/diet/${testUserId}`);
        if (res.status === 200) {
            const data = JSON.parse(res.body);
            console.log('   ✅ PASSED - Dieta recuperada de BD');
            console.log(`   📋 ID: ${data.id}`);
            passed++;
        } else {
            console.log(`   ❌ FAILED - Status: ${res.status}`);
            failed++;
        }
    } catch (e) {
        console.log(`   ❌ FAILED - Error: ${e.message}`);
        failed++;
    }

    // Summary
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    RESUMEN DE PRUEBAS                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`   ✅ Pasadas: ${passed}`);
    console.log(`   ❌ Fallidas: ${failed}`);
    console.log(`   📊 Total: ${passed + failed}`);
    console.log('');
    
    if (failed === 0) {
        console.log('   🎉 ¡TODAS LAS PRUEBAS PASARON! La API está funcionando correctamente.');
    } else {
        console.log(`   ⚠️  ${failed} prueba(s) fallaron. Revisar logs arriba.`);
    }
    console.log('');
}

runTests().catch(console.error);
