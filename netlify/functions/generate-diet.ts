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
    
    const prompt = `Eres un nutricionista profesional. Genera un plan de nutrición personalizado en SOLO JSON válido.

Datos del usuario:
- Edad: ${profile.age}
- Peso: ${profile.weight}kg
- Altura: ${profile.height}cm
- Género: ${profile.gender}
- Objetivo: ${profile.goal}
- Nivel de actividad: ${profile.activityLevel}
- Tipo de cuerpo: ${profile.bodyType || 'No especificado'}
- Preferencias: ${profile.equipment.join(', ') || 'Ninguna'}
- Restricciones: ${profile.injuries || 'Ninguna'}
- Tipo de dieta solicitada: ${dietType}

Genera un plan completo de 7 días con 3-4 comidas diarias balanceadas nutricionalmente. Personaliza según el objetivo y restricciones.

Responde SOLO con JSON válido (sin explicaciones ni markdown):
{
  "title": "${dietType} - Plan Personalizado",
  "summary": "Plan de nutrición adaptado a tu perfil y objetivos",
  "dailyTargets": {"protein": 150, "carbs": 200, "fats": 60, "calories": 2200},
  "schedule": [
    {"day": "Lunes", "meals": [{"name": "Desayuno", "description": "Avena con proteína", "ingredients": ["Avena 50g", "Proteína en polvo 30g", "Banana", "Almendras 30g", "Miel 1 cucharada"], "instructions": ["Mezcla avena con agua caliente", "Agrega proteína en polvo", "Sirve con banana y almendras"], "calories": 380, "protein": 30, "carbs": 45, "fats": 12}, {"name": "Almuerzo", "description": "Pollo con arroz integral", "ingredients": ["Pechuga de pollo 180g", "Arroz integral 150g", "Espinaca 100g", "Aceite de oliva 1 cucharada"], "instructions": ["Cocina el arroz", "Cocina el pollo a la plancha", "Saltea la espinaca", "Sirve junto"], "calories": 550, "protein": 45, "carbs": 60, "fats": 10}, {"name": "Merienda", "description": "Batido de proteína", "ingredients": ["Leche descremada 200ml", "Proteína en polvo 25g", "Fresa 100g", "Hielo"], "instructions": ["Mezcla leche y proteína", "Agrega fresas", "Añade hielo", "Licúa"], "calories": 180, "protein": 25, "carbs": 18, "fats": 1}, {"name": "Cena", "description": "Salmón con batata", "ingredients": ["Filete de salmón 150g", "Batata 150g", "Brócoli 150g", "Limón"], "instructions": ["Hornea salmón a 180°C por 15 min", "Cocina batata al vapor", "Cocina brócoli", "Condimenta con limón"], "calories": 420, "protein": 35, "carbs": 45, "fats": 12}]},
    {"day": "Martes", "meals": [{"name": "Desayuno", "description": "Huevos con pan integral", "ingredients": ["Huevos 3", "Pan integral 2 rebanadas", "Tomate 1", "Aguacate 50g"], "instructions": ["Cocina los huevos revueltos", "Tuesta el pan", "Sirve con tomate y aguacate"], "calories": 400, "protein": 25, "carbs": 35, "fats": 15}, {"name": "Almuerzo", "description": "Pavo molido con papa", "ingredients": ["Pavo molido 180g", "Papa 200g", "Zanahoria 100g", "Aceite de oliva"], "instructions": ["Cocina el pavo en la sartén", "Hierve la papa", "Cocina zanahoria", "Mezcla todo"], "calories": 480, "protein": 40, "carbs": 55, "fats": 8}, {"name": "Merienda", "description": "Yogurt con granola", "ingredients": ["Yogurt griego 150g", "Granola 30g", "Arándanos 50g"], "instructions": ["Vierte el yogurt en un tazón", "Agrega granola", "Cubre con arándanos"], "calories": 220, "protein": 18, "carbs": 28, "fats": 5}, {"name": "Cena", "description": "Tilapia al horno", "ingredients": ["Filete de tilapia 150g", "Arroz blanco 150g", "Verduras mixtas 200g"], "instructions": ["Hornea tilapia a 180°C por 12 min", "Cocina el arroz", "Saltea verduras", "Sirve junto"], "calories": 400, "protein": 38, "carbs": 48, "fats": 6}]},
    {"day": "Miércoles", "meals": [{"name": "Desayuno", "description": "Pancakes proteicos", "ingredients": ["Harina de avena 50g", "Huevo 1", "Proteína en polvo 20g", "Plátano"], "instructions": ["Mezcla ingredientes secos", "Añade huevo y proteína", "Cocina en sartén", "Sirve con plátano"], "calories": 350, "protein": 28, "carbs": 40, "fats": 8}, {"name": "Almuerzo", "description": "Atún con quinoa", "ingredients": ["Atún en lata 120g", "Quinoa cocida 150g", "Vegetales mixtos 150g"], "instructions": ["Cocina quinoa", "Mezcla con atún", "Agrega vegetales", "Aliña con limón"], "calories": 420, "protein": 32, "carbs": 50, "fats": 8}, {"name": "Merienda", "description": "Casein shake", "ingredients": ["Leche 200ml", "Caseína 25g", "Cacao"], "instructions": ["Mezcla leche con caseína", "Agrega cacao", "Licúa"], "calories": 180, "protein": 26, "carbs": 15, "fats": 3}, {"name": "Cena", "description": "Pechuga de pavo", "ingredients": ["Pechuga de pavo 150g", "Boniato 150g", "Espárragos 200g"], "instructions": ["Cocina pavo a la plancha", "Hornea boniato", "Cocina espárragos al vapor", "Sirve"], "calories": 380, "protein": 42, "carbs": 42, "fats": 5}]},
    {"day": "Jueves", "meals": [{"name": "Desayuno", "description": "Cereal con leche", "ingredients": ["Avena 50g", "Leche descremada 200ml", "Moras 100g", "Miel"], "instructions": ["Vierte cereal en tazón", "Agrega leche", "Cubre con moras", "Rocía miel"], "calories": 360, "protein": 18, "carbs": 50, "fats": 6}, {"name": "Almuerzo", "description": "Costilla de res", "ingredients": ["Costilla de res 150g", "Papas asadas 150g", "Ensalada 200g"], "instructions": ["Cocina costilla a la parrilla", "Asa papas", "Prepara ensalada fresca", "Sirve"], "calories": 520, "protein": 38, "carbs": 48, "fats": 18}, {"name": "Merienda", "description": "Barrita proteica", "ingredients": ["Barrita proteica 1"], "instructions": ["Come como snack"], "calories": 200, "protein": 20, "carbs": 22, "fats": 6}, {"name": "Cena", "description": "Pez espada a la mantequilla", "ingredients": ["Pez espada 150g", "Arroz integral 150g", "Champiñones 150g"], "instructions": ["Cocina pez espada a la sartén", "Cocina arroz integral", "Saltea champiñones", "Sirve"], "calories": 450, "protein": 40, "carbs": 45, "fats": 12}]},
    {"day": "Viernes", "meals": [{"name": "Desayuno", "description": "Tostadas francesas", "ingredients": ["Pan integral 2 rebanadas", "Huevo 2", "Leche 100ml", "Canela"], "instructions": ["Mezcla huevo y leche", "Remoja pan", "Cocina en sartén", "Sirve con canela"], "calories": 380, "protein": 20, "carbs": 42, "fats": 12}, {"name": "Almuerzo", "description": "Lomo saltado", "ingredients": ["Lomo 150g", "Papa 150g", "Cebolla 100g", "Tomate"], "instructions": ["Cocina papa", "Saltea carne", "Añade vegetales", "Mezcla todo"], "calories": 500, "protein": 38, "carbs": 50, "fats": 14}, {"name": "Merienda", "description": "Mix de frutos secos", "ingredients": ["Almendras 30g", "Nueces 20g", "Arándanos secos 20g"], "instructions": ["Mezcla todo", "Come como snack"], "calories": 250, "protein": 8, "carbs": 20, "fats": 16}, {"name": "Cena", "description": "Pechuga rellena", "ingredients": ["Pechuga de pollo 150g", "Queso bajo en grasa", "Espinaca 100g", "Pasta integral 150g"], "instructions": ["Haz un corte en la pechuga", "Rellena con queso y espinaca", "Cocina al horno", "Sirve con pasta"], "calories": 420, "protein": 42, "carbs": 45, "fats": 9}]},
    {"day": "Sábado", "meals": [{"name": "Desayuno", "description": "Omelet de verduras", "ingredients": ["Huevos 3", "Brócoli 100g", "Queso 30g", "Champiñones 100g"], "instructions": ["Saltea verduras", "Calienta sartén", "Vierte huevos", "Agrega verduras y queso"], "calories": 380, "protein": 28, "carbs": 15, "fats": 22}, {"name": "Almuerzo", "description": "Milanesas de pollo", "ingredients": ["Pechuga de pollo 180g", "Pan rallado integral 50g", "Ensalada 200g", "Limón"], "instructions": ["Aplana la pechuga", "Empaniza en pan rallado", "Fríe o hornea", "Sirve con ensalada"], "calories": 480, "protein": 45, "carbs": 35, "fats": 14}, {"name": "Merienda", "description": "Chocolate proteico", "ingredients": ["Leche 200ml", "Proteína chocolate 25g", "Hielo"], "instructions": ["Mezcla leche y proteína", "Añade hielo", "Licúa bien"], "calories": 180, "protein": 28, "carbs": 12, "fats": 2}, {"name": "Cena", "description": "Trucha a la sal", "ingredients": ["Trucha 150g", "Papas pequeñas 150g", "Vegetales al vapor 200g"], "instructions": ["Envuelve trucha en sal", "Hornea a 190°C por 25 min", "Cocina papas y vegetales", "Sirve"], "calories": 400, "protein": 40, "carbs": 42, "fats": 10}]},
    {"day": "Domingo", "meals": [{"name": "Desayuno", "description": "Batido de desayuno", "ingredients": ["Leche 250ml", "Plátano 1", "Proteína 25g", "Mantequilla de maní 1 cucharada"], "instructions": ["Licúa leche y plátano", "Agrega proteína", "Añade mantequilla de maní", "Sirve"], "calories": 420, "protein": 30, "carbs": 45, "fats": 13}, {"name": "Almuerzo", "description": "Asado variado", "ingredients": ["Carne de res 150g", "Pollo 100g", "Verduras asadas 200g"], "instructions": ["Asa carne en parrilla", "Asa pollo", "Asa vegetales", "Sirve variado"], "calories": 520, "protein": 48, "carbs": 30, "fats": 18}, {"name": "Merienda", "description": "Sándwich proteico", "ingredients": ["Pan integral 2 rebanadas", "Pechuga de pavo 100g", "Lechuga", "Tomate"], "instructions": ["Arma el sándwich", "Agrega lechuga y tomate", "Corta por la mitad"], "calories": 280, "protein": 25, "carbs": 32, "fats": 6}, {"name": "Cena", "description": "Pasta con camarones", "ingredients": ["Pasta integral 150g", "Camarones 150g", "Brócoli 150g", "Ajo", "Aceite de oliva"], "instructions": ["Cocina pasta", "Saltea camarones con ajo", "Cocina brócoli", "Mezcla todo"], "calories": 420, "protein": 36, "carbs": 52, "fats": 8}]}
  ],
  "scientificBasis": ["Periodización de macronutrientes según objetivo", "Balance de ácidos grasos omega-3 y omega-6", "Distribución estratégica de carbohidratos"],
  "shoppingList": ["Carnes variadas", "Pescados", "Huevos", "Lácteos bajos en grasa", "Arroz integral", "Pasta integral", "Verduras frescas", "Frutas de temporada", "Frutos secos"],
  "tips": ["Prepara tus comidas el domingo", "Mantén porciones consistentes", "Bebe 3-4 litros de agua diaria", "Come cada 3-4 horas", "Duerme 7-8 horas para recuperación"]
}`;

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
