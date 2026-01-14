-- ========================================
-- SCRIPT DE INICIALIZACIÓN - NEON POSTGRESQL
-- ========================================
-- Ejecuta esto en tu consola de Neon para crear las tablas

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    username VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255),
    age INT,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    gender VARCHAR(20),
    goal VARCHAR(255),
    activity_level VARCHAR(100),
    body_type VARCHAR(100),
    equipment TEXT,
    injuries TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de miembros del gimnasio
CREATE TABLE IF NOT EXISTS gym_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Activo',
    last_payment_date DATE,
    last_payment_amount DECIMAL(10,2),
    subscription_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de planes de entrenamiento
CREATE TABLE IF NOT EXISTS workout_plans (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255),
    plan_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de planes de dieta
CREATE TABLE IF NOT EXISTS diet_plans (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255),
    plan_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Verificar que todo se creó correctamente
SELECT 
    tablename 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND (tablename LIKE '%user%' OR tablename LIKE '%gym%' OR tablename LIKE '%workout%' OR tablename LIKE '%diet%')
ORDER BY 
    tablename;
