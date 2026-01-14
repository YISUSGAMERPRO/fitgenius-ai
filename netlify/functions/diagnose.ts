import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  try {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Diagnostic function working',
        timestamp: new Date().toISOString(),
        env: {
          geminiKey: process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing',
          databaseUrl: process.env.NETLIFY_DATABASE_URL_UNPOOLED ? '✅ Set' : '❌ Missing',
          nodeEnv: process.env.NODE_ENV
        }
      })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error?.message || 'Unknown error' })
    };
  }
};

export { handler };
