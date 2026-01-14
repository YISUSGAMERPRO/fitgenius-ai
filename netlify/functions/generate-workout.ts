import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';
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

    const databaseUrl = process.env.VITE_API_DATABASE_URL || process.env.DATABASE_URL;
    
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
    const prompt = `Responde SOLO con JSON válido (sin explicaciones):
{"title":"Plan ${workoutType}","description":"Plan personalizado","frequency":"5 días","estimatedDuration":"60 min","difficulty":"intermedio","durationWeeks":4,"recommendations":["Descansa bien","Hidratate"],"schedule":[{"dayName":"Lunes","focus":"Pecho","exercises":[{"name":"Flexiones","sets":3,"reps":"10-12","rest":"60s","muscleGroup":"Pecho","category":"main","tempo":"2-0-1-0","description":"Básico","tips":"Respira","videoQuery":"flexiones"}]},{"dayName":"Martes","focus":"Espalda","exercises":[]},{"dayName":"Miércoles","focus":"Piernas","exercises":[]},{"dayName":"Jueves","focus":"Brazos","exercises":[]},{"dayName":"Viernes","focus":"Hombros","exercises":[]},{"dayName":"Sábado","focus":"Cardio","exercises":[]},{"dayName":"Domingo","focus":"Descanso","exercises":[]}]}`;

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
        console.warn('⚠️ No se pudo guardar en BD:', dbErr);
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
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

export { handler };
