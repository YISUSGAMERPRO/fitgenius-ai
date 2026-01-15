-- Eliminar datos del usuario jesus2003camzav@gmail.com
-- Se eliminan en orden inverso de dependencias (FK)

-- 1. Eliminar planes de entrenamiento
DELETE FROM workout_plans 
WHERE user_id IN (SELECT id FROM users WHERE email = 'jesus2003camzav@gmail.com');

-- 2. Eliminar planes de dieta
DELETE FROM diet_plans 
WHERE user_id IN (SELECT id FROM users WHERE email = 'jesus2003camzav@gmail.com');

-- 3. Eliminar perfil de usuario
DELETE FROM user_profiles 
WHERE user_id IN (SELECT id FROM users WHERE email = 'jesus2003camzav@gmail.com');

-- 4. Eliminar usuario
DELETE FROM users 
WHERE email = 'jesus2003camzav@gmail.com';

-- Verificar que se eliminó
SELECT * FROM users WHERE email = 'jesus2003camzav@gmail.com';
