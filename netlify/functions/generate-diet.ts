import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

const handler: Handler = async (event) => {
  try {
    const { userId, profile, dietType } = JSON.parse(event.body || '{}');
    
    if (!userId || !profile || !dietType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan parámetros' })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: 'GEMINI_API_KEY no configurada' })
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Responde SOLO con JSON válido (sin explicaciones):
{"title":"Plan ${dietType}","description":"Plan nutricional","weeklyCalories":2000,"macros":{"protein":30,"carbs":40,"fats":30},"mealPlan":[{"day":"Lunes","meals":[{"name":"Desayuno","time":"7:00","items":["Avena","Leche"],"calories":350,"macros":{"protein":10,"carbs":50,"fats":8}},{"name":"Almuerzo","time":"13:00","items":["Pollo","Arroz"],"calories":600,"macros":{"protein":40,"carbs":60,"fats":10}},{"name":"Cena","time":"19:00","items":["Pescado","Verduras"],"calories":400,"macros":{"protein":35,"carbs":30,"fats":12}}]},{"day":"Martes","meals":[]},{"day":"Miércoles","meals":[]},{"day":"Jueves","meals":[]},{"day":"Viernes","meals":[]},{"day":"Sábado","meals":[]},{"day":"Domingo","meals":[]}],"shoppingList":["Pollo","Arroz","Pescado","Verduras"],"tips":["Hidratate","Come despacio"]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt
    });

    if (!response.text) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Sin respuesta de Gemini' })
      };
    }

    // Extraer JSON del markdown
    let jsonText = response.text;
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

    const dietPlan = JSON.parse(jsonText);
    const planId = Date.now().toString();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ ...dietPlan, id: planId })
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

export { handler };
