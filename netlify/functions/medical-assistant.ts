import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Calcula el IMC para el asistente médico
 */
function calculateIMC(weight: number, heightCm: number): { value: number; category: string } {
  if (!weight || !heightCm || heightCm <= 0) return { value: 0, category: 'No calculable' };
  const heightM = heightCm / 100;
  const imc = parseFloat((weight / (heightM * heightM)).toFixed(1));
  
  if (imc < 18.5) return { value: imc, category: 'Bajo peso' };
  else if (imc < 25) return { value: imc, category: 'Peso normal' };
  else if (imc < 30) return { value: imc, category: 'Sobrepeso' };
  else if (imc < 35) return { value: imc, category: 'Obesidad Grado I' };
  else if (imc < 40) return { value: imc, category: 'Obesidad Grado II' };
  else return { value: imc, category: 'Obesidad Grado III' };
}

/**
 * Asistente Médico IA - Dr. FitGenius
 * Proporciona asesoría médica deportiva basada en el contexto del usuario
 */
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
    const { 
      messages,      // Historial de conversación
      userProfile,   // Perfil del usuario
      workout,       // Plan de entrenamiento actual (opcional)
      diet           // Plan de dieta actual (opcional)
    } = JSON.parse(event.body || '{}');
    
    if (!messages || !userProfile) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Se requiere messages y userProfile' })
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

    console.log('🩺 Dr. FitGenius procesando consulta...');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Calcular IMC del paciente
    const imcData = calculateIMC(userProfile.weight, userProfile.height);
    
    // Construir contexto del usuario
    const userContext = `
## PERFIL DEL PACIENTE:
- Nombre: ${userProfile.name || 'Usuario'}
- Edad: ${userProfile.age} años
- Peso: ${userProfile.weight} kg
- Altura: ${userProfile.height} cm
- **IMC: ${imcData.value} (${imcData.category})**
- Género: ${userProfile.gender}
- Objetivo fitness: ${userProfile.goal}
- Nivel de actividad: ${userProfile.activityLevel}
- Tipo de cuerpo: ${userProfile.bodyType || 'No especificado'}
- Lesiones/Condiciones previas: ${userProfile.injuries || 'Ninguna reportada'}
`;

    const workoutContext = workout ? `
## PLAN DE ENTRENAMIENTO ACTUAL:
- Nombre: ${workout.title}
- Tipo: ${workout.frequency}
- Duración: ${workout.estimatedDuration}
- Dificultad: ${workout.difficulty}
${workout.medicalAnalysis?.modifications?.length ? `- Modificaciones médicas aplicadas: ${workout.medicalAnalysis.modifications.join(', ')}` : ''}
` : '';

    const dietContext = diet ? `
## PLAN NUTRICIONAL ACTUAL:
- Tipo de dieta: ${diet.title}
- Calorías diarias: ${diet.dailyTargets?.calories} kcal
- Proteína: ${diet.dailyTargets?.protein}g
- Carbohidratos: ${diet.dailyTargets?.carbs}g
- Grasas: ${diet.dailyTargets?.fats}g
` : '';

    // Formatear historial de conversación
    const conversationHistory = messages.map((m: { role: string; text: string }) => 
      `${m.role === 'user' ? 'PACIENTE' : 'DR. FITGENIUS'}: ${m.text}`
    ).join('\n\n');

    const systemPrompt = `Eres el **Dr. FitGenius**, un asistente médico deportivo especializado con las siguientes credenciales y características:

## TU ROL:
- Médico deportivo virtual con especialización en:
  • Lesiones musculoesqueléticas deportivas
  • Nutrición deportiva y suplementación
  • Fisiología del ejercicio
  • Recuperación y prevención de lesiones
  • Protocolos de sueño y descanso
  • Farmacología deportiva básica

## REGLAS CRÍTICAS DE SEGURIDAD:
1. **NUNCA** diagnostiques condiciones graves definitivamente - siempre recomienda consultar a un médico real
2. **NUNCA** recetes medicamentos con receta médica
3. Si detectas síntomas de emergencia (dolor de pecho, dificultad respiratoria, pérdida de consciencia), responde con "[ALERTA MÉDICA]" al inicio
4. Siempre aclara que eres una IA y no reemplazas la atención médica profesional

## TU ESTILO DE COMUNICACIÓN:
- Profesional pero cercano y empático
- Usa lenguaje claro, evita jerga médica excesiva
- Estructura tus respuestas con viñetas o pasos cuando sea apropiado
- Sé específico y práctico en tus recomendaciones
- Relaciona las respuestas con el contexto del paciente (su rutina, dieta, objetivos)

## CAPACIDADES ESPECIALES:
- Puedes sugerir modificaciones a ejercicios basándote en dolencias
- Puedes recomendar suplementos seguros (creatina, proteína, vitaminas, etc.)
- Puedes crear protocolos de recuperación (hielo/calor, estiramientos, descanso)
- Puedes analizar si ciertos síntomas están relacionados con el entrenamiento o dieta

## FORMATO DE RESPUESTA:
- Usa **negritas** para términos importantes
- Usa viñetas (•) para listas
- Mantén respuestas concisas pero completas (150-300 palabras idealmente)
- Si es una emergencia, comienza con [ALERTA MÉDICA]

${userContext}
${workoutContext}
${dietContext}

## HISTORIAL DE CONVERSACIÓN:
${conversationHistory}

Responde a la última consulta del paciente de manera profesional, empática y útil. Recuerda relacionar tu respuesta con su perfil, entrenamiento y/o dieta cuando sea relevante.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Respuesta vacía de Gemini' })
      };
    }

    console.log('✅ Dr. FitGenius respondió');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        response: text
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
