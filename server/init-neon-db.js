// Script para inicializar la base de datos Neon desde Node.js
const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

const sql = fs.readFileSync(__dirname + '/neon-setup-complete.sql', 'utf8');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Conectado a Neon. Ejecutando script de inicialización...');
    await client.query(sql);
    console.log('✅ Tablas creadas correctamente.');
  } catch (err) {
    console.error('Error al crear tablas:', err);
  } finally {
    await client.end();
  }
}

main();
