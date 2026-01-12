const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fitgenius_db'
});

db.connect(err => {
    if (err) {
        console.error('❌ Error conectando:', err);
        process.exit(1);
    }
    console.log('✅ Conectado a MySQL');

    // Crear tabla si no existe
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS gym_members (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            plan ENUM('Mensual', 'Anual', 'VIP', 'Visita') NOT NULL,
            status VARCHAR(20) DEFAULT 'Activo',
            last_payment_date DATE,
            last_payment_amount DECIMAL(10,2),
            subscription_end_date DATE
        )
    `;

    db.query(createTableSQL, (err) => {
        if (err) {
            console.error('❌ Error creando tabla:', err);
            process.exit(1);
        }
        console.log('✅ Tabla gym_members existe/fue creada');

        // Insertar registro de prueba
        const testMember = {
            id: '12345-test-001',
            name: 'Juan Pérez',
            plan: 'Mensual',
            status: 'Activo',
            last_payment_date: '2026-01-09',
            last_payment_amount: 50.00,
            subscription_end_date: '2026-02-09'
        };

        const insertSQL = `
            INSERT INTO gym_members 
            (id, name, plan, status, last_payment_date, last_payment_amount, subscription_end_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(insertSQL, [
            testMember.id,
            testMember.name,
            testMember.plan,
            testMember.status,
            testMember.last_payment_date,
            testMember.last_payment_amount,
            testMember.subscription_end_date
        ], (err, result) => {
            if (err) {
                console.error('❌ Error insertando:', err);
            } else {
                console.log('✅ Registro de prueba insertado:', testMember.id);
            }

            // Leer todos los registros
            db.query('SELECT * FROM gym_members', (err, results) => {
                if (err) {
                    console.error('❌ Error leyendo:', err);
                } else {
                    console.log('✅ Registros en BD:');
                    console.table(results);
                }
                db.end();
                process.exit(0);
            });
        });
    });
});
