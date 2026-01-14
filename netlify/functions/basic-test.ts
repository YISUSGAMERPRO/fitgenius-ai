import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  console.log('✅ Función basic-test ejecutada');
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: 'OK - Función ejecutada correctamente',
      timestamp: new Date().toISOString()
    })
  };
};

export { handler };
