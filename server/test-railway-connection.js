const mysql = require('mysql2/promise');

async function testConnection() {
    const urls = [
        'mysql://root:RyfUFsHvrSJwQmnIJFNBEwlMpSRduxJR@nozomi.proxy.rlwy.net:38903/railway',
    ];
    
    for (let url of urls) {
        try {
            console.log(`\n🔍 Intentando: ${url.split('@')[0]}@...`);
            const connection = await mysql.createConnection(url);
            console.log('✅ ¡Conexión exitosa!');
            await connection.end();
            return url;
        } catch (err) {
            console.log(`❌ Error: ${err.code} - ${err.message}`);
        }
    }
}

testConnection();
