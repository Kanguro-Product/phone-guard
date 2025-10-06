-- Script para establecer valores por defecto y verificar estructura de tabla

-- 1. Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'phone_numbers'
  AND column_name IN ('carrier', 'line_type', 'location', 'country_code', 'country_name', 'numverify_score', 'openai_score', 'spam_reports')
ORDER BY column_name;

-- 2. Actualizar spam_reports a 0 donde sea NULL
UPDATE phone_numbers
SET spam_reports = 0
WHERE spam_reports IS NULL;

-- 3. Verificar datos actuales de algunos números
SELECT 
  number,
  provider,
  numverify_score,
  openai_score,
  carrier,
  line_type,
  location,
  country_code,
  spam_reports,
  last_checked
FROM phone_numbers
LIMIT 5;

-- 4. Contar cuántos números tienen cada campo poblado
SELECT 
  COUNT(*) as total,
  COUNT(numverify_score) as con_numverify,
  COUNT(openai_score) as con_openai,
  COUNT(carrier) as con_carrier,
  COUNT(line_type) as con_line_type,
  COUNT(location) as con_location,
  SUM(CASE WHEN spam_reports > 0 THEN 1 ELSE 0 END) as con_spam_reports
FROM phone_numbers;

