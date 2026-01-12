-- EJECUTAR ESTE SCRIPT EN RAILWAY
-- Copia todo este contenido y pégalo en la pestaña Query/Data de Railway

CREATE DATABASE IF NOT EXISTS fitgenius_db;
USE fitgenius_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
);

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    body_type VARCHAR(50) NOT NULL,
    goal VARCHAR(100) NOT NULL,
    activity_level VARCHAR(50) NOT NULL,
    equipment JSON,
    injuries TEXT,
    is_cycle_tracking BOOLEAN DEFAULT FALSE,
    last_period_start DATE,
    cycle_length INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Tabla de miembros del gimnasio
CREATE TABLE IF NOT EXISTS gym_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    plan VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
    payment_amount DECIMAL(10,2),
    last_payment_date DATE,
    last_payment_amount DECIMAL(10,2),
    subscription_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
);

-- Tabla de equipos del gimnasio
CREATE TABLE IF NOT EXISTS gym_equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status ENUM('operational', 'maintenance', 'broken') DEFAULT 'operational',
    purchase_date DATE,
    last_maintenance DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de gastos del gimnasio
CREATE TABLE IF NOT EXISTS gym_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario de prueba (admin/admin123)
INSERT INTO users (id, username, password) VALUES 
('admin-001', 'admin', 'admin123')
ON DUPLICATE KEY UPDATE username=username;

-- Mensaje de éxito
SELECT '✅ Base de datos creada exitosamente!' as resultado;
