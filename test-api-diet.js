const https = require('https');

const API_URL = 'fitgenius-ai-production.up.railway.app';

// Test data
const testProfile = {
    userId: 'test-diet-' + Date.now(),
    profile: {
        age: 25,
        gender: 'Masculino',
        weight: 75,
        height: 175,
        goal: 'Ganar masa',
        activityLevel: 'Moderado'
    },
    dietType: 'Balanceada'
};

console.log('🔍 Probando API de Dieta...');
console.log('URL:', `https://${API_URL}/api/generate-diet`);
console.log('');

const data = JSON.stringify(testProfile);

const options = {
    hostname: API_URL,
    path: '/api/generate-diet',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = https.request(options, (res) => {
    let body = '';
    
    res.on('data', (chunk) => {
        body += chunk;
    });
    
    res.on('end', () => {
        console.log('📊 Status:', res.statusCode);
        console.log('');
        
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(body);
                console.log('✅ Respuesta exitosa!');
                console.log('Título:', json.title);
                console.log('Calorías diarias:', json.dailyCalories);
                console.log('');
                
                if (json.schedule && json.schedule.length > 0) {
                    console.log('📅 Días en el plan:', json.schedule.length);
                    json.schedule.forEach((day, i) => {
                        const meals = day.meals ? day.meals.length : 0;
                        console.log(`  Día ${i+1} (${day.day}): ${meals} comidas`);
                    });
                } else if (json.mealPlan && json.mealPlan.length > 0) {
                    console.log('📅 Días en mealPlan:', json.mealPlan.length);
                    json.mealPlan.forEach((day, i) => {
                        const meals = day.meals ? day.meals.length : 0;
                        console.log(`  Día ${i+1} (${day.day}): ${meals} comidas`);
                    });
                } else {
                    console.log('❌ No hay schedule ni mealPlan en la respuesta');
                    console.log('Keys:', Object.keys(json));
                }
            } catch (e) {
                console.log('❌ Error parseando JSON:', e.message);
                console.log('Body:', body.substring(0, 500));
            }
        } else {
            console.log('❌ Error:', body.substring(0, 500));
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Error de conexión:', e.message);
});

req.write(data);
req.end();

console.log('⏳ Esperando respuesta...');
