import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'pg';

const handler: Handler = async (event) => {
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

    console.log('🍽️ Generando dieta', dietType);
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `
Genera SOLO JSON válido (sin explicaciones) para un plan de dieta de 7 días con esta estructura EXACTA:
{
  "title": "Tipo de dieta",
  "summary": "Descripción breve del plan nutricional",
  "dailyTargets": {
    "protein": 150,
    "carbs": 200,
    "fats": 60,
    "calories": 2200
  },
  "schedule": [
    {
      "day": "Lunes",
      "meals": [
        {
          "name": "Desayuno",
          "description": "Descripción del plato",
          "ingredients": ["Ingrediente 1", "Ingrediente 2"],
          "calories": 350,
          "protein": 25,
          "carbs": 40,
          "fats": 8
        }
      ]
    }
  ],
  "scientificBasis": ["Principio 1", "Principio 2"],
  "hydrationRecommendation": "Bebe 3-4 litros de agua diaria"
}

Usuario: objetivo = ${profile.goal}
Tipo de dieta: ${dietType}

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
    const dietPlan = {
      id: planId,
      ...parsedPlan,
      title: parsedPlan.title || dietType,
      startDate: new Date().toISOString()
    };
    
    // Intentar guardar en Neon
    const databaseUrl = process.env.NETLIFY_DATABASE_URL_UNPOOLED;
    if (databaseUrl && userId) {
      try {
        const pool = new Pool({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false }
        });
        
        await pool.query(
          `INSERT INTO diet_plans (id, user_id, title, description, plan_data, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (id) DO UPDATE SET plan_data = $5`,
          [
            planId,
            userId,
            dietPlan.title || 'Plan de Dieta',
            dietPlan.summary || '',
            JSON.stringify(dietPlan)
          ]
        );
        console.log('✅ Dieta guardada en Neon');
        await pool.end();
      } catch (dbErr) {
        console.warn('⚠️ No se guardó en Neon:', dbErr);
        // No es error fatal
      }
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(dietPlan)
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
