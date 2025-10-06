-- Script para verificar qué números tienen datos de enriquecimiento

-- Ver cuántos números tienen datos de cada campo
SELECT 
  COUNT(*) as total_numbers,
  COUNT(numverify_score) as have_numverify_score,
  COUNT(openai_score) as have_openai_score,
  COUNT(carrier) as have_carrier,
  COUNT(line_type) as have_line_type,
  COUNT(location) as have_location,
  COUNT(country_code) as have_country_code
FROM phone_numbers;

-- Ver algunos ejemplos de números con y sin datos
SELECT 
  number,
  numverify_score,
  openai_score,
  carrier,
  line_type,
  location,
  country_code,
  country_name,
  last_checked
FROM phone_numbers
ORDER BY created_at DESC
LIMIT 10;

