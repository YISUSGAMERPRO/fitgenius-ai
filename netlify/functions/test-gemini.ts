import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const handler: Handler = async (event) => {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: 'GEMINI_API_KEY no configurada' })
      };
    }

    console.log('🤖 Probando Gemini API...');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Prompt simple y corto
    const prompt = 'Di "Hola" en JSON: {"mensaje": "tu respuesta"}';
    
    console.log('📮 Enviando prompt corto...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Respuesta recibida:', text);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        apiKeyPresent: true,
        responseLength: text?.length || 0,
        responsePreview: text?.substring(0, 200),
        fullResponse: text
      })
    };
  } catch (error: any) {
    console.error('❌ Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        type: error.constructor.name
      })
    };
  }
};

export { handler };
