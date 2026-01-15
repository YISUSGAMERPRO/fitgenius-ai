#!/usr/bin/env node
const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const DATABASE_URL = process.env.DATABASE_URL;

console.log('\n🔍 DEBUG: ¿QUÉ HAY EN NEON?\n');

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        // 1. Listar todas las tablas
        console.log('📋 TABLAS EN LA BASE DE DATOS:');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        if (tables.rows.length === 0) {
            console.log('   ❌ NO HAY TABLAS\n');
        } else {
            console.log(`   ✅ Encontradas ${tables.rows.length} tablas:\n`);
            for (const t of tables.rows) {
                const countResult = await pool.query(`SELECT COUNT(*) as cnt FROM "${t.table_name}"`);
                const count = countResult.rows[0]?.cnt || 0;
                console.log(`   • ${t.table_name}: ${count} filas`);
            }
        }
        console.log();

        // 2. Ver gym_members específicamente
        console.log('👥 CONTENIDO DE GYM_MEMBERS:');
        try {
            const result = await pool.query('SELECT * FROM gym_members');
            if (result.rows.length === 0) {
                console.log('   ❌ TABLA VACÍA - NO HAY MIEMBROS GUARDADOS\n');
            } else {
                console.log(`   ✅ ${result.rows.length} miembros encontrados:\n`);
                result.rows.forEach(row => {
                    console.log(`   • ${row.name} - ${row.plan}`);
                });
                console.log();
            }
        } catch (err) {
            console.log(`   ❌ ERROR: ${err.message}\n`);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    }
}

check();
