#!/usr/bin/env node
/**
 * Script para verificar y depurar la conexión a Neon
 * y ver qué datos realmente están guardados
 */

const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const DATABASE_URL = process.env.DATABASE_URL;

console.log('\n🔍 VERIFICACIÓN DE CONEXIÓN A NEON\n');
console.log('=' .repeat(60));

if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL no está configurada');
    process.exit(1);
}

console.log('📡 DATABASE_URL detectada');
console.log('✅ Conectando a Neon...\n');

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function debugDatabase() {
    const client = await pool.connect();
    
    try {
        // 1. Ver información de la base de datos
        console.log('1️⃣ INFORMACIÓN DE LA BASE DE DATOS:');
        const dbInfo = await client.query(`
            SELECT datname, pg_size_pretty(pg_database.pg_database_size(datname)) AS size
            FROM pg_database 
            WHERE datname = current_database()
        `);
        console.log(`   Base: ${dbInfo.rows[0]?.datname}`);
        console.log(`   Tamaño: ${dbInfo.rows[0]?.size}\n`);

        // 2. Ver todas las tablas
        console.log('2️⃣ TABLAS EN LA BASE DE DATOS:');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        if (tables.rows.length === 0) {
            console.log('   ❌ NO HAY TABLAS EN PUBLIC SCHEMA\n');
        } else {
            tables.rows.forEach(row => {
                console.log(`   • ${row.table_name}`);
            });
            console.log();
        }

        // 3. Contar filas en cada tabla
        console.log('3️⃣ CONTEO DE FILAS POR TABLA:');
        for (const table of tables.rows) {
            const result = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
            const count = result.rows[0]?.count || 0;
            console.log(`   ${table.table_name}: ${count} filas`);
        }
        console.log();

        // 4. Ver contenido de gym_members si existe
        console.log('4️⃣ CONTENIDO DE GYM_MEMBERS:');
        try {
            const members = await client.query('SELECT * FROM gym_members LIMIT 10');
            if (members.rows.length === 0) {
                console.log('   ❌ LA TABLA gym_members ESTÁ VACÍA\n');
            } else {
                console.log(`   ✅ Encontrados ${members.rows.length} miembros:\n`);
                members.rows.forEach((row, idx) => {
                    console.log(`   ${idx + 1}. ${row.name} - ${row.plan}`);
                });
                console.log();
            }
        } catch (err) {
            console.log(`   ❌ ERROR: ${err.message}\n`);
        }

        // 5. Ver schemas
        console.log('5️⃣ ESQUEMAS DISPONIBLES:');
        const schemas = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata
            WHERE schema_name NOT LIKE 'pg_%'
            ORDER BY schema_name
        `);
        schemas.rows.forEach(row => {
            console.log(`   • ${row.schema_name}`);
        });
        console.log();

        console.log('=' .repeat(60));
        console.log('\n📋 RESUMEN:\n');
        
        // Determinar el problema
        const gymMembersTable = tables.rows.find(t => t.table_name === 'gym_members');
        
        if (!gymMembersTable) {
            console.log('❌ PROBLEMA: Tabla gym_members NO EXISTE');
            console.log('   Solución: Ejecutar el servidor para crear las tablas');
        } else {
            const memberCount = await client.query('SELECT COUNT(*) as count FROM gym_members');
            const count = memberCount.rows[0]?.count || 0;
            
            if (count === 0) {
                console.log('❌ PROBLEMA: Tabla gym_members existe pero está VACÍA');
                console.log('   Solución: Ejecutar node insert-test-data.js');
            } else {
                console.log(`✅ OK: ${count} miembros guardados en Neon`);
            }
        }
        
    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

debugDatabase().catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});
