// Netlify Function para verificar variables de entorno
import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      geminiApiKey: process.env.GEMINI_API_KEY ? `Presente (${process.env.GEMINI_API_KEY.substring(0, 10)}...)` : 'NO CONFIGURADA',
      databaseUrl: process.env.NETLIFY_DATABASE_URL_UNPOOLED ? 'Presente' : 'NO CONFIGURADA',
      timestamp: new Date().toISOString()
    })
  };
};

export { handler };
