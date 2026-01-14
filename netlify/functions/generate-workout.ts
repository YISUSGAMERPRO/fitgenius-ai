import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    console.log('🏋️ Generando rutina', workoutType);
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Prompt que genera la estructura exacta esperada
    const prompt = `
Genera SOLO JSON válido (sin explicaciones) para un plan de entrenamiento de 7 días con esta estructura EXACTA:
{
  "title": "Tipo de entrenamiento",
  "description": "Descripción breve del plan",
  "frequency": "X días por semana",
  "estimatedDuration": "Duración estimada",
  "difficulty": "Principiante|Intermedio|Avanzado",
  "durationWeeks": 8,
  "periodizationModel": "Linear Periodization",
  "progressionGuide": "Cómo progresar",
  "schedule": [
    {
      "dayName": "Día 1",
      "focus": "Grupo muscular",
      "exercises": [
        {
          "name": "Nombre ejercicio",
          "sets": "3",
          "reps": "12",
          "weight": "Kg",
          "rest": "60 segundos",
          "instructions": "Cómo hacerlo"
        }
      ]
    }
  ],
  "medicalAnalysis": {
    "injuries": [],
    "modifications": [],
    "severity": "None"
  }
}

Usuario: objetivo = ${profile.goal}
Tipo de entrenamiento: ${workoutType}

Responde SOLO con el JSON, sin markdown, sin explicaciones.`;
    
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