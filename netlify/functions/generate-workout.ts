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

// Configuración de ejercicios por tipo de entrenamiento BASADA EN EVIDENCIA CIENTÍFICA
const WORKOUT_CONFIG: Record<string, {
  exercisesPerDay: number;
  compoundExercises: number;
  accessoryExercises: number;
  setsRange: [number, number];
  repsRange: string;
  restRange: [number, number];
  volumeLandmark: string;
}> = {
  "Weider (Frecuencia 1)": {
    exercisesPerDay: 8,
    compoundExercises: 3,
    accessoryExercises: 5,
    setsRange: [3, 5],
    repsRange: "6-15",
    restRange: [60, 120],
    volumeLandmark: "10-20 sets por grupo muscular/semana"
  },
  "Torso / Pierna": {
    exercisesPerDay: 9,
    compoundExercises: 3,
    accessoryExercises: 6,
    setsRange: [3, 6],
    repsRange: "6-15",
    restRange: [60, 120],
    volumeLandmark: "12-20 sets por grupo muscular"
  },
  "Full Body": {
    exercisesPerDay: 10,
    compoundExercises: 3,
    accessoryExercises: 7,
    setsRange: [2, 5],
    repsRange: "6-15",
    restRange: [45, 90],
    volumeLandmark: "9-15 sets por grupo muscular"
  },
  "Push / Pull / Legs": {
    exercisesPerDay: 9,
    compoundExercises: 2,
    accessoryExercises: 7,
    setsRange: [3, 6],
    repsRange: "6-15",
    restRange: [60, 120],
    volumeLandmark: "12-20 sets por grupo muscular"
  },
  "Upper / Lower": {
    exercisesPerDay: 8,
    compoundExercises: 3,
    accessoryExercises: 5,
    setsRange: [3, 5],
    repsRange: "6-15",
    restRange: [60, 90],
    volumeLandmark: "10-18 sets por grupo muscular"
  },
  "Arnold Split": {
    exercisesPerDay: 8,
    compoundExercises: 3,
    accessoryExercises: 5,
    setsRange: [3, 6],
    repsRange: "6-15",
    restRange: [60, 90],
    volumeLandmark: "15-25 sets por sesión"
  },
  "Calistenia": {
    exercisesPerDay: 10,
    compoundExercises: 4,
    accessoryExercises: 6,
    setsRange: [3, 5],
    repsRange: "6-15 reps",
    restRange: [45, 90],
    volumeLandmark: "8-12 sets por grupo muscular"
  },
  "Cardio Estricto": {
    exercisesPerDay: 1,
    compoundExercises: 1,
    accessoryExercises: 0,
    setsRange: [1, 1],
    repsRange: "Duración continua",
    restRange: [0, 0],
    volumeLandmark: "150-300 min/semana cardio"
  },
  "HIIT / Tabata": {
    exercisesPerDay: 8,
    compoundExercises: 3,
    accessoryExercises: 5,
    setsRange: [3, 5],
    repsRange: "20-40s trabajo / 10-20s descanso",
    restRange: [10, 30],
    volumeLandmark: "20-30 min sesión"
  },
  "Pilates": {
    exercisesPerDay: 12,
    compoundExercises: 2,
    accessoryExercises: 10,
    setsRange: [2, 3],
    repsRange: "12-20",
    restRange: [30, 45],
    volumeLandmark: "Control de cuerpo y core"
  },
  "Yoga Power": {
    exercisesPerDay: 15,
    compoundExercises: 2,
    accessoryExercises: 13,
    setsRange: [1, 2],
    repsRange: "30s-2 min hold",
    restRange: [15, 30],
    volumeLandmark: "Flexibilidad y fuerza funcional"
  },
  "Zumba / Baile": {
    exercisesPerDay: 1,
    compoundExercises: 1,
    accessoryExercises: 0,
    setsRange: [1, 1],
    repsRange: "45-60 min continuo",
    restRange: [0, 0],
    volumeLandmark: "Cardio y coordinación"
  },
  "Kickboxing": {
    exercisesPerDay: 8,
    compoundExercises: 4,
    accessoryExercises: 4,
    setsRange: [3, 4],
    repsRange: "20-30 golpes/kicks x round",
    restRange: [30, 60],
    volumeLandmark: "Cardio, fuerza y potencia"
  }
};

const DEFAULT_CONFIG = {
  exercisesPerDay: 8,
  compoundExercises: 3,
  accessoryExercises: 5,
  setsRange: [3, 5] as [number, number],
  repsRange: "6-15",
  restRange: [60, 90] as [number, number],
  volumeLandmark: "10-20 sets por grupo muscular"
};

const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const { userId, profile, workoutType, frequency, selectedDays, focus, duration } = JSON.parse(event.body || '{}');
    
    if (!userId || !profile || !workoutType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Faltan parámetros' })
      };
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ error: 'GEMINI_API_KEY no configurada' })
      };
    }

    console.log('🏋️ Generando rutina profesional', workoutType);
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const config = WORKOUT_CONFIG[workoutType] || DEFAULT_CONFIG;
    const imcData = calculateIMC(profile.weight, profile.height);
    
    // Datos de frecuencia y días
    const trainingFrequency = frequency || 3;
    const trainingDays = selectedDays || ['Lunes', 'Miércoles', 'Viernes'];
    const muscularFocus = focus || '';
    const cycleDuration = duration || 12;
    
    const difficultyLevel = profile.activityLevel === 'Sedentario' || profile.activityLevel === 'Ligero (1-2 días/semana)' 
      ? 'Principiante' 
      : profile.activityLevel === 'Atleta profesional' 
        ? 'Avanzado' 
        : 'Intermedio';
    
    const equipmentList = Array.isArray(profile.equipment) 
      ? profile.equipment.join(', ') 
      : profile.equipment || 'Sin especificar';
    
    const injuriesInfo = profile.injuries 
      ? `IMPORTANTE - Lesiones/Limitaciones: ${profile.injuries}. Debes adaptar los ejercicios y evitar movimientos contraindicados.` 
      : 'Sin lesiones reportadas.';
    
    const focusInfo = muscularFocus 
      ? `\n- **ENFOQUE PRIORITARIO**: ${muscularFocus} (incluir más ejercicios y volumen para este grupo muscular)` 
      : '';

    const prompt = `Eres un entrenador personal certificado (NASM/ACE/ISSA) con 15+ años de experiencia en EVIDENCIA CIENTÍFICA. Conoces periodización y volumen óptimo de entrenamiento.

IMPORTANTE: Crea una rutina ÚNICA Y COMPLETAMENTE PERSONALIZADA. NO reutilices plantillas genéricas.

## USUARIO:
- Nombre: ${profile.name || 'Usuario'}
- Edad: ${profile.age} años, Peso: ${profile.weight} kg, Altura: ${profile.height} cm
- **IMC: ${imcData.value} - ${imcData.category}**
- Objetivo: ${profile.goal} | Experiencia: ${difficultyLevel}
- Equipamiento: ${equipmentList}
- ${injuriesInfo}${focusInfo}

## PREFERENCIAS DE ENTRENAMIENTO:
- **Frecuencia**: ${trainingFrequency} días/semana
- **Días seleccionados**: ${trainingDays.join(', ')}
- **Duración del ciclo**: ${cycleDuration} semanas

## CONFIGURACIÓN CIENTÍFICA:
${config.volumeLandmark}
Schoenfeld (2017): Hipertrofia 10-20 sets/grupo/semana, 6-15 reps. Fuerza 3-8 sets, 1-5 reps. Resistencia 2-3 sets, 12-20+ reps.

## REQUISITOS:
1. GENERAR EXACTAMENTE ${trainingFrequency} DÍAS DE ENTRENAMIENTO
2. CADA DÍA: MÍNIMO ${config.exercisesPerDay} EJERCICIOS (${config.compoundExercises} compuestos + ${config.accessoryExercises} accesorios)
3. VARIAR SERIES: ${config.setsRange[0]}-${config.setsRange[1]} sets (no siempre 3)
4. VARIAR REPS: ${config.repsRange}
5. 2 ALTERNATIVAS POR EJERCICIO
6. Progresión científica (RPE/RIR)
7. Periodización de 4 semanas
8. Adaptado al IMC ${imcData.value}
9. **CRÍTICO: Distribuir grupos musculares en los ${trainingFrequency} días**

## ESTRUCTURA DE DÍAS (GENERAR ${trainingFrequency} DÍAS):
Los días de entrenamiento son: ${trainingDays.join(', ')}
Nombrar cada día del schedule como "${trainingDays[0]}", "${trainingDays[1] || ''}", etc.

## JSON REQUERIDO (SOLO JSON, SIN TEXTO):
{
  "title": "${workoutType} - ${difficultyLevel}",
  "subtitle": "Personalizado para ${profile.goal}",
  "description": "Descripción ejecutiva única",
  "frequency": "${trainingFrequency} días/semana",
  "trainingDays": ${JSON.stringify(trainingDays)},
  "estimatedDuration": "60-75 min",
  "difficulty": "${difficultyLevel}",
  "durationWeeks": ${cycleDuration},
  "periodizationType": "Linear|Undulating|Block",
  "trainingVolume": "${config.volumeLandmark}",
  "recommendations": ["Recomendación 1", "Recomendación 2"],
  "progressionStrategy": "Sistema RPE/RIR con progresión de carga",
  "schedule": [
    {
      "weekCycle": 1,
      "dayName": "${trainingDays[0]} - NOMBRE ESPECÍFICO",
      "dayDescription": "Descripción del enfoque",
      "focus": "Grupos musculares",
      "exercisesCount": ${config.exercisesPerDay},
      "estimatedTime": "60-75 min",
      "exercises": [
        {
          "position": 1,
          "name": "Nombre exacto",
          "sets": 4,
          "reps": "8-12",
          "rest": "90s",
          "rpe": "7-8",
          "rir": "2-3",
          "muscleGroup": "Grupo",
          "category": "warmup|main|secondary|accessory|cooldown",
          "tempo": "3-1-2-0",
          "description": "Ejecución detallada",
          "cues": ["Cue 1", "Cue 2"],
          "tips": "Errores comunes",
          "videoQuery": "nombre YouTube",
          "purpose": "Por qué este ejercicio aquí",
          "alternatives": [
            {"name": "Alternativa 1", "difficulty": "Igual|Más fácil|Más difícil", "reason": "Por qué funciona"},
            {"name": "Alternativa 2", "difficulty": "Igual|Más fácil|Más difícil", "reason": "Por qué funciona"}
          ]
        }
      ]
    },
    {
      "weekCycle": 1,
      "dayName": "${trainingDays[1] || 'Día 2'} - NOMBRE ESPECÍFICO",
      "dayDescription": "Descripción del enfoque",
      "focus": "Grupos musculares",
      "exercisesCount": ${config.exercisesPerDay},
      "estimatedTime": "60-75 min",
      "exercises": [...]
    },
    {
      "weekCycle": 1,
      "dayName": "${trainingDays[2] || 'Día 3'} - NOMBRE ESPECÍFICO",
      "dayDescription": "Descripción del enfoque",
      "focus": "Grupos musculares",
      "exercisesCount": ${config.exercisesPerDay},
      "estimatedTime": "60-75 min",
      "exercises": [...]
    }${trainingFrequency >= 4 ? `,
    {
      "weekCycle": 1,
      "dayName": "${trainingDays[3] || 'Día 4'} - NOMBRE ESPECÍFICO",
      "dayDescription": "Descripción del enfoque",
      "focus": "Grupos musculares",
      "exercisesCount": ${config.exercisesPerDay},
      "estimatedTime": "60-75 min",
      "exercises": [...]
    }` : ''}${trainingFrequency >= 5 ? `,
    {
      "weekCycle": 1,
      "dayName": "${trainingDays[4] || 'Día 5'} - NOMBRE ESPECÍFICO",
      "dayDescription": "Descripción del enfoque",
      "focus": "Grupos musculares",
      "exercisesCount": ${config.exercisesPerDay},
      "estimatedTime": "60-75 min",
      "exercises": [...]
    }` : ''}${trainingFrequency >= 6 ? `,
    {
      "weekCycle": 1,
      "dayName": "${trainingDays[5] || 'Día 6'} - NOMBRE ESPECÍFICO",
      "dayDescription": "Descripción del enfoque",
      "focus": "Grupos musculares",
      "exercisesCount": ${config.exercisesPerDay},
      "estimatedTime": "60-75 min",
      "exercises": [...]
    }` : ''}
    // GENERAR EXACTAMENTE ${trainingFrequency} DÍAS COMPLETOS CON TODOS LOS EJERCICIOS
  ],
  "medicalAnalysis": {
    "severity": "None|Low|Medium|High",
    "warningTitle": "Solo si hay lesiones",
    "warningMessage": "Adaptaciones",
    "modifications": ["Modificación 1"]
  },
  "progressionWeeks2To4": "Cómo progresan",
  "deloadWeek": "Semana 4: reducir volumen",
  "nutritionSync": "Recomendaciones nutricionales",
  "recoveryTips": ["Tip 1", "Tip 2"]
}

RESTRICCIONES:
- NO solo 5 ejercicios de 3 series (MÍNIMO ${config.exercisesPerDay})
- VARIAR series y reps
- CADA alternativa viable
- **GENERAR EXACTAMENTE ${trainingFrequency} DÍAS COMPLETOS** en el array schedule
- Distribuir grupos musculares equilibradamente en los ${trainingFrequency} días seleccionados: ${trainingDays.join(', ')}
${muscularFocus ? `- PRIORIZAR ${muscularFocus} con mayor volumen y ejercicios variados` : ''}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Respuesta vacía de Gemini' })
      };
    }

    let json = text;
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) json = match[1];
    else {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start > -1 && end > -1) json = text.substring(start, end + 1);
    }

    const planId = Date.now().toString();
    const parsedPlan = JSON.parse(json);
    
    const workoutPlan = {
      id: planId,
      ...parsedPlan,
      title: parsedPlan.title || workoutType,
      startDate: new Date().toISOString()
    };
    
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
          console.warn('⚠️ No se guardó en BD');
        }
      } catch (dbErr: any) {
        console.warn('⚠️ No se guardó en BD:', dbErr?.message);
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(workoutPlan)
    };
  } catch (error: any) {
    console.error('❌ Error:', error?.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error?.message || 'Error desconocido' })
    };
  }
};

export { handler };


export { handler };
