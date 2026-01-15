import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Función para calcular IMC
function calculateIMC(weight: number, heightCm: number): { value: number; category: string; recommendations: string } {
  if (!weight || !heightCm || heightCm <= 0) return { value: 0, category: 'No calculable', recommendations: '' };
  const heightM = heightCm / 100;
  const imc = parseFloat((weight / (heightM * heightM)).toFixed(1));
  
  if (imc < 18.5) {
    return { 
      value: imc, 
      category: 'Bajo peso', 
      recommendations: 'Priorizar ejercicios de fuerza para ganar masa muscular. Evitar exceso de cardio. Incluir más ejercicios compuestos con cargas progresivas.' 
    };
  } else if (imc < 25) {
    return { 
      value: imc, 
      category: 'Peso normal', 
      recommendations: 'Puede seguir rutina estándar según sus objetivos. Balance entre fuerza y cardio.' 
    };
  } else if (imc < 30) {
    return { 
      value: imc, 
      category: 'Sobrepeso', 
      recommendations: 'Incluir más ejercicio cardiovascular y circuitos metabólicos. Priorizar ejercicios de grandes grupos musculares que quemen más calorías. Considerar HIIT moderado.' 
    };
  } else if (imc < 35) {
    return { 
      value: imc, 
      category: 'Obesidad Grado I', 
      recommendations: 'Iniciar con ejercicios de bajo impacto (caminata, bicicleta, natación). Evitar saltos y movimientos bruscos. Progresión muy gradual de intensidad.' 
    };
  } else {
    return { 
      value: imc, 
      category: 'Obesidad Grado II-III', 
      recommendations: 'IMPORTANTE: Solo ejercicios supervisados de muy bajo impacto. Caminatas cortas, ejercicios sentados o en agua. Priorizar movilidad articular. Se recomienda supervisión profesional presencial.' 
    };
  }
}

// Configuración de ejercicios por tipo de entrenamiento (basado en recomendaciones de expertos)
const WORKOUT_CONFIG: Record<string, { exercisesPerDay: number; setsRange: [number, number]; restRange: [number, number] }> = {
  "Weider (Frecuencia 1)": { exercisesPerDay: 6, setsRange: [3, 4], restRange: [60, 90] },
  "Torso / Pierna": { exercisesPerDay: 7, setsRange: [3, 4], restRange: [60, 90] },
  "Full Body": { exercisesPerDay: 8, setsRange: [3, 4], restRange: [60, 120] },
  "Push / Pull / Legs": { exercisesPerDay: 6, setsRange: [3, 5], restRange: [60, 120] },
  "Upper / Lower": { exercisesPerDay: 7, setsRange: [3, 4], restRange: [60, 90] },
  "Arnold Split": { exercisesPerDay: 7, setsRange: [3, 5], restRange: [60, 90] },
  "Calistenia": { exercisesPerDay: 8, setsRange: [3, 4], restRange: [45, 90] },
  "Cardio Estricto": { exercisesPerDay: 6, setsRange: [2, 4], restRange: [30, 60] },
  "HIIT / Tabata": { exercisesPerDay: 8, setsRange: [3, 5], restRange: [20, 40] },
  "Pilates": { exercisesPerDay: 10, setsRange: [2, 3], restRange: [30, 45] },
  "Yoga Power": { exercisesPerDay: 12, setsRange: [1, 2], restRange: [15, 30] },
  "Zumba / Baile": { exercisesPerDay: 8, setsRange: [2, 3], restRange: [30, 45] },
  "Kickboxing": { exercisesPerDay: 8, setsRange: [3, 4], restRange: [30, 60] }
};

const DEFAULT_CONFIG = { exercisesPerDay: 7, setsRange: [3, 4] as [number, number], restRange: [60, 90] as [number, number] };

const handler: Handler = async (event) => {
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

    console.log('🏋️ Generando rutina profesional', workoutType);
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Obtener configuración del tipo de entrenamiento
    const config = WORKOUT_CONFIG[workoutType] || DEFAULT_CONFIG;
    
    // Calcular IMC del usuario
    const imcData = calculateIMC(profile.weight, profile.height);
    
    // Determinar nivel de dificultad basado en experiencia
    const difficultyLevel = profile.activityLevel === 'Sedentario' || profile.activityLevel === 'Ligero (1-2 días/semana)' 
      ? 'Principiante' 
      : profile.activityLevel === 'Atleta profesional' 
        ? 'Avanzado' 
        : 'Intermedio';
    
    // Equipamiento disponible
    const equipmentList = Array.isArray(profile.equipment) 
      ? profile.equipment.join(', ') 
      : profile.equipment || 'Sin especificar';
    
    // Lesiones o limitaciones
    const injuriesInfo = profile.injuries 
      ? `IMPORTANTE - Lesiones/Limitaciones: ${profile.injuries}. Debes adaptar los ejercicios y evitar movimientos contraindicados.` 
      : 'Sin lesiones reportadas.';

    const prompt = `Eres un entrenador personal certificado con 15+ años de experiencia. Genera un plan de entrenamiento PROFESIONAL y COMPLETO.

## DATOS DEL USUARIO:
- Nombre: ${profile.name || 'Usuario'}
- Edad: ${profile.age} años
- Peso: ${profile.weight} kg
- Altura: ${profile.height} cm
- Género: ${profile.gender}
- **IMC (Índice de Masa Corporal): ${imcData.value} - ${imcData.category}**
- Objetivo principal: ${profile.goal}
- Nivel de actividad: ${profile.activityLevel}
- Tipo de cuerpo: ${profile.bodyType || 'No especificado'}
- Equipamiento disponible: ${equipmentList}
- ${injuriesInfo}

## CONSIDERACIONES ESPECIALES SEGÚN IMC:
${imcData.recommendations}

## TIPO DE RUTINA: ${workoutType}

## REQUISITOS OBLIGATORIOS:
1. Cada día de entrenamiento debe tener MÍNIMO ${config.exercisesPerDay} ejercicios (entre principales y accesorios)
2. Series variables entre ${config.setsRange[0]} y ${config.setsRange[1]} series por ejercicio (NO siempre 3)
3. Descansos entre ${config.restRange[0]}s y ${config.restRange[1]}s según la intensidad
4. CADA ejercicio DEBE incluir 2 alternativas en caso de no tener el equipo necesario
5. Incluir ejercicios de calentamiento al inicio y estiramientos al final
6. Progresión lógica: de compuestos a aislamiento
7. **ADAPTAR la intensidad y tipo de ejercicios según el IMC del usuario**

## ESTRUCTURA JSON REQUERIDA (responde SOLO con este JSON, sin texto adicional):
{
  "title": "Plan ${workoutType} - ${difficultyLevel}",
  "description": "Plan personalizado de ${workoutType} para ${profile.goal}",
  "frequency": "X días por semana",
  "estimatedDuration": "60-75 minutos",
  "difficulty": "${difficultyLevel}",
  "durationWeeks": 8,
  "recommendations": ["recomendación 1", "recomendación 2", "recomendación 3"],
  "schedule": [
    {
      "dayName": "Día 1 - Nombre del enfoque",
      "focus": "Grupos musculares principales",
      "exercises": [
        {
          "name": "Nombre del ejercicio",
          "sets": 4,
          "reps": "8-12",
          "rest": "90s",
          "muscleGroup": "Grupo muscular",
          "category": "warmup|main|cooldown",
          "tempo": "3-1-2-0",
          "description": "Descripción detallada de la ejecución correcta",
          "tips": "Consejos de forma y seguridad",
          "videoQuery": "término de búsqueda en YouTube",
          "alternatives": [
            {
              "name": "Alternativa 1 (sin equipo o equipo diferente)",
              "reason": "Por qué es buena alternativa"
            },
            {
              "name": "Alternativa 2",
              "reason": "Por qué es buena alternativa"
            }
          ]
        }
      ]
    }
  ],
  "medicalAnalysis": {
    "severity": "None|Low|Medium|High",
    "warningTitle": "Solo si hay lesiones",
    "warningMessage": "Explicación de adaptaciones",
    "modifications": ["modificación 1", "modificación 2"]
  }
}

IMPORTANTE:
- Incluye días de descanso activo cuando corresponda
- Varía las series (2, 3, 4 o 5) según el ejercicio y objetivo
- Los ejercicios de calentamiento tienen category "warmup"
- Los ejercicios principales tienen category "main"  
- Los estiramientos finales tienen category "cooldown"
- SIEMPRE incluye el campo "alternatives" con 2 opciones en CADA ejercicio

Responde ÚNICAMENTE con el JSON, sin explicaciones adicionales ni bloques de código markdown.`;
    
    console.log('📮 Llamando Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Respuesta:', text?.substring(0, 100));
    
    if (!text) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Respuesta vacía de Gemini' })
      };
    }

    let json = text;
    const match = text.match(new RegExp('```(?:json)?\\s*([\\s\\S]*?)```'));
    if (match) json = match[1];
    else {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start > -1 && end > -1) json = text.substring(start, end + 1);
    }

    const planId = Date.now().toString();
    const parsedPlan = JSON.parse(json);
    
    // Asegurar que tiene la estructura esperada
    const workoutPlan = {
      id: planId,
      ...parsedPlan,
      title: parsedPlan.title || workoutType,
      startDate: new Date().toISOString()
    };
    
    // Guardar en Railway (más confiable que conexión directa a Neon)
    const railwayUrl = process.env.RAILWAY_API_URL || 'https://fitgenius-ai-production.up.railway.app';
    if (userId) {
      try {
        const saveResponse = await fetch(`${railwayUrl}/api/save-workout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            title: workoutPlan.title || 'Plan de Entrenamiento',
            planData: workoutPlan
          })
        });
        
        if (saveResponse.ok) {
          console.log('✅ Rutina guardada en Railway/Neon');
        } else {
          const error = await saveResponse.text();
          console.warn('⚠️ No se guardó en BD:', error);
        }
      } catch (dbErr: any) {
        console.warn('⚠️ No se guardó en BD:', dbErr?.message);
        // No es error fatal, el plan se devuelve de todas formas
      }
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(workoutPlan)
    };
  } catch (error: any) {
    console.error('❌ Error:', error?.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error?.message || 'Error desconocido' })
    };
  }
};

export { handler };