const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    // 1. Buscar el usuario
    const user = await client.query("SELECT id, email FROM users WHERE email = 'jesus2003camzav@gmail.com'");
    console.log('Usuario encontrado:', user.rows);
    
    if (user.rows.length === 0) {
      console.log('No existe el usuario jesus2003camzav@gmail.com');
      await client.end();
      return;
    }
    
    const userId = user.rows[0].id;
    
    // 2. Eliminar workout_plans
    const wp = await client.query('DELETE FROM workout_plans WHERE user_id = $1', [userId]);
    console.log(`✓ Eliminados ${wp.rowCount} planes de entrenamiento`);
    
    // 3. Eliminar diet_plans
    const dp = await client.query('DELETE FROM diet_plans WHERE user_id = $1', [userId]);
    console.log(`✓ Eliminados ${dp.rowCount} planes de dieta`);
    
    // 4. Eliminar user_profiles
    const up = await client.query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
    console.log(`✓ Eliminados ${up.rowCount} perfiles de usuario`);
    
    // 5. Eliminar user
    const u = await client.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log(`✓ Eliminado usuario (${u.rowCount})`);
    
    console.log('\n✅ Usuario jesus2003camzav@gmail.com eliminado completamente');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
}

run();
