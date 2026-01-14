#!/usr/bin/env node

/**
 * Test simple para verificar el flujo completo de registro y guardado de perfil
 * Uso: node test-complete-flow.js
 */

const crypto = require('crypto');

const BACKEND_URL = process.env.BACKEND_URL || 'https://fitgenius-ai-production.up.railway.app';
const TIMEOUT = 10000;

async function makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${BACKEND_URL}${endpoint}`;
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        timeout: TIMEOUT
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(url, options);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
        
        return {
            status: response.status,
            ok: response.ok,
            data
        };
    } catch (err) {
        return {
            status: 0,
            ok: false,
            error: err.message
        };
    }
}

async function runTest() {
    console.log('🧪 Iniciando test de flujo completo...\n');
    
    const testEmail = `test_${crypto.randomBytes(4).toString('hex')}@example.com`;
    const testPassword = 'Test123!@#';
    
    console.log(`📧 Email de prueba: ${testEmail}`);
    console.log(`🔑 Contraseña: ${testPassword}\n`);
    
    // PASO 1: Registrar usuario
    console.log('1️⃣ Registrando usuario...');
    const registerResult = await makeRequest('/api/register', 'POST', {
        id: crypto.randomUUID(),
        email: testEmail,
        password: testPassword
    });
    
    if (!registerResult.ok) {
        console.error('❌ Error en registro:', registerResult.data?.error || registerResult.error);
        return;
    }
    
    const userId = registerResult.data.id;
    console.log(`✅ Usuario registrado: ${userId}\n`);
    
    // PASO 2: Guardar perfil
    console.log('2️⃣ Guardando perfil...');
    const profileResult = await makeRequest('/api/profile', 'POST', {
        id: crypto.randomUUID(),
        user_id: userId,
        name: 'Juan Pérez',
        age: 30,
        height: 180,
        weight: 75,
        gender: 'Masculino',
        goal: 'Perder grasa',
        activityLevel: 'Moderado (3-5 días/semana)',
        equipment: ['Gym', 'Mancuernas'],
        injuries: 'Ninguna',
        bodyType: 'Mesomorfo'
    });
    
    if (!profileResult.ok) {
        console.error('❌ Error al guardar perfil:', profileResult.data?.error || profileResult.error);
        return;
    }
    
    console.log(`✅ Perfil guardado correctamente\n`);
    
    // PASO 3: Obtener perfil
    console.log('3️⃣ Obteniendo perfil...');
    const getProfileResult = await makeRequest(`/api/profile/${userId}`);
    
    if (!getProfileResult.ok) {
        console.error('❌ Error al obtener perfil:', getProfileResult.data?.error || getProfileResult.error);
        return;
    }
    
    console.log(`✅ Perfil obtenido:`, getProfileResult.data);
    console.log('\n🎉 Test completado exitosamente!');
}

runTest().catch(err => {
    console.error('❌ Error no controlado:', err);
    process.exit(1);
});
