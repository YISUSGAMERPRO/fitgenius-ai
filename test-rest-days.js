const https = require('https');

const API_URL = 'fitgenius-ai-production.up.railway.app';

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     TEST: DÍAS DE DESCANSO EN RUTINAS                      ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

const testData = {
    userId: generateUUID(),
    profile: {
        age: 25,
        gender: 'Masculino',
        weight: 75,
        height: 175,
        goal: 'Ganar masa',
        activityLevel: 'Moderado',
        equipment: ['gym'],
        injuries: null
    },
    workoutType: 'Fuerza',
    frequency: 3,
    selectedDays: ['Lunes', 'Miércoles', 'Viernes']  // Solo 3 días
};

console.log('📅 Días de entrenamiento solicitados:', testData.selectedDays.join(', '));
console.log('😴 Días de descanso esperados: Martes, Jueves, Sábado, Domingo');
console.log('');
console.log('⏳ Generando rutina (esto puede tardar 15-30s)...');
console.log('');

const data = JSON.stringify(testData);

const options = {
    hostname: API_URL,
    path: '/api/generate-workout',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('📊 Status:', res.statusCode);
        console.log('');
        
        if (res.statusCode === 200) {
            try {
                const plan = JSON.parse(body);
                console.log('✅ Rutina generada:', plan.title);
                console.log('');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('ANÁLISIS DE DÍAS:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                
                let restDaysCorrect = 0;
                let trainingDaysCorrect = 0;
                
                plan.schedule.forEach((day, i) => {
                    const dayName = day.dayName || day.day;
                    const exerciseCount = day.exercises ? day.exercises.length : 0;
                    const isRestDay = day.focus && day.focus.toLowerCase().includes('descanso');
                    const shouldBeRest = !testData.selectedDays.includes(dayName);
                    
                    let status = '';
                    if (shouldBeRest) {
                        if (exerciseCount === 0 || isRestDay) {
                            status = '✅ CORRECTO (Descanso)';
                            restDaysCorrect++;
                        } else {
                            status = `❌ ERROR: Debería ser descanso pero tiene ${exerciseCount} ejercicios`;
                        }
                    } else {
                        if (exerciseCount > 0) {
                            status = `✅ CORRECTO (${exerciseCount} ejercicios)`;
                            trainingDaysCorrect++;
                        } else {
                            status = '❌ ERROR: Debería tener ejercicios';
                        }
                    }
                    
                    console.log(`  ${dayName}: ${status}`);
                });
                
                console.log('');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('RESUMEN:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`  Días de entrenamiento correctos: ${trainingDaysCorrect}/3`);
                console.log(`  Días de descanso correctos: ${restDaysCorrect}/4`);
                
                if (trainingDaysCorrect === 3 && restDaysCorrect === 4) {
                    console.log('');
                    console.log('🎉 ¡TEST PASADO! Los días de descanso funcionan correctamente.');
                } else {
                    console.log('');
                    console.log('⚠️  TEST FALLIDO: Los días no están configurados correctamente.');
                }
                
            } catch (e) {
                console.log('❌ Error parseando respuesta:', e.message);
            }
        } else {
            console.log('❌ Error:', body.substring(0, 300));
        }
    });
});

req.on('error', e => console.error('Error:', e.message));
req.write(data);
req.end();
