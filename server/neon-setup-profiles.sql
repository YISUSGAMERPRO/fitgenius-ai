-- SCRIPT PARA CREAR TABLA user_profiles EN NEON (PostgreSQL)
-- Ejecuta esto en la consola SQL de Neon

-- Crear tabla de perfiles de usuario si no existe
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

-- Crear índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Verificar que la tabla se creó correctamente
SELECT 'user_profiles' as tabla, COUNT(*) as registros FROM user_profiles;
