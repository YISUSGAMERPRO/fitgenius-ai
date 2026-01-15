const express = require('express');
const app = express();
const PORT = 3001;

app.get('/test', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor de prueba corriendo en puerto ${PORT}`);
});

server.on('error', (err) => {
    console.error('Error del servidor:', err);
});

console.log('Servidor iniciado, esperando conexiones...');
