-- ===== SCRIPT DE INICIALIZACIÓN COMPLETO PARA NEON (PostgreSQL) =====
-- Ejecuta este script en la consola SQL de Neon Database
-- URL: https://console.neon.tech

-- 1. Crear o actualizar tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    age INTEGER NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    body_type VARCHAR(50),
    goal VARCHAR(100) NOT NULL,
    activity_level VARCHAR(50) NOT NULL,
    equipment JSONB,
    injuries TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 3. Crear tabla de planes de entrenamiento
CREATE TABLE IF NOT EXISTS workout_plans (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(100),
    estimated_duration VARCHAR(100),
    difficulty VARCHAR(50),
    duration_weeks INTEGER,
    plan_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_created ON workout_plans(created_at);

-- 4. Crear tabla de planes de dieta
CREATE TABLE IF NOT EXISTS diet_plans (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_calories_per_day INTEGER,
    plan_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_created ON diet_plans(created_at);

-- 5. Crear tabla de miembros del gimnasio
CREATE TABLE IF NOT EXISTS gym_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    plan VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    payment_amount DECIMAL(10,2),
    last_payment_date DATE,
    last_payment_amount DECIMAL(10,2),
    subscription_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gym_members_status ON gym_members(status);

-- 6. Crear tabla de equipos del gimnasio
CREATE TABLE IF NOT EXISTS gym_equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'operational',
    purchase_date DATE,
    last_maintenance DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Crear tabla de gastos del gimnasio
CREATE TABLE IF NOT EXISTS gym_expenses (
    id SERIAL PRIMARY KEY,
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Verificar que todas las tablas se crearon correctamente
SELECT 
    'users' as tabla, 
    COUNT(*) as registros 
FROM users
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'workout_plans', COUNT(*) FROM workout_plans
UNION ALL
SELECT 'diet_plans', COUNT(*) FROM diet_plans
UNION ALL
SELECT 'gym_members', COUNT(*) FROM gym_members
UNION ALL
SELECT 'gym_equipment', COUNT(*) FROM gym_equipment
UNION ALL
SELECT 'gym_expenses', COUNT(*) FROM gym_expenses;

-- ✅ Base de datos lista para producción
