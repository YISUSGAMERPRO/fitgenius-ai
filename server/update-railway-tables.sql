-- Script para actualizar Railway con las nuevas tablas de rutinas y dietas
-- Ejecuta este script en Railway después de actualizar las variables de entorno

USE railway;

-- Tabla de planes de entrenamiento generados
CREATE TABLE IF NOT EXISTS workout_plans (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(100),
    estimated_duration VARCHAR(100),
    difficulty VARCHAR(50),
    duration_weeks INT,
    plan_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_workout (user_id),
    INDEX idx_created (created_at)
);

-- Tabla de planes de dieta generados
CREATE TABLE IF NOT EXISTS diet_plans (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_calories_per_day INT,
    plan_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_diet (user_id),
    INDEX idx_created_diet (created_at)
);

-- Verificar que se crearon las tablas
SHOW TABLES;
