-- ========================================
-- SCRIPT PARA VERIFICAR DATOS DE ENRIQUECIMIENTO
-- Copia y pega este script completo en Supabase SQL Editor
-- ========================================

-- 1. Ver resumen de cuántos números tienen datos
SELECT 
  COUNT(*) as total_numeros,
  COUNT(numverify_score) as tienen_numverify_score,
  COUNT(openai_score) as tienen_openai_score,
  COUNT(carrier) as tienen_carrier,
  COUNT(line_type) as tienen_line_type,
  COUNT(location) as tienen_location,
  COUNT(country_code) as tienen_country_code,
  COUNT(spam_reports) as tienen_spam_reports
FROM phone_numbers;

-- 2. Ver números SIN datos de enriquecimiento
SELECT 
  number,
  provider,
  status,
  numverify_score,
  openai_score,
  carrier,
  line_type,
  location,
  country_code,
  last_checked,
  created_at
FROM phone_numbers
WHERE carrier IS NULL 
   OR line_type IS NULL 
   OR numverify_score IS NULL
ORDER BY created_at DESC;

-- 3. Ver números CON datos de enriquecimiento (para verificar que funciona)
SELECT 
  number,
  provider,
  numverify_score,
  openai_score,
  carrier,
  line_type,
  location,
  country_code,
  country_name,
  spam_reports,
  last_checked
FROM phone_numbers
WHERE carrier IS NOT NULL 
  AND line_type IS NOT NULL
ORDER BY last_checked DESC
LIMIT 10;

