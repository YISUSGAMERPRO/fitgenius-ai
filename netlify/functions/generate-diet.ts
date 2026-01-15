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
      dietRecommendations: 'Aumentar superávit calórico. Incluir más carbohidratos complejos y proteínas. Comidas más frecuentes (6-7 al día). Añadir snacks calóricos saludables.' 
    };
  } else if (imc < 25) {
    return { 
      value: imc, 
      category: 'Peso normal', 
      dietRecommendations: 'Mantener balance calórico según objetivo. Distribución equilibrada de macronutrientes.' 
    };
  } else if (imc < 30) {
    return { 
      value: imc, 
      category: 'Sobrepeso', 
      dietRecommendations: 'Déficit calórico moderado (15-20%). Aumentar proteínas para preservar músculo. Reducir carbohidratos refinados. Priorizar vegetales y fibra.' 
    };
  } else if (imc < 35) {
    return { 
      value: imc, 
      category: 'Obesidad Grado I', 
      dietRecommendations: 'Déficit calórico estructurado (20-25%). Alta proteína (2g/kg ideal). Eliminar azúcares y ultraprocesados. Plan de comidas estricto con horarios definidos.' 
    };
  } else {
    return { 
      value: imc, 
      category: 'Obesidad Grado II-III', 
      dietRecommendations: 'IMPORTANTE: Plan supervisado médicamente. Déficit calórico controlado. Eliminar ultraprocesados y azúcares. Comidas pequeñas y frecuentes. Supervisión con nutricionista clínico obligatoria.' 
    };
  }
}

/**
 * Calcula los requerimientos calóricos y de macros personalizados
 */
function calculateNutritionNeeds(profile: any): { calories: number; protein: number; carbs: number; fats: number } {
  const weight = profile.weight || 70;
  const height = profile.height || 170;
  const age = profile.age || 30;
  const gender = profile.gender || 'Masculino';
  const activityLevel = profile.activityLevel || 'Moderado';
  const goal = profile.goal || 'Mantenimiento';
  
  // Harris-Benedict TMB
  let tmb: number;
  if (gender === 'Masculino' || gender === 'Male') {
    tmb = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    tmb = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  
  const activityFactors: Record<string, number> = {
    'Sedentario': 1.2,
    'Ligero (1-2 días/semana)': 1.375,
    'Moderado (3-5 días/semana)': 1.55,
    'Activo (6-7 días/semana)': 1.725,
    'Atleta profesional': 1.9
  };
  const activityFactor = activityFactors[activityLevel] || 1.55;
  let tdee = tmb * activityFactor;
  
  let proteinPerKg = 1.6;
  let carbPercent = 0.45;
  let fatPercent = 0.25;
  
  if (goal.includes('Perder') || goal.includes('grasa') || goal.includes('Lose')) {
    tdee *= 0.80;
    proteinPerKg = 2.2;
    carbPercent = 0.35;
    fatPercent = 0.30;
  } else if (goal.includes('Ganar') || goal.includes('músculo') || goal.includes('Gain')) {
    tdee *= 1.15;
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

/**
 * Refina los macros según el tipo de dieta específica
 */
function determineMacrosByDietAndGoal(dietType: string, goal: string, baseNeeds: any): any {
  const macros = { ...baseNeeds };
  
  if (dietType.includes('Cetogénica') || dietType.includes('Keto')) {
    macros.fats = Math.round((macros.calories * 0.70) / 9);
    macros.protein = Math.round((macros.calories * 0.25) / 4);
    macros.carbs = Math.round((macros.calories * 0.05) / 4);
  } else if (dietType.includes('Vegetariana')) {
    macros.protein = Math.round(macros.protein * 1.1);
    macros.carbs = Math.round(macros.carbs * 1.15);
  } else if (dietType.includes('Ayuno Intermitente')) {
    macros.protein = Math.round(macros.protein * 1.15);
  } else if (dietType.includes('Baja en Carbohidratos')) {
    macros.carbs = Math.round(macros.carbs * 0.6);
    macros.fats = Math.round(macros.fats * 1.3);
  }
  
  return macros;
}

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
    const { userId, profile, dietType, preferences, budget, mealsPerDay } = JSON.parse(event.body || '{}');
    
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
    
    const imcData = calculateIMC(profile.weight, profile.height);
    const nutritionNeeds = calculateNutritionNeeds(profile);
    const dietMacros = determineMacrosByDietAndGoal(dietType, profile.goal, nutritionNeeds);
    
    const preferencesText = preferences && preferences.length > 0
      ? `RESTRICCIONES/PREFERENCIAS OBLIGATORIAS: ${preferences.join(', ')}. RESPETA ESTRICTAMENTE.`
      : 'Sin preferencias específicas.';
    
    const budgetText = budget && budget.amount > 0
      ? `PRESUPUESTO: ${budget.amount} ${budget.frequency}. PRIORIZA ingredientes económicos y accesibles.`
      : '';
    
    const healthConditions = profile.injuries 
      ? `CONDICIONES MÉDICAS: ${profile.injuries}. REQUIERE alimentos antiinflamatorios o según la condición.`
      : '';
    
    const mealCount = mealsPerDay || 5;

    const prompt = `Eres nutricionista deportivo certificado especializado en EVIDENCIA CIENTÍFICA. 15+ años de experiencia.

IMPORTANTE: Crea plan ÚNICO Y COMPLETAMENTE PERSONALIZADO. NO plantillas genéricas.

## USUARIO (ÚNICA COMBINACIÓN):
- Nombre: ${profile.name || 'Usuario'}
- Edad: ${profile.age}, Peso: ${profile.weight}kg, Altura: ${profile.height}cm
- **IMC: ${imcData.value} - ${imcData.category}**
- Objetivo: ${profile.goal} | Actividad: ${profile.activityLevel}
- Tipo de cuerpo: ${profile.bodyType || 'No especificado'}

## MACROS CIENTÍFICAMENTE CALCULADOS:
- Calorías: ${dietMacros.calories} kcal
- Proteína: ${dietMacros.protein}g
- Carbohidratos: ${dietMacros.carbs}g
- Grasas: ${dietMacros.fats}g

## DIETA: ${dietType}
${preferencesText}
${budgetText}
${healthConditions}

## COMIDAS: ${mealCount} diarias

## REQUISITOS OBLIGATORIOS:
1. **7 DÍAS COMPLETAMENTE DIFERENTES**: Platillos ÚNICOS cada día. NO repetir desayunos/almuerzos
2. **${mealCount} COMIDAS VARIADAS**: Desayuno, snacks y comidas principales
3. **MACROS PRECISOS**: ${dietMacros.calories}±50 kcal, proteína ${dietMacros.protein}±3g
4. **2 ALTERNATIVAS POR PLATILLO**: Para ingredientes específicos
5. **ALIMENTOS REALES**: Sin suplementos genéricos
6. **TIMING NUTRICIONAL**: Proteína distribuida, carbos pre/post-entrenamiento
7. **ADAPTADO AL IMC**: ${imcData.dietRecommendations}

## EVIDENCIA CIENTÍFICA:
- Distribuir proteína en 4-5 tomas (Campbell 2016)
- Timing de carbohidratos según actividad
- Índice glucémico moderado
- Fibra 25-30g mínimo
- Grasas insaturadas 75%+

## JSON REQUERIDO (SOLO JSON):
{
  "title": "Plan Nutricional ${dietType}",
  "subtitle": "Personalizado para ${profile.goal}",
  "summary": "Resumen ejecutivo único",
  "dailyTargets": {
    "calories": ${dietMacros.calories},
    "protein": ${dietMacros.protein},
    "carbs": ${dietMacros.carbs},
    "fats": ${dietMacros.fats}
  },
  "mealTiming": {
    "breakfast": "8:00 AM",
    "snackAm": "10:30 AM",
    "lunch": "1:00 PM",
    "snackPm": "4:00 PM",
    "dinner": "7:00 PM"
  },
  "schedule": [
    {
      "day": "Lunes - NOMBRE ESPECÍFICO",
      "dayGoal": "Descripción del enfoque",
      "totalCalories": ${dietMacros.calories},
      "totalProtein": ${dietMacros.protein},
      "meals": [
        {
          "name": "Nombre atractivo único",
          "type": "Desayuno|Snack AM|Almuerzo|Snack PM|Cena",
          "description": "Descripción apetitosa",
          "ingredients": ["ingrediente 1 (cantidad)"],
          "instructions": ["Paso 1", "Paso 2"],
          "cookingTime": "XX min",
          "calories": XXX,
          "protein": XX,
          "carbs": XX,
          "fats": XX,
          "fiber": XX,
          "prepDifficulty": "Fácil|Intermedio|Avanzado",
          "nutritionBenefit": "Por qué beneficia",
          "alternatives": [
            {"ingredient": "a reemplazar", "with": "alternativa", "reason": "Por qué"}
          ]
        }
      ]
    }
  ],
  "scientificReferences": ["Campbell et al. 2016", "Helms et al. 2014"],
  "hydrationPlan": "Litros según peso",
  "supplementRecommendation": "Solo si es necesario",
  "weeklyShoppingList": ["ingrediente 1"],
  "mealPrepStrategy": "Estrategia eficiente"
}

RESTRICCIONES:
- NO repetir platillos 7 días
- NO nombres genéricos
- CADA alternativa viable
- SOLO JSON`;

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
    
    const dietPlan = {
      id: planId,
      ...parsedPlan,
      title: parsedPlan.title || dietType,
      startDate: new Date().toISOString(),
      calculatedTargets: dietMacros
    };
    
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
          console.log('✅ Dieta guardada');
        } else {
          console.warn('⚠️ No se guardó en BD');
        }
      } catch (dbErr: any) {
        console.warn('⚠️ No se guardó:', dbErr?.message);
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
