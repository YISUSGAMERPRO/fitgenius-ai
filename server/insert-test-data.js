#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function insertTestData() {
    try {
        console.log('📝 Insertando datos de prueba en Neon...\n');

        // Datos de prueba para miembros
        const members = [
            { name: 'Carlos Mendez', plan: 'Premium', status: 'Activo', payment: 99.99 },
            { name: 'Maria Garcia', plan: 'Standard', status: 'Activo', payment: 49.99 },
            { name: 'Juan Lopez', plan: 'Basic', status: 'Activo', payment: 29.99 },
            { name: 'Sofia Rodriguez', plan: 'Premium', status: 'Activo', payment: 99.99 },
            { name: 'Pedro Sanchez', plan: 'Standard', status: 'Pausado', payment: 0 },
            { name: 'Ana Martinez', plan: 'Premium', status: 'Activo', payment: 99.99 },
            { name: 'Diego Flores', plan: 'Basic', status: 'Activo', payment: 29.99 },
            { name: 'Laura Gutierrez', plan: 'Standard', status: 'Activo', payment: 49.99 },
            { name: 'Roberto Jimenez', plan: 'Premium', status: 'Activo', payment: 99.99 },
            { name: 'Elena Vargas', plan: 'Standard', status: 'Activo', payment: 49.99 }
        ];

        // Insertar miembros
        console.log('👥 Guardando 10 miembros de prueba...');
        let insertedCount = 0;
        for (const member of members) {
            const result = await pool.query(
                `INSERT INTO gym_members (name, plan, status, last_payment_amount, start_date, created_at) 
                 VALUES ($1, $2, $3, $4, CURRENT_DATE, NOW())
                 RETURNING id, name, plan, status`,
                [member.name, member.plan, member.status, member.payment]
            );
            console.log(`   ✅ ${result.rows[0].name} - Plan: ${result.rows[0].plan}`);
            insertedCount++;
        }

        console.log(`\n✅ Se insertaron ${insertedCount} miembros\n`);

        // Usuarios de prueba
        const users = [
            { email: 'carlos@fitgenius.com', username: 'carlos_m' },
            { email: 'maria@fitgenius.com', username: 'maria_g' },
            { email: 'juan@fitgenius.com', username: 'juan_l' },
            { email: 'sofia@fitgenius.com', username: 'sofia_r' },
            { email: 'admin@fitgenius.com', username: 'admin' }
        ];

        console.log('👤 Guardando 5 usuarios de prueba...');
        let userCount = 0;
        for (const user of users) {
            try {
                const result = await pool.query(
                    `INSERT INTO users (email, username, password, created_at) 
                     VALUES ($1, $2, $3, NOW())
                     RETURNING id, email, username`,
                    [user.email, user.username, 'hashed_password_123']
                );
                console.log(`   ✅ ${result.rows[0].email} (${result.rows[0].username})`);
                userCount++;
            } catch (err) {
                if (err.code === '23505') {
                    console.log(`   ℹ️ ${user.email} ya existe`);
                } else {
                    throw err;
                }
            }
        }

        console.log(`\n✅ Se insertaron/verificaron ${userCount} usuarios\n`);

        // Obtener estadísticas
        console.log('📊 Estadísticas actuales:');
        const memberStats = await pool.query('SELECT COUNT(*) as count FROM gym_members');
        const userStats = await pool.query('SELECT COUNT(*) as count FROM users');
        
        console.log(`   Total miembros: ${memberStats.rows[0].count}`);
        console.log(`   Total usuarios: ${userStats.rows[0].count}`);

        // Mostrar últimos miembros
        console.log(`\n📋 Últimos miembros insertados:`);
        const recent = await pool.query(
            `SELECT name, plan, status, last_payment_amount, created_at 
             FROM gym_members 
             ORDER BY created_at DESC 
             LIMIT 5`
        );
        
        for (const row of recent.rows) {
            console.log(`   • ${row.name} (${row.plan}) - Estado: ${row.status}`);
        }

        console.log(`\n✨ DATOS DE PRUEBA GUARDADOS EN NEON`);
        console.log(`🔍 Verifica en: https://console.neon.tech`);
        console.log(`📝 Query: SELECT * FROM gym_members;\n`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

insertTestData();
