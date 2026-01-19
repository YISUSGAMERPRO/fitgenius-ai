// Script para verificar la conexión a Neon
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    const res = await client.query('SELECT NOW() as now, current_database() as db, version() as version');
    console.log('✅ Conexión exitosa a Neon');
    console.log('Base de datos:', res.rows[0].db);
    console.log('Fecha/Hora:', res.rows[0].now);
    console.log('Versión:', res.rows[0].version);
  } catch (err) {
    console.error('❌ Error de conexión:', err);
  } finally {
    await client.end();
  }
}

main();
