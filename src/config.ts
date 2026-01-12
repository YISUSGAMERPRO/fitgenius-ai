// Archivo de configuración de entorno
// Copia este archivo como .env y reemplaza los valores

// URL del backend (cambiar en producción)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API Key de Gemini (si se usa desde frontend - NO RECOMENDADO en producción)
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
