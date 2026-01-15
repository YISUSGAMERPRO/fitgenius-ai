#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        console.log('📋 Verificando estructura de gym_members...\n');

        // Obtener información de columnas
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'gym_members'
            ORDER BY ordinal_position
        `);

        if (result.rows.length === 0) {
            console.log('❌ La tabla gym_members no existe');
        } else {
            console.log('✅ Columnas en gym_members:');
            console.log('=====================================');
            for (const col of result.rows) {
                console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? '[NOT NULL]' : '[NULLABLE]'}`);
            }
            console.log('=====================================\n');
        }

        // Contar registros
        const countResult = await pool.query('SELECT COUNT(*) FROM gym_members');
        console.log(`📊 Total de registros: ${countResult.rows[0].count}`);

        await pool.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkSchema();
