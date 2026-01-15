import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Endpoint para intercambiar un platillo por una alternativa
 * cuando el usuario no tiene los ingredientes o prefiere otra opción
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
      currentMeal,       // El platillo actual a reemplazar
      mealType,          // Tipo de comida (Desayuno, Almuerzo, etc.)
      dietType,          // Tipo de dieta (Keto, Vegana, etc.)
      targetMacros,      // Macros objetivo para esta comida
      preferences,       // Preferencias del usuario
      mealsToAvoid,      // Lista de platillos a evitar (ya en el plan)
      userProfile        // Perfil del usuario para personalización
    } = JSON.parse(event.body || '{}');
    
    if (!currentMeal || !mealType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Se requiere currentMeal y mealType' })
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

    console.log('🔄 Buscando alternativa para:', currentMeal.name);
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const avoidList = mealsToAvoid?.length 
      ? `NO incluyas estos platillos (ya están en el plan): ${mealsToAvoid.join(', ')}`
      : '';
    
    const preferencesText = preferences?.length
      ? `PREFERENCIAS OBLIGATORIAS: ${preferences.join(', ')}`
      : '';

    const macrosText = targetMacros
      ? `MACROS OBJETIVO: ~${targetMacros.calories} kcal, ${targetMacros.protein}g proteína, ${targetMacros.carbs}g carbos, ${targetMacros.fats}g grasas`
      : '';

    const dietTypeText = dietType
      ? `TIPO DE DIETA: ${dietType}. Respeta estrictamente este tipo de alimentación.`
      : '';

    const prompt = `Eres un nutricionista experto. El usuario quiere REEMPLAZAR este platillo:

PLATILLO ACTUAL: ${currentMeal.name}
TIPO DE COMIDA: ${mealType}
${dietTypeText}
${macrosText}
${preferencesText}
${avoidList}

DATOS DEL USUARIO:
- Objetivo: ${userProfile?.goal || 'No especificado'}
- Peso: ${userProfile?.weight || 'No especificado'} kg
- Actividad: ${userProfile?.activityLevel || 'No especificado'}

Genera UN platillo alternativo que:
1. Sea apropiado para ${mealType}
2. Tenga macros similares al objetivo
3. Respete el tipo de dieta y preferencias
4. Sea diferente pero igual de nutritivo y sabroso
5. Incluya instrucciones de preparación

Responde ÚNICAMENTE con este JSON (sin markdown, sin explicaciones):
{
  "name": "Nombre del platillo alternativo",
  "type": "${mealType}",
  "description": "Descripción apetitosa del platillo",
  "ingredients": ["ingrediente 1 (cantidad)", "ingrediente 2 (cantidad)"],
  "instructions": ["Paso 1 de preparación", "Paso 2", "Paso 3"],
  "calories": número,
  "protein": número,
  "carbs": número,
  "fats": número,
  "prepTime": "X minutos",
  "alternatives": [
    {
      "name": "Alternativa de ingrediente",
      "swapFor": "ingrediente que reemplaza",
      "reason": "Por qué es buena alternativa"
    },
    {
      "name": "Otra alternativa",
      "swapFor": "ingrediente que reemplaza",
      "reason": "Por qué es buena alternativa"
    }
  ],
  "whyBetter": "Breve explicación de por qué este platillo es buena alternativa"
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

    const newMeal = JSON.parse(json);
    
    console.log('🔄 Platillo alternativo generado:', newMeal.name);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        originalMeal: currentMeal.name,
        newMeal
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
