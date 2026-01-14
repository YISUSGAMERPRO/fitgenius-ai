import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';
import { Pool } from 'pg';

const handler: Handler = async (event) => {
  let pool: Pool | null = null;
  
  try {
    const { userId, profile, dietType } = JSON.parse(event.body || '{}');
    
    if (!userId || !profile || !dietType) {
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

    const databaseUrl = process.env.VITE_API_DATABASE_URL || process.env.DATABASE_URL;
    
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
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

    // Intentar guardar en BD si está disponible
    if (databaseUrl) {
      try {
        pool = new Pool({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false }
        });

        await pool.query(
          `INSERT INTO diet_plans (id, user_id, title, plan_data, created_at) 
           VALUES ($1, $2, $3, $4, NOW())`,
          [planId, userId, dietPlan.title || 'Plan de Nutrición', JSON.stringify(dietPlan)]
        );
        
        console.log('✅ Dieta guardada en BD');
      } catch (dbErr) {
        console.warn('⚠️ No se pudo guardar en BD:', dbErr);
        // No es error fatal, devolvemos la dieta generada
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
