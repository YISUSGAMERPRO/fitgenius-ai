import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Endpoint para intercambiar un ejercicio por una alternativa
 * cuando el usuario no tiene el equipo necesario o prefiere otra opción
 */
const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const { 
      currentExercise,  // El ejercicio actual a reemplazar
      muscleGroup,      // Grupo muscular objetivo
      availableEquipment, // Equipo disponible del usuario
      exercisesToAvoid,   // Lista de ejercicios a evitar (ya en la rutina)
      userProfile         // Perfil del usuario para personalización
    } = JSON.parse(event.body || '{}');
    
    if (!currentExercise || !muscleGroup) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Se requiere currentExercise y muscleGroup' })
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

    console.log('🔄 Buscando alternativa para:', currentExercise);
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const avoidList = exercisesToAvoid?.length 
      ? `NO incluyas estos ejercicios (ya están en la rutina): ${exercisesToAvoid.join(', ')}`
      : '';
    
    const equipmentInfo = availableEquipment?.length
      ? `Equipamiento disponible: ${availableEquipment.join(', ')}`
      : 'El usuario puede no tener equipamiento especializado, prioriza ejercicios con peso corporal o mancuernas básicas';

    const injuriesInfo = userProfile?.injuries 
      ? `IMPORTANTE: El usuario tiene las siguientes limitaciones: ${userProfile.injuries}. Evita ejercicios contraindicados.`
      : '';

    const prompt = `Eres un entrenador personal experto. El usuario quiere REEMPLAZAR este ejercicio:

EJERCICIO ACTUAL: ${currentExercise}
GRUPO MUSCULAR: ${muscleGroup}
${equipmentInfo}
${injuriesInfo}
${avoidList}

Genera UN ejercicio alternativo que:
1. Trabaje el mismo grupo muscular
2. Sea igual o más efectivo
3. Use el equipamiento disponible (o peso corporal si no hay)
4. Sea seguro para las limitaciones del usuario

Responde ÚNICAMENTE con este JSON (sin markdown, sin explicaciones):
{
  "name": "Nombre del ejercicio alternativo",
  "sets": 3-5 (número variable según intensidad),
  "reps": "rango de repeticiones",
  "rest": "tiempo de descanso en segundos con 's'",
  "muscleGroup": "${muscleGroup}",
  "category": "main",
  "tempo": "tempo del movimiento (ej: 2-1-2-0)",
  "description": "Descripción detallada de cómo ejecutar el ejercicio correctamente",
  "tips": "Consejos de forma y errores comunes a evitar",
  "videoQuery": "término de búsqueda para YouTube",
  "alternatives": [
    {
      "name": "Otra alternativa posible",
      "reason": "Por qué es buena opción"
    },
    {
      "name": "Segunda alternativa",
      "reason": "Por qué es buena opción"
    }
  ],
  "whyBetter": "Breve explicación de por qué este ejercicio es buena alternativa al original"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Respuesta recibida');
    
    if (!text) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Respuesta vacía de Gemini' })
      };
    }

    // Extraer JSON de la respuesta
    let json = text;
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) json = match[1];
    else {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start > -1 && end > -1) json = text.substring(start, end + 1);
    }

    const newExercise = JSON.parse(json);
    
    console.log('🔄 Ejercicio alternativo generado:', newExercise.name);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        originalExercise: currentExercise,
        newExercise
      })
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
