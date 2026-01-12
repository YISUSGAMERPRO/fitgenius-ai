-- Script de inicialización de la base de datos para producción
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
);

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
