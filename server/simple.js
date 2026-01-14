const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(compression());

console.log('✅ Express inicializado');
console.log('✅ Middlewares agregados');

// Health check
app.get('/api/health', (req, res) => {
    console.log('📍 GET /api/health');
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor en http://0.0.0.0:${PORT}`);
    console.log(`✅ DATABASE_URL: ${process.env.DATABASE_URL ? 'Configurada' : 'NO configurada'}`);
});

// Errores
server.on('error', (err) => {
    console.error('❌ Error de servidor:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Excepción:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Rechazo:', err);
});

console.log('✅ Listeners registrados');
console.log('✅ Proceso activo');
