#!/usr/bin/env node

/**
 * Script para verificar y reparar la estructura de la base de datos
 * Ejecutar en Railway:
 * node verify-db-schema.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const mysql = require('mysql2');

console.log('🔍 Verificando estructura de la base de datos...\n');

// Detectar si es PostgreSQL o MySQL
const isPg = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
const isMysql = process.env.MYSQL_URL || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('mysql'));

if (isPg) {
    console.log('📊 Detectado: PostgreSQL');
    verifyPostgres();
} else if (isMysql) {
    console.log('📊 Detectado: MySQL');
    verifyMysql();
} else {
    console.error('❌ No se detectó base de datos. Asegurate de que DATABASE_URL o MYSQL_URL estén configuradas.');
    process.exit(1);
}

function verifyPostgres() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    (async () => {
        try {
            // Verificar tabla user_profiles
            const res = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'user_profiles'
                ORDER BY ordinal_position
            `);

            console.log('\n✅ Tabla user_profiles existe. Columnas encontradas:\n');
            res.rows.forEach(col => {
                const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
                console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}`);
            });

            // Verificar que 'name' existe y no es nullable
            const nameCol = res.rows.find(col => col.column_name === 'name');
            if (!nameCol) {
                console.error('\n❌ Columna "name" NO existe. Agregándola...');
                await pool.query(`
                    ALTER TABLE user_profiles
                    ADD COLUMN name VARCHAR(100) NOT NULL DEFAULT 'Usuario'
                `);
                console.log('✅ Columna "name" agregada correctamente.');
            } else if (nameCol.is_nullable === 'YES') {
                console.warn('\n⚠️  Columna "name" es nullable. Haciendo NOT NULL...');
                await pool.query(`
                    ALTER TABLE user_profiles
                    ALTER COLUMN name SET NOT NULL,
                    ALTER COLUMN name SET DEFAULT 'Usuario'
                `);
                console.log('✅ Columna "name" actualizada a NOT NULL.');
            }

            console.log('\n✅ Base de datos verificada correctamente.');
            process.exit(0);
        } catch (err) {
            console.error('\n❌ Error:', err.message);
            process.exit(1);
        } finally {
            await pool.end();
        }
    })();
}

function verifyMysql() {
    const connection = mysql.createConnection(process.env.MYSQL_URL || {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    connection.connect((err) => {
        if (err) {
            console.error('❌ Error de conexión:', err.message);
            process.exit(1);
        }

        // Verificar tabla user_profiles
        connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles'
            ORDER BY ORDINAL_POSITION
        `, (err, results) => {
            if (err) {
                console.error('❌ Error:', err.message);
                connection.end();
                process.exit(1);
            }

            console.log('\n✅ Tabla user_profiles existe. Columnas encontradas:\n');
            results.forEach(col => {
                const nullable = col.IS_NULLABLE === 'YES' ? '(nullable)' : '(NOT NULL)';
                console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${nullable}`);
            });

            // Verificar que 'name' existe
            const nameCol = results.find(col => col.COLUMN_NAME === 'name');
            if (!nameCol) {
                console.error('\n❌ Columna "name" NO existe. Agregándola...');
                connection.query(`
                    ALTER TABLE user_profiles
                    ADD COLUMN name VARCHAR(100) NOT NULL DEFAULT 'Usuario'
                `, (err) => {
                    if (err) {
                        console.error('❌ Error al agregar columna:', err.message);
                    } else {
                        console.log('✅ Columna "name" agregada correctamente.');
                    }
                    connection.end();
                    process.exit(err ? 1 : 0);
                });
            } else if (nameCol.IS_NULLABLE === 'YES') {
                console.warn('\n⚠️  Columna "name" es nullable. Haciendo NOT NULL...');
                connection.query(`
                    ALTER TABLE user_profiles
                    MODIFY name VARCHAR(100) NOT NULL DEFAULT 'Usuario'
                `, (err) => {
                    if (err) {
                        console.error('❌ Error al modificar columna:', err.message);
                    } else {
                        console.log('✅ Columna "name" actualizada a NOT NULL.');
                    }
                    connection.end();
                    process.exit(err ? 1 : 0);
                });
            } else {
                console.log('\n✅ Base de datos verificada correctamente.');
                connection.end();
                process.exit(0);
            }
        });
    });
}
