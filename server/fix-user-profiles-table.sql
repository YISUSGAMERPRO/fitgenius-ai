-- Script para reparar la tabla user_profiles en Neon
-- Ejecuta en la consola de Neon: https://console.neon.tech

-- 1. Primero, ver la estructura actual
\d+ user_profiles

-- 2. Si la tabla tiene un campo 'name' NOT NULL que no necesitamos, eliminarlo:
ALTER TABLE user_profiles DROP COLUMN IF EXISTS name;

-- 3. O si necesitamos el campo 'name', hacerlo NULLABLE:
-- ALTER TABLE user_profiles ALTER COLUMN name DROP NOT NULL;

-- 4. Verificar que la tabla quedó correcta:
\d+ user_profiles

-- 5. Los campos correctos deben ser:
-- id, user_id, age, height, weight, gender, body_type, goal, activity_level, equipment, injuries, created_at, updated_at
