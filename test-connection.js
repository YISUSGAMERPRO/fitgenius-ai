#!/usr/bin/env node

const http = require('http');

// Test de conexión simple
const options = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/',
    method: 'GET'
};

console.log('Intentando conectar a http://127.0.0.1:3001...\n');

const req = http.request(options, (res) => {
    console.log('✅ Conexión exitosa!');
    console.log('Status Code:', res.statusCode);
    process.exit(0);
});

req.on('error', (e) => {
    console.log('❌ Error de conexión:', e.message);
    process.exit(1);
});

req.end();
