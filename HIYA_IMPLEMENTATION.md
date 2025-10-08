# 🚀 IMPLEMENTACIÓN HIYA SCRAPING - RESUMEN COMPLETO

## ✅ Estado de Implementación

**TODO IMPLEMENTADO Y LISTO PARA USAR**

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
1. ✅ `scripts/044_create_hiya_scraping_tables.sql` - Esquema de base de datos
2. ✅ `app/api/hiya-scrape/route.ts` - API route principal
3. ✅ `components/hiya-scrape-button.tsx` - Componente de UI
4. ✅ `ENV_SETUP.md` - Documentación de variables de entorno
5. ✅ `HIYA_SELECTOR_GUIDE.md` - Guía para ajustar selectores
6. ✅ `HIYA_IMPLEMENTATION.md` - Este archivo

### Archivos Modificados
1. ✅ `components/admin-page-client.tsx` - Integración en panel de admin
2. ✅ `package.json` - Añadido `puppeteer-core`

## 🔧 Pasos para Configurar

### 1. Base de Datos (Supabase)

**Ejecuta este SQL en Supabase SQL Editor:**

```sql
-- Copia y pega todo el contenido de:
scripts/044_create_hiya_scraping_tables.sql
```

**Esto creará:**
- Tabla `hiya_numbers` (almacena números scrapeados)
- Tabla `hiya_runs` (log de ejecuciones + rate limiting)
- Función `get_last_hiya_scrape()` (obtener info de última ejecución)
- Políticas RLS (seguridad)
- Índices para performance

### 2. Browserless (Servicio de Navegador Remoto)

**Regístrate y obtén tu token:**

1. Ve a https://www.browserless.io/
2. Crea una cuenta (plan FREE: 6 horas/mes)
3. Ve al dashboard y copia tu token
4. Tu URL será: `wss://chrome.browserless.io?token=TU_TOKEN_AQUI`

### 3. Variables de Entorno en Vercel

**Ve a tu proyecto en Vercel → Settings → Environment Variables**

Añade estas variables en **Production**, **Preview** y **Development**:

```env
# Browserless
BROWSERLESS_URL=wss://chrome.browserless.io?token=TU_TOKEN_AQUI

# Credenciales Hiya
HIYA_EMAIL=tu_email@ejemplo.com
HIYA_PASSWORD=tu_contraseña

# URLs Hiya (opcional, ya tienen defaults)
HIYA_LOGIN_URL=https://www.hiya.com/login
HIYA_TRACKED_URL=https://dashboard.hiya.com/tracked

# Límites
MAX_PER_RUN=200
RATE_LIMIT_MINUTES=5

# Supabase (ya deberías tenerlas)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. Deploy

**Opción A: Automático (si tienes Git)**
```bash
git add .
git commit -m "feat: Hiya scraping implementation"
git push origin main
```
Vercel hará deploy automático.

**Opción B: Manual**
1. Ve a Vercel Dashboard
2. Click en tu proyecto
3. Click en "Deployments"
4. Click en "Deploy" (tres puntos) → "Redeploy"

### 5. Primera Prueba

1. **Ve a tu app**: `https://tu-app.vercel.app/admin`
2. **Haz login** como admin
3. **Click en pestaña "Hiya Scraping"**
4. **Click en botón "Preview"**
5. **Espera 5-10 segundos**
6. **Revisa el resultado**:
   - ✅ Si ves datos correctos → ¡Los selectores funcionan!
   - ❌ Si ves campos vacíos → Sigue la guía `HIYA_SELECTOR_GUIDE.md`

### 6. Primera Ejecución Real

1. **Click en "Refrescar Datos de Hiya"**
2. **Espera** (puede tardar 10-30 segundos dependiendo de cuántos números tengas)
3. **Verifica el resultado**:
   - Mensaje de éxito: "Se actualizaron X de Y números"
   - Si hay errores, revisa los logs de Vercel

### 7. Verificar en Supabase

1. Ve a Supabase → Table Editor
2. Abre tabla `hiya_numbers`
3. Deberías ver filas con:
   - `phone`: Números de teléfono
   - `is_spam`: true/false
   - `label`: Labels de Hiya
   - `score`: Scores de Hiya
   - `checked_at`: Fecha/hora actual

## 🎯 Funcionalidades Implementadas

### ✅ Rate Limiting
- Solo 1 ejecución cada 5 minutos (configurable)
- Muestra mensaje con tiempo restante si intentas ejecutar antes

### ✅ Modo Preview
- Click en "Preview" para ver solo la primera fila
- No escribe en base de datos
- Útil para ajustar selectores sin side effects

### ✅ Paginación Automática
- Si Hiya tiene múltiples páginas, las recorre automáticamente
- Respeta el límite de MAX_PER_RUN (200 filas por defecto)
- Detecta cuando no hay más páginas

### ✅ Detección de SPAM
- Busca keywords: spam, scam, fraud, robocall, telemarketer, suspicious, blocked, reported
- Marca `is_spam = true` si encuentra alguna
- Puedes añadir más keywords en `SPAM_KEYWORDS` array

### ✅ Logging y Auditoría
- Cada ejecución se registra en `hiya_runs`
- Guarda: timestamp, filas procesadas, éxito/error, duración, user_id
- Útil para debugging y monitoreo

### ✅ Estadísticas en UI
- Muestra total de números
- Muestra cantidad de spam detectado
- Muestra última actualización con tiempo relativo
- Muestra estado de éxito/error

### ✅ Manejo de Errores
- Login fallido → mensaje claro
- Browserless no disponible → mensaje claro
- Timeout → mensaje claro
- Rate limit → mensaje con tiempo restante
- Errores de red → mensaje de conexión

## 🔒 Seguridad

### ✅ Implementado
- ✅ Credenciales solo en backend (no expuestas al cliente)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` solo en API routes
- ✅ RLS policies en Supabase
- ✅ Variables de entorno en Vercel (no en código)
- ✅ No se loguean credenciales sensibles
- ✅ Rate limiting para evitar abuso

### ⚠️ Consideraciones
- Si Hiya tiene MFA/2FA activado, el login fallará
- Si Hiya tiene CAPTCHA, necesitarás resolverlo manualmente o usar servicio
- Las credenciales se envían al navegador remoto (Browserless es de confianza)

## 📊 Límites y Restricciones

### Vercel
- **Timeout**: 10s (Hobby) / 60s (Pro)
- **Memoria**: 1GB (Hobby) / 3GB (Pro)
- **WebSocket**: Permitido (conexión saliente a Browserless)

### Browserless (Free Plan)
- **6 horas/mes** de tiempo de navegador
- **1 sesión concurrente**
- Si se acaba, upgrade o espera al siguiente mes

### Tu Configuración
- **MAX_PER_RUN**: 200 filas por ejecución
- **RATE_LIMIT_MINUTES**: 5 minutos entre ejecuciones
- Puedes ajustar estas variables en Vercel

## 🐛 Troubleshooting

### Problema: "Failed to connect to Browserless"
**Solución**: Verifica que `BROWSERLESS_URL` sea correcta y tu cuenta Browserless esté activa.

### Problema: "Login failed"
**Soluciones**:
1. Verifica `HIYA_EMAIL` y `HIYA_PASSWORD`
2. Inicia sesión manualmente en Hiya para verificar credenciales
3. Si hay MFA, desactívalo temporalmente
4. Si hay CAPTCHA, no podemos scraping sin resolverlo

### Problema: "No se encontraron filas"
**Solución**: Ajusta selectores CSS siguiendo `HIYA_SELECTOR_GUIDE.md`

### Problema: "Rate limit exceeded"
**Solución**: Espera el tiempo indicado (5 minutos por defecto) o cambia `RATE_LIMIT_MINUTES` en Vercel

### Problema: "Timeout" en Vercel
**Solución**: Reduce `MAX_PER_RUN` a un número menor (ej: 100) o upgrade a Vercel Pro

### Problema: Datos incorrectos en BD
**Solución**: Usa Preview mode para ver qué se está extrayendo y ajusta selectores

## 📈 Optimizaciones Futuras (Opcional)

### No Implementado (pero fácil de añadir):
1. **Webhook de notificación**: Enviar email/Slack cuando termina scraping
2. **Scraping automático**: Cron job que ejecute cada X horas
3. **Múltiples cuentas**: Soporte para scraping de varias cuentas Hiya
4. **Exportación**: Botón para descargar CSV de `hiya_numbers`
5. **Comparación**: Mostrar diff entre ejecuciones (números nuevos, cambiados, eliminados)
6. **Alertas**: Notificar cuando un número pasa de OK a SPAM
7. **Integración**: Conectar con `phone_numbers` para cross-reference

## 🎓 Cómo Funciona (Técnico)

### Flujo Completo:
```
1. User click "Refrescar Datos" en /admin
   ↓
2. POST /api/hiya-scrape
   ↓
3. Check rate limit en hiya_runs
   ↓
4. Conecta a Browserless (WebSocket)
   ↓
5. Navega a Hiya login page
   ↓
6. Fill email + password + submit
   ↓
7. Navega a tracked numbers page
   ↓
8. Extrae filas de la tabla (con selectores CSS)
   ↓
9. Para cada fila:
   - Extrae: phone, label, score, last_seen
   - Determina is_spam (busca keywords)
   - Guarda en array
   ↓
10. Si hay paginación, siguiente página → repetir paso 9
    (hasta MAX_PER_RUN o sin más páginas)
   ↓
11. Upsert en hiya_numbers (insert o update si existe)
   ↓
12. Insert en hiya_runs (log de ejecución)
   ↓
13. Cierra navegador
   ↓
14. Devuelve JSON { ok: true, checked: N }
   ↓
15. UI muestra "¡Éxito! Se actualizaron N números"
```

### Tecnologías Usadas:
- **Next.js 14 App Router** → API routes
- **Puppeteer Core** → Control del navegador (sin descarga de Chrome)
- **Browserless** → Navegador remoto en la nube (WebSocket)
- **Supabase** → Base de datos PostgreSQL
- **Vercel** → Hosting serverless
- **TypeScript** → Type safety

## ✅ Checklist Final

Antes de usar en producción, verifica:

- [ ] SQL ejecutado en Supabase (tablas creadas)
- [ ] Variables de entorno configuradas en Vercel
- [ ] `puppeteer-core` instalado (`pnpm install`)
- [ ] Deploy exitoso en Vercel
- [ ] Preview mode funciona y muestra datos
- [ ] Selectores CSS ajustados (si fue necesario)
- [ ] Primera ejecución completa exitosa
- [ ] Datos verificados en Supabase
- [ ] Rate limiting funciona
- [ ] Estadísticas se muestran en UI

## 🎉 ¡Listo!

Si todos los checkboxes están marcados, **tu sistema de scraping Hiya está 100% funcional**.

Puedes:
- ✅ Scraping bajo demanda desde admin panel
- ✅ Ver estadísticas en tiempo real
- ✅ Almacenar hasta 200 números por ejecución
- ✅ Rate limiting automático
- ✅ Logs completos para auditoría
- ✅ Detección automática de spam
- ✅ Sin Docker, sin servidores propios

---

**Contacto**: Si tienes problemas, revisa primero:
1. Logs de Vercel (Functions → /api/hiya-scrape)
2. Supabase logs (Database → Logs)
3. Browserless dashboard (usage stats)
4. `HIYA_SELECTOR_GUIDE.md` (para problemas de selectores)

