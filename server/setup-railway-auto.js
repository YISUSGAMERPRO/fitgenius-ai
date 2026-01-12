const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupRailwayDatabase() {
    console.log('🚀 Configurando base de datos en Railway...\n');
    
    // Credenciales de Railway
    const config = {
        host: 'turntable.proxy.rlwy.net',
        port: 29961,
        user: 'root',
        password: 'ssSjLVRpbLgnKIRrnLLQVBoHaPQBcebf',
        database: 'railway',
        multipleStatements: true
    };

    console.log('⏳ Conectando a Railway MySQL...');

    try {
        // Conectar a la base de datos
        const connection = await mysql.createConnection(config);

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
        console.log('\n✨ ¡Todo listo! Ahora puedes continuar con el despliegue del backend.');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\n💡 Verifica que:');
        console.log('   1. Las credenciales sean correctas');
        console.log('   2. El servicio MySQL esté activo en Railway');
        console.log('   3. Tengas conexión a internet');
    }
}

setupRailwayDatabase();
