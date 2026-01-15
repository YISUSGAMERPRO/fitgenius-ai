const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deleteUser() {
  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos\n');
    
    const sql = fs.readFileSync('delete-user-jesus.sql', 'utf8');
    const queries = sql.split(';').filter(q => q.trim() && !q.trim().startsWith('--'));
    
    for (const query of queries) {
      const result = await client.query(query);
      console.log('Query ejecutado:', query.trim().substring(0, 50) + '...');
      if (result.rows && result.rows.length > 0) {
        console.log('Resultado:', result.rows);
      }
    }
    
    console.log('\n✓ Usuario jesus2003camzav@gmail.com eliminado correctamente');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

deleteUser();
