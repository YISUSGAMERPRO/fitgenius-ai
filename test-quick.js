#!/usr/bin/env node

/**
 * Test rápido para verificar que las migraciones funcionan
 */

const http = require('http');
const { v4: uuidv4 } = require('uuid');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
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
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    console.log('\n=== TEST RÁPIDO ===\n');
    
    try {
        // Test 1: Registrar
        console.log('1️⃣ Registrando usuario...');
        const userId = uuidv4();
        const res1 = await request('POST', '/api/register', {
            id: userId,
            username: `test_${Date.now()}`,
            password: 'test123'
        });
        console.log(`   Status: ${res1.status} | ${res1.body.message || res1.body.error}\n`);

        // Test 2: Guardar perfil
        console.log('2️⃣ Guardando perfil...');
        const res2 = await request('POST', '/api/profile', {
            id: uuidv4(),
            user_id: userId,
            name: 'Usuario Test',
            age: 30,
            height: 175,
            weight: 75,
            gender: 'Masculino',
            body_type: 'Normal',
            goal: 'Perder peso',
            activity_level: 'Moderado'
        });
        console.log(`   Status: ${res2.status} | ${res2.body.message || res2.body.error}\n`);

        if (res2.status === 200) {
            console.log('✅ SUCCESS: Perfil guardado correctamente!');
            console.log('✅ Las migraciones funcionaron!');
        } else {
            console.log('❌ ERROR: No se pudo guardar el perfil');
            console.log('Response:', res2.body);
        }
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
        console.log('Asegúrate que el servidor esté corriendo en puerto 3001');
    }
    
    process.exit(0);
}

test();
