const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function setupRailwayDatabase() {
    console.log('🚀 Configurando base de datos en Railway...\n');
    
    // Leer credenciales
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const ask = (question) => new Promise(resolve => readline.question(question, resolve));

    console.log('📋 Por favor, ingresa las credenciales de Railway MySQL:\n');
    
    const MYSQLHOST = await ask('MYSQLHOST (ej: monorail.proxy.rlwy.net): ');
    const MYSQLPORT = await ask('MYSQLPORT (ej: 12345): ');
    const MYSQLUSER = await ask('MYSQLUSER (ej: root): ');
    const MYSQLPASSWORD = await ask('MYSQLPASSWORD: ');
    const MYSQLDATABASE = await ask('MYSQLDATABASE (ej: railway): ');
    
    readline.close();

    console.log('\n⏳ Conectando a Railway...');

    try {
        // Conectar a la base de datos
        const connection = await mysql.createConnection({
            host: MYSQLHOST,
            port: MYSQLPORT,
            user: MYSQLUSER,
            password: MYSQLPASSWORD,
            database: MYSQLDATABASE,
            multipleStatements: true
        });

        console.log('✅ Conectado a Railway MySQL\n');

        // Leer el archivo SQL
        const sqlFile = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
        
        console.log('📝 Ejecutando script SQL...');

        // Ejecutar el SQL
        await connection.query(sqlFile);

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
        console.log('   2. Tu IP esté permitida en Railway');
        console.log('   3. El servicio MySQL esté activo');
    }
}

setupRailwayDatabase();
