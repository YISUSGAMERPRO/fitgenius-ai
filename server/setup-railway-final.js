const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupRailwayDatabase() {
    console.log('🚀 Configurando base de datos en Railway...\n');
    
    // Usa la URL pública correcta de Railway
    const MYSQL_URL = 'mysql://root:RyfUFsHvrSJwQmnIJFNBEwlMpSRduxJR@nozomi.proxy.rlwy.net:38903/railway';

    console.log('⏳ Conectando a Railway MySQL...');

    try {
        // Conectar a la base de datos
        const connection = await mysql.createConnection(MYSQL_URL);

        console.log('✅ Conectado a Railway MySQL\n');

        // Leer el archivo SQL
        const sqlFile = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
        
        // Remover líneas de CREATE DATABASE y USE que no funcionan en Railway
        const cleanedSQL = sqlFile
            .split('\n')
            .filter(line => !line.trim().startsWith('CREATE DATABASE') && !line.trim().startsWith('USE '))
            .join('\n');
        
        // Dividir por ; y ejecutar cada sentencia
        const statements = cleanedSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        console.log('📝 Ejecutando script SQL...');
        console.log(`   Total de sentencias: ${statements.length}\n`);

        // Ejecutar cada sentencia individualmente
        for (let i = 0; i < statements.length; i++) {
            try {
                await connection.query(statements[i]);
                console.log(`   ✅ Sentencia ${i + 1}/${statements.length} ejecutada`);
            } catch (err) {
                console.error(`   ❌ Error en sentencia ${i + 1}: ${err.message}`);
                throw err;
            }
        }

        console.log('✅ ¡Base de datos configurada exitosamente!\n');
        console.log('📊 Tablas creadas:');
        console.log('   - users');
        console.log('   - user_profiles');
        console.log('   - gym_members');
        console.log('   - gym_equipment');
        console.log('   - gym_expenses');
        console.log('\n👤 Usuario de prueba creado:');
        console.log('   Usuario: admin');
        console.log('   Contraseña: admin123');

        await connection.end();
        console.log('\n✨ ¡Todo listo para usar Railway!');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\n💡 Verifica que:');
        console.log('   1. Las credenciales sean correctas');
        console.log('   2. El servicio MySQL esté activo en Railway');
        console.log('   3. Tengas conexión a internet');
    }
}

setupRailwayDatabase();
