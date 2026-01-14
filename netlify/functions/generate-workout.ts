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
    
    // PROMPT SIMPLIFICADO - SIN EJEMPLOS GIGANTES
    const prompt = `Genera un plan de entrenamiento de 7 días SOLO en JSON válido para alguien con objetivo: ${profile.goal}. Sin explicaciones, SOLO JSON.

`;
    
    const genAI2 = new GoogleGenerativeAI(geminiApiKey);
    const model2 = genAI2.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    console.log('📮 Enviando prompt a Gemini API...');
    let result;
    try {
      result = await model.generateContent(prompt);
      console.log('✅ Respuesta recibida de Gemini');
    } catch (genErr) {
      console.error('❌ Error llamando a generateContent:', genErr);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error en Gemini API: ' + (genErr as any).message })
      };
    }
    
    const response = await result.response;
    console.log('📥 Response object:', { contentLength: response?.content?.length || 0 });

    const responseText = response.text();
    console.log('📄 Response text length:', responseText?.length || 0);
    
    if (!responseText || responseText.trim().length === 0) {
      console.error('❌ Gemini devolvió respuesta vacía');
      console.error('Response parts:', response?.content?.parts?.length || 0);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Sin respuesta de Gemini (vacía)' })
      };
    }

    // Extraer JSON del markdown
    let jsonText = responseText;
    const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (markdownMatch) {
      jsonText = markdownMatch[1].trim();
    } else {Llamando Gemini...');
    const result = await model2.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Respuesta:', text?.substring(0, 100));
    
    if (!text) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Respuesta vacía de Gemini' })
      };
    }

    // Extraer JSON
    let json = text;
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) json = match[1];
    else {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start > -1 && end > -1) json = text.substring(start, end + 1);
    }

    const planId = Date.now().toString();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ id: planId, title: workoutType, plan: JSON.parse(json) })
    };
  } catch (error: any) {
    console.error('❌ Error:', error?.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error?.message || 'Error desconocido'