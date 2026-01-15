import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Calcula el IMC y devuelve información relevante para la dieta
 */
function calculateIMC(weight: number, heightCm: number): { value: number; category: string; dietRecommendations: string } {
  if (!weight || !heightCm || heightCm <= 0) return { value: 0, category: 'No calculable', dietRecommendations: '' };
  const heightM = heightCm / 100;
  const imc = parseFloat((weight / (heightM * heightM)).toFixed(1));
  
  if (imc < 18.5) {
    return { 
      value: imc, 
      category: 'Bajo peso', 
      dietRecommendations: 'Aumentar superávit calórico. Incluir más carbohidratos complejos y proteínas. Comidas más frecuentes (6-7 al día). Añadir snacks calóricos saludables (frutos secos, aguacate, aceite de oliva).' 
    };
  } else if (imc < 25) {
    return { 
      value: imc, 
      category: 'Peso normal', 
      dietRecommendations: 'Mantener balance calórico según objetivo. Distribución equilibrada de macronutrientes. Plan flexible según preferencias.' 
    };
  } else if (imc < 30) {
    return { 
      value: imc, 
      category: 'Sobrepeso', 
      dietRecommendations: 'Déficit calórico moderado (15-20%). Aumentar proteínas para preservar músculo. Reducir carbohidratos refinados. Priorizar vegetales y fibra para saciedad. Control de porciones.' 
    };
  } else if (imc < 35) {
    return { 
      value: imc, 
      category: 'Obesidad Grado I', 
      dietRecommendations: 'Déficit calórico estructurado (20-25%). Alta proteína (2g/kg peso ideal). Eliminar azúcares añadidos y ultraprocesados. Plan de comidas estricto con horarios definidos. Considerar ayuno intermitente suave.' 
    };
  } else {
    return { 
      value: imc, 
      category: 'Obesidad Grado II-III', 
      dietRecommendations: 'IMPORTANTE: Plan supervisado por profesional médico. Déficit calórico controlado. Eliminar completamente ultraprocesados, azúcares y frituras. Comidas pequeñas y frecuentes. Hidratación abundante. Se recomienda seguimiento con nutricionista clínico.' 
    };
  }
}

/**
 * Calcula los requerimientos calóricos y de macros basados en el perfil del usuario
 */
function calculateNutritionNeeds(profile: any): { calories: number; protein: number; carbs: number; fats: number } {
  const weight = profile.weight || 70;
  const height = profile.height || 170;
  const age = profile.age || 30;
  const gender = profile.gender || 'Masculino';
  const activityLevel = profile.activityLevel || 'Moderado';
  const goal = profile.goal || 'Mantenimiento';
  
  // Calcular TMB (Tasa Metabólica Basal) con Harris-Benedict
  let tmb: number;
  if (gender === 'Masculino' || gender === 'Male') {
    tmb = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    tmb = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  
  // Factor de actividad
  const activityFactors: Record<string, number> = {
    'Sedentario': 1.2,
    'Ligero (1-2 días/semana)': 1.375,
    'Moderado (3-5 días/semana)': 1.55,
    'Activo (6-7 días/semana)': 1.725,
    'Atleta profesional': 1.9
  };
  const activityFactor = activityFactors[activityLevel] || 1.55;
  
  let tdee = tmb * activityFactor; // Total Daily Energy Expenditure
  
  // Ajustar según objetivo
  let proteinPerKg = 1.6; // gramos por kg
  let carbPercent = 0.45;
  let fatPercent = 0.25;
  
  if (goal.includes('Perder') || goal.includes('grasa') || goal.includes('Lose')) {
    tdee *= 0.80; // Déficit del 20%
    proteinPerKg = 2.2; // Más proteína para preservar músculo
    carbPercent = 0.35;
    fatPercent = 0.30;
  } else if (goal.includes('Ganar') || goal.includes('músculo') || goal.includes('Gain')) {
    tdee *= 1.15; // Superávit del 15%
    proteinPerKg = 2.0;
    carbPercent = 0.50;
    fatPercent = 0.25;
  } else if (goal.includes('Fuerza')) {
    proteinPerKg = 2.2;
    carbPercent = 0.40;
    fatPercent = 0.30;
  }
  
  const calories = Math.round(tdee);
  const protein = Math.round(weight * proteinPerKg);
  const proteinCalories = protein * 4;
  const remainingCalories = calories - proteinCalories;
  const carbs = Math.round((remainingCalories * carbPercent) / 4);
  const fats = Math.round((remainingCalories * fatPercent) / 9);
  
  return { calories, protein, carbs, fats };
}

const handler: Handler = async (event) => {
  // CORS headers
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
    const { userId, profile, dietType, preferences, budget } = JSON.parse(event.body || '{}');
    
    if (!userId || !profile || !dietType) {
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

    console.log('🍽️ Generando dieta personalizada', dietType);
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Calcular IMC del usuario
    const imcData = calculateIMC(profile.weight, profile.height);
    
    // Calcular necesidades nutricionales personalizadas
    const nutritionNeeds = calculateNutritionNeeds(profile);
    
    // Preferencias alimentarias
    const preferencesText = preferences && preferences.length > 0
      ? `PREFERENCIAS OBLIGATORIAS: ${preferences.join(', ')}. Respeta estrictamente estas preferencias.`
      : 'Sin preferencias específicas.';
    
    // Presupuesto
    const budgetText = budget && budget.amount > 0
      ? `PRESUPUESTO: ${budget.amount} ${budget.frequency}. Sugiere ingredientes económicos y accesibles.`
      : '';
    
    // Lesiones o condiciones que afectan la dieta
    const healthConditions = profile.injuries 
      ? `CONDICIONES DE SALUD: ${profile.injuries}. Adapta la dieta si es necesario (ej: antiinflamatorios para lesiones).`
      : '';

    const prompt = `Eres un nutricionista deportivo certificado con 15+ años de experiencia. Genera un plan de alimentación PERSONALIZADO y CIENTÍFICAMENTE FUNDAMENTADO.

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

## CONSIDERACIONES ESPECIALES SEGÚN IMC:
${imcData.dietRecommendations}

## REQUERIMIENTOS NUTRICIONALES CALCULADOS:
- Calorías diarias objetivo: ${nutritionNeeds.calories} kcal
- Proteína: ${nutritionNeeds.protein}g (${Math.round(nutritionNeeds.protein * 4 / nutritionNeeds.calories * 100)}%)
- Carbohidratos: ${nutritionNeeds.carbs}g
- Grasas: ${nutritionNeeds.fats}g

## TIPO DE DIETA SOLICITADA: ${dietType}
${preferencesText}
${budgetText}
${healthConditions}

## REQUISITOS OBLIGATORIOS:
1. Generar plan para 7 DÍAS DIFERENTES (no repetir los mismos platillos)
2. Cada día debe tener 5-6 comidas: Desayuno, Snack AM, Almuerzo, Snack PM, Cena (y opcionalmente Pre-sueño)
3. Los macros de cada día deben sumar aproximadamente las calorías objetivo (${nutritionNeeds.calories} kcal ±10%)
4. CADA platillo debe incluir 2 alternativas por si no se tiene algún ingrediente
5. Incluir instrucciones de preparación detalladas
6. Variar proteínas, carbohidratos y vegetales entre días
7. **ADAPTAR las porciones y tipo de alimentos según el IMC del usuario**

## ESTRUCTURA JSON REQUERIDA (responde SOLO con este JSON, sin texto adicional):
{
  "title": "Plan Nutricional ${dietType} - Personalizado",
  "summary": "Resumen del plan adaptado al objetivo de ${profile.goal}",
  "dailyTargets": {
    "calories": ${nutritionNeeds.calories},
    "protein": ${nutritionNeeds.protein},
    "carbs": ${nutritionNeeds.carbs},
    "fats": ${nutritionNeeds.fats}
  },
  "schedule": [
    {
      "day": "Lunes",
      "meals": [
        {
          "name": "Nombre del platillo",
          "type": "Desayuno|Snack AM|Almuerzo|Snack PM|Cena|Pre-sueño",
          "description": "Descripción apetitosa del platillo",
          "ingredients": ["ingrediente 1 (cantidad)", "ingrediente 2 (cantidad)"],
          "instructions": ["Paso 1", "Paso 2", "Paso 3"],
          "calories": 450,
          "protein": 35,
          "carbs": 40,
          "fats": 15,
          "prepTime": "15 minutos",
          "alternatives": [
            {
              "name": "Alternativa 1",
              "swapFor": "ingrediente a reemplazar",
              "reason": "Por qué es buena alternativa"
            },
            {
              "name": "Alternativa 2", 
              "swapFor": "ingrediente a reemplazar",
              "reason": "Por qué es buena alternativa"
            }
          ]
        }
      ]
    }
  ],
  "scientificBasis": [
    "Referencia científica 1 que respalda esta dieta",
    "Referencia científica 2"
  ],
  "hydrationRecommendation": "Beber X litros de agua al día según peso y actividad",
  "weeklyShoppingList": ["ingrediente 1", "ingrediente 2"],
  "mealPrepTips": ["Tip 1 para preparar comidas", "Tip 2"]
}

IMPORTANTE:
- Cada comida debe ser DIFERENTE cada día (no repetir el mismo desayuno 7 veces)
- Las alternativas son para intercambiar ingredientes, no platillos completos
- Sé creativo pero práctico con los ingredientes
- Respeta estrictamente el tipo de dieta (${dietType})

Responde ÚNICAMENTE con el JSON, sin explicaciones adicionales ni bloques de código markdown.`;

    console.log('📮 Llamando Gemini con prompt personalizado...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Respuesta:', text?.substring(0, 100));
    
    if (!text) {
      return {
        statusCode: 500,
        headers,
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
      startDate: new Date().toISOString(),
      // Guardar los targets calculados por si el AI los modificó
      calculatedTargets: nutritionNeeds
    };
    
    // Guardar en Railway
    const railwayUrl = process.env.RAILWAY_API_URL || 'https://fitgenius-ai-production.up.railway.app';
    if (userId) {
      try {
        const saveResponse = await fetch(`${railwayUrl}/api/save-diet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            title: dietPlan.title || 'Plan de Dieta',
            planData: dietPlan
          })
        });
        
        if (saveResponse.ok) {
          console.log('✅ Dieta guardada en Railway/Neon');
        } else {
          const error = await saveResponse.text();
          console.warn('⚠️ No se guardó en BD:', error);
        }
      } catch (dbErr: any) {
        console.warn('⚠️ No se guardó en BD:', dbErr?.message);
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(dietPlan)
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
