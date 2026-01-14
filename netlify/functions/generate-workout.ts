import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'pg';

const handler: Handler = async (event) => {
  let pool: Pool | null = null;
  
  try {
    const { userId, profile, workoutType } = JSON.parse(event.body || '{}');
    
    if (!userId || !profile || !workoutType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan parámetros' })
      };
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: 'GEMINI_API_KEY no configurada' })
      };
    }

    // Permitir múltiples nombres de variable de entorno usados por Netlify/Neon
    const databaseUrl = process.env.VITE_API_DATABASE_URL 
      || process.env.NETLIFY_DATABASE_URL_UNPOOLED 
      || process.env.NETLIFY_DATABASE_URL 
      || process.env.DATABASE_URL;
    
    console.log('🤖 Inicializando GoogleGenerativeAI...');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    console.log('✅ Modelo Gemini cargado: gemini-2.0-flash-exp');
    
    const prompt = `Eres un entrenador personal experto. Genera una rutina de entrenamiento personalizada en SOLO JSON válido.

Datos del usuario:
- Edad: ${profile.age}
- Peso: ${profile.weight}kg
- Altura: ${profile.height}cm
- Género: ${profile.gender}
- Objetivo: ${profile.goal}
- Nivel de actividad: ${profile.activityLevel}
- Tipo de cuerpo: ${profile.bodyType || 'No especificado'}
- Equipamiento disponible: ${profile.equipment.join(', ')}
- Lesiones/Limitaciones: ${profile.injuries || 'Ninguna'}
- Tipo de rutina solicitada: ${workoutType}

Genera una rutina completa de 7 días con ejercicios apropiados. IMPORTANTE: Cada día debe tener 5-8 ejercicios bien distribuidos.

Responde SOLO con JSON válido (sin explicaciones ni markdown):
{
  "title": "${workoutType} Personalizada",
  "description": "Rutina adaptada a tu perfil y objetivos",
  "frequency": "6-7 días/semana",
  "estimatedDuration": "60-90 min",
  "difficulty": "Intermedio",
  "durationWeeks": 8,
  "cycleDurationAdvice": "Realiza esta rutina durante 8 semanas, luego varía para evitar adaptación",
  "periodizationModel": "Linear Periodization",
  "progressionGuide": "Incrementa peso un 2.5-5% cada semana cuando domines los movimientos",
  "recommendations": ["Descansa 48 horas entre grupos musculares", "Mantén hidratación constante", "Duerme 7-8 horas diarias", "Realiza un calentamiento de 10 minutos"],
  "schedule": [
    {"dayName": "Lunes", "focus": "Pecho y Tríceps", "exercises": [{"name": "Press de Banca", "sets": 4, "reps": "6-8", "rest": "90s", "muscleGroup": "Pecho", "category": "main", "tempo": "2-0-1-0", "description": "Movimiento principal para pecho", "tips": "Mantén codos a 45 grados", "videoQuery": "barbell bench press"}, {"name": "Incline Dumbbell Press", "sets": 3, "reps": "8-10", "rest": "75s", "muscleGroup": "Pecho", "category": "main", "tempo": "2-0-1-0", "description": "Enfoca fibras superiores del pecho", "tips": "Inclina el banco 30-45 grados", "videoQuery": "incline dumbbell press"}, {"name": "Cable Flyes", "sets": 3, "reps": "10-12", "rest": "60s", "muscleGroup": "Pecho", "category": "main", "tempo": "2-1-2-0", "description": "Aislamiento de pecho con tensión constante", "tips": "Controla el movimiento en ambas direcciones", "videoQuery": "cable chest flyes"}, {"name": "Tricep Dips", "sets": 3, "reps": "8-12", "rest": "75s", "muscleGroup": "Tríceps", "category": "main", "tempo": "2-0-1-0", "description": "Movimiento compuesto para tríceps", "tips": "Inclina ligeramente hacia adelante", "videoQuery": "tricep dips"}, {"name": "Rope Pushdown", "sets": 3, "reps": "10-12", "rest": "60s", "muscleGroup": "Tríceps", "category": "main", "tempo": "1-0-2-0", "description": "Aislamiento de tríceps", "tips": "Mantén codos pegados al cuerpo", "videoQuery": "rope pushdown tricep"}, {"name": "Machine Chest Press", "sets": 2, "reps": "10-12", "rest": "60s", "muscleGroup": "Pecho", "category": "cooldown", "tempo": "2-0-1-0", "description": "Ejercicio de volumen", "tips": "Controla el movimiento", "videoQuery": "machine chest press"}, {"name": "Cardio ligero", "sets": 1, "reps": "15-20 min", "rest": "0s", "muscleGroup": "Cardio", "category": "cooldown", "tempo": "0-0-0-0", "description": "Enfriamiento cardiovascular", "tips": "Mantén una intensidad conversacional", "videoQuery": "treadmill cardio"}]},
    {"dayName": "Martes", "focus": "Espalda y Bíceps", "exercises": [{"name": "Deadlift", "sets": 4, "reps": "4-6", "rest": "120s", "muscleGroup": "Espalda", "category": "main", "tempo": "2-0-1-0", "description": "Movimiento principal de espalda", "tips": "Mantén la columna neutral", "videoQuery": "barbell deadlift"}, {"name": "Pull-ups", "sets": 3, "reps": "6-10", "rest": "90s", "muscleGroup": "Espalda", "category": "main", "tempo": "2-0-1-0", "description": "Movimiento compuesto para espalda", "tips": "Usa lastre si es necesario", "videoQuery": "pull ups"}, {"name": "Barbell Rows", "sets": 3, "reps": "8-10", "rest": "90s", "muscleGroup": "Espalda", "category": "main", "tempo": "2-0-1-0", "description": "Fortalecimiento de espalda media", "tips": "Retrae los omóplatos", "videoQuery": "barbell bent over row"}, {"name": "Barbell Curls", "sets": 3, "reps": "8-10", "rest": "75s", "muscleGroup": "Bíceps", "category": "main", "tempo": "2-0-1-0", "description": "Movimiento principal de bíceps", "tips": "Evita balancearte", "videoQuery": "barbell bicep curls"}, {"name": "Incline Dumbbell Curls", "sets": 3, "reps": "10-12", "rest": "60s", "muscleGroup": "Bíceps", "category": "main", "tempo": "2-0-1-0", "description": "Aislamiento de bíceps", "tips": "Mantén el banco inclinado", "videoQuery": "incline dumbbell curls"}, {"name": "Lat Pulldown", "sets": 3, "reps": "10-12", "rest": "60s", "muscleGroup": "Espalda", "category": "main", "tempo": "1-0-2-0", "description": "Trabajo de espalda ancha", "tips": "Tira hacia abajo y atrás", "videoQuery": "lat pulldown machine"}]},
    {"dayName": "Miércoles", "focus": "Piernas", "exercises": [{"name": "Barbell Squat", "sets": 4, "reps": "6-8", "rest": "120s", "muscleGroup": "Piernas", "category": "main", "tempo": "2-0-1-0", "description": "Movimiento fundamental para piernas", "tips": "Baja hasta que los muslos estén paralelos", "videoQuery": "barbell back squat"}, {"name": "Romanian Deadlift", "sets": 3, "reps": "8-10", "rest": "90s", "muscleGroup": "Posteriores", "category": "main", "tempo": "2-0-1-0", "description": "Trabajo de cadena posterior", "tips": "Mantén la espalda recta", "videoQuery": "romanian deadlift"}, {"name": "Leg Press", "sets": 3, "reps": "10-12", "rest": "75s", "muscleGroup": "Piernas", "category": "main", "tempo": "2-0-1-0", "description": "Movimiento compuesto alterno", "tips": "Baja hasta 90 grados en las rodillas", "videoQuery": "leg press machine"}, {"name": "Leg Curls", "sets": 3, "reps": "10-12", "rest": "60s", "muscleGroup": "Posteriores", "category": "main", "tempo": "2-0-2-0", "description": "Aislamiento de isquiotibiales", "tips": "Controla la bajada", "videoQuery": "leg curl machine"}, {"name": "Leg Extensions", "sets": 3, "reps": "12-15", "rest": "60s", "muscleGroup": "Cuádriceps", "category": "main", "tempo": "1-0-2-0", "description": "Aislamiento de cuádriceps", "tips": "No bloquees las rodillas", "videoQuery": "leg extension machine"}, {"name": "Calf Raises", "sets": 3, "reps": "12-15", "rest": "45s", "muscleGroup": "Pantorrillas", "category": "cooldown", "tempo": "1-0-2-0", "description": "Fortalecimiento de pantorrillas", "tips": "Alcanza el máximo rango de movimiento", "videoQuery": "standing calf raises"}]},
    {"dayName": "Jueves", "focus": "Hombros y Brazos", "exercises": [{"name": "Overhead Press", "sets": 4, "reps": "6-8", "rest": "90s", "muscleGroup": "Hombros", "category": "main", "tempo": "2-0-1-0", "description": "Movimiento principal de hombros", "tips": "Mantén el core comprometido", "videoQuery": "barbell overhead press"}, {"name": "Dumbbell Shoulder Press", "sets": 3, "reps": "8-10", "rest": "75s", "muscleGroup": "Hombros", "category": "main", "tempo": "2-0-1-0", "description": "Trabajo unilateral de hombros", "tips": "Muévete en arco natural", "videoQuery": "dumbbell shoulder press"}, {"name": "Lateral Raises", "sets": 3, "reps": "10-12", "rest": "60s", "muscleGroup": "Hombros", "category": "main", "tempo": "2-0-2-0", "description": "Aislamiento de deltoides lateral", "tips": "Codos ligeramente doblados", "videoQuery": "dumbbell lateral raises"}, {"name": "Cable Lateral Raises", "sets": 3, "reps": "12-15", "rest": "60s", "muscleGroup": "Hombros", "category": "main", "tempo": "1-0-2-0", "description": "Variación con tensión constante", "tips": "Mantén tensión durante todo el movimiento", "videoQuery": "cable lateral raise"}, {"name": "Reverse Pec Deck", "sets": 3, "reps": "12-15", "rest": "60s", "muscleGroup": "Espalda", "category": "main", "tempo": "2-0-2-0", "description": "Trabajo de deltoides posterior", "tips": "Abre los brazos en arco amplio", "videoQuery": "reverse pec deck fly"}, {"name": "Machine Lateral Raises", "sets": 2, "reps": "12-15", "rest": "60s", "muscleGroup": "Hombros", "category": "cooldown", "tempo": "1-0-2-0", "description": "Volumen adicional", "tips": "Controla cada repetición", "videoQuery": "smith machine lateral raises"}]},
    {"dayName": "Viernes", "focus": "Pecho y Abdominales", "exercises": [{"name": "Dumbbell Bench Press", "sets": 3, "reps": "8-10", "rest": "90s", "muscleGroup": "Pecho", "category": "main", "tempo": "2-0-1-0", "description": "Variación con mancuernas", "tips": "Rango completo de movimiento", "videoQuery": "dumbbell bench press"}, {"name": "Push-ups", "sets": 3, "reps": "10-15", "rest": "60s", "muscleGroup": "Pecho", "category": "main", "tempo": "2-0-1-0", "description": "Movimiento clásico", "tips": "Mantén el cuerpo recto", "videoQuery": "perfect push up form"}, {"name": "Cable Crossovers", "sets": 3, "reps": "12-15", "rest": "60s", "muscleGroup": "Pecho", "category": "main", "tempo": "2-1-2-0", "description": "Contracción máxima", "tips": "Cruza en el punto máximo", "videoQuery": "cable crossover pec"}, {"name": "Ab Wheel Rollout", "sets": 3, "reps": "8-12", "rest": "60s", "muscleGroup": "Abdominales", "category": "main", "tempo": "2-0-2-0", "description": "Fortalecimiento abdominal avanzado", "tips": "Controla la vuelta", "videoQuery": "ab wheel rollout"}, {"name": "Cable Crunches", "sets": 3, "reps": "12-15", "rest": "45s", "muscleGroup": "Abdominales", "category": "cooldown", "tempo": "1-0-2-0", "description": "Aislamiento de recto abdominal", "tips": "Contrae fuerte en la parte superior", "videoQuery": "cable machine crunches"}, {"name": "Cardio", "sets": 1, "reps": "20 min", "rest": "0s", "muscleGroup": "Cardio", "category": "cooldown", "tempo": "0-0-0-0", "description": "Sesión cardiovascular", "tips": "Mantén intensidad moderada", "videoQuery": "cardio treadmill"}]},
    {"dayName": "Sábado", "focus": "Volumen de Espalda y Trapecios", "exercises": [{"name": "T-Bar Rows", "sets": 3, "reps": "8-10", "rest": "90s", "muscleGroup": "Espalda", "category": "main", "tempo": "2-0-1-0", "description": "Movimiento compuesto de espalda", "tips": "Retrae fuerte en la contracción", "videoQuery": "t-bar row"}, {"name": "Seal Rows", "sets": 3, "reps": "10-12", "rest": "75s", "muscleGroup": "Espalda", "category": "main", "tempo": "2-0-1-0", "description": "Aislamiento de espalda media", "tips": "Enfócate en la contracción", "videoQuery": "seal row exercise"}, {"name": "Machine Rows", "sets": 3, "reps": "10-12", "rest": "75s", "muscleGroup": "Espalda", "category": "main", "tempo": "2-0-1-0", "description": "Volumen adicional", "tips": "Retrae completamente", "videoQuery": "machine row"}, {"name": "Barbell Shrugs", "sets": 3, "reps": "8-10", "rest": "75s", "muscleGroup": "Trapecios", "category": "main", "tempo": "2-0-2-0", "description": "Fortalecimiento de trapecios", "tips": "Sube hacia las orejas", "videoQuery": "barbell shrugs"}, {"name": "Dumbbell Shrugs", "sets": 3, "reps": "10-12", "rest": "60s", "muscleGroup": "Trapecios", "category": "main", "tempo": "2-0-2-0", "description": "Variación con mancuernas", "tips": "Rango completo de movimiento", "videoQuery": "dumbbell shrugs"}, {"name": "Back Extensions", "sets": 2, "reps": "12-15", "rest": "60s", "muscleGroup": "Espalda", "category": "cooldown", "tempo": "2-0-1-0", "description": "Fortalecimiento de espalda baja", "tips": "Controla la bajada", "videoQuery": "back extension machine"}]},
    {"dayName": "Domingo", "focus": "Descanso Activo", "exercises": [{"name": "Caminar", "sets": 1, "reps": "30-45 min", "rest": "0s", "muscleGroup": "Cardio", "category": "warmup", "tempo": "0-0-0-0", "description": "Recuperación cardiovascular", "tips": "Baja intensidad, disfrutalo", "videoQuery": "walking cardio"}, {"name": "Estiramientos", "sets": 1, "reps": "20 min", "rest": "0s", "muscleGroup": "Flexibilidad", "category": "main", "tempo": "0-0-0-0", "description": "Trabajo de flexibilidad", "tips": "Mantén cada estiramiento 30 segundos", "videoQuery": "full body stretch routine"}, {"name": "Yoga", "sets": 1, "reps": "30-45 min", "rest": "0s", "muscleGroup": "Flexibilidad", "category": "cooldown", "tempo": "0-0-0-0", "description": "Recuperación y movilidad", "tips": "Enfócate en la respiración", "videoQuery": "relaxing yoga flow"}]}
  ],
  "medicalAnalysis": {"severity": "None", "modifications": ["Tu rutina está optimizada para tu perfil"]}
}`;

    console.log('📮 Enviando prompt a Gemini API...');
    let result;
    try {
      result = await model.generateContent(prompt);
      console.log('✅ Respuesta recibida de Gemini');
    } catch (genErr) {
      console.error('❌ Error llamando a generateContent:', genErr);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error en Gemini API: ' + (genErr as any).message })
      };
    }
    
    const response = await result.response;
    console.log('📥 Response object:', { contentLength: response?.content?.length || 0 });

    const responseText = response.text();
    console.log('📄 Response text length:', responseText?.length || 0);
    
    if (!responseText || responseText.trim().length === 0) {
      console.error('❌ Gemini devolvió respuesta vacía');
      console.error('Response parts:', response?.content?.parts?.length || 0);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Sin respuesta de Gemini (vacía)' })
      };
    }

    // Extraer JSON del markdown
    let jsonText = responseText;
    const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (markdownMatch) {
      jsonText = markdownMatch[1].trim();
    } else {
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'No se encontró JSON en la respuesta' })
        };
      }
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    const workoutPlan = JSON.parse(jsonText);
    const planId = Date.now().toString();

    // Intentar guardar en BD si está disponible
    if (databaseUrl) {
      try {
        pool = new Pool({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false }
        });

        await pool.query(
          `INSERT INTO workout_plans (id, user_id, title, plan_data, created_at) 
           VALUES ($1, $2, $3, $4, NOW())`,
          [planId, userId, workoutPlan.title || 'Plan de Entrenamiento', JSON.stringify(workoutPlan)]
        );
        
        console.log('✅ Rutina guardada en BD');
      } catch (dbErr) {
        console.warn('⚠️ No se pudo guardar en BD (Netlify Function generate-workout):', dbErr);
        // No es error fatal, devolvemos la rutina generada
      } finally {
        if (pool) await pool.end();
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ ...workoutPlan, id: planId })
    };
  } catch (error: any) {
    console.error('🚨 ERROR NO CAPTURADO:', error);
    console.error('Stack:', error?.stack || 'N/A');
    console.error('Tipo:', typeof error, Object.keys(error || {}).slice(0, 10));
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno: ' + (error?.message || String(error)) })
    };
  }
};

export { handler };
