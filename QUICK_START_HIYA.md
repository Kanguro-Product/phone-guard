# ⚡ QUICK START - HIYA SCRAPING

## 🎯 ¿Qué se ha implementado?

✅ Sistema completo de scraping de Hiya sin Docker ni servidores propios
✅ Botón en panel de admin para refrescar datos
✅ Rate limiting (1 ejecución cada 5 minutos)
✅ Detección automática de spam
✅ Límite de 200 filas por ejecución
✅ Modo preview para ajustar selectores

## 📋 PASOS PARA ACTIVARLO (15 minutos)

### 1️⃣ SUPABASE (2 min)

1. Ve a Supabase → SQL Editor
2. Copia y pega todo el contenido de `scripts/044_create_hiya_scraping_tables.sql`
3. Click "Run"
4. Deberías ver: "✅ Hiya scraping tables created successfully!"

### 2️⃣ BROWSERLESS (3 min)

1. Ve a https://www.browserless.io/
2. Sign Up (gratis, 6 horas/mes)
3. Ve al dashboard y copia tu token
4. Guarda esta URL: `wss://chrome.browserless.io?token=TU_TOKEN_AQUI`

### 3️⃣ VERCEL ENVIRONMENT VARIABLES (5 min)

Ve a Vercel → Tu proyecto → Settings → Environment Variables

Añade estas 5 variables (en Production, Preview y Development):

```
BROWSERLESS_URL=wss://chrome.browserless.io?token=TU_TOKEN_AQUI
HIYA_EMAIL=tu_email@hiya.com
HIYA_PASSWORD=tu_contraseña
MAX_PER_RUN=200
RATE_LIMIT_MINUTES=5
```

### 4️⃣ DEPLOY (2 min)

**Opción A - Automático:**
```bash
git add .
git commit -m "feat: Hiya scraping"
git push
```

**Opción B - Manual:**
Vercel Dashboard → Deployments → Redeploy

### 5️⃣ PRIMERA PRUEBA (3 min)

1. Ve a `https://tu-app.vercel.app/admin`
2. Click pestaña "Hiya Scraping"
3. Click botón "Preview"
4. Espera 5-10 segundos
5. ¿Ves datos en el JSON?
   - ✅ SÍ → Click "Refrescar Datos de Hiya" para ejecución completa
   - ❌ NO → Sigue instrucciones en `HIYA_SELECTOR_GUIDE.md`

## ✅ LISTO!

Si todo funcionó:
- Verás "¡Éxito! Se actualizaron X números"
- En Supabase tabla `hiya_numbers` habrá datos
- Podrás ejecutar cada 5 minutos máximo

## 🐛 Si algo falla:

1. **"Failed to connect to Browserless"** → Verifica BROWSERLESS_URL
2. **"Login failed"** → Verifica HIYA_EMAIL y HIYA_PASSWORD
3. **"No se encontraron filas"** → Lee `HIYA_SELECTOR_GUIDE.md`
4. **"Rate limit"** → Espera 5 minutos

## 📚 Documentación Completa:

- `HIYA_IMPLEMENTATION.md` → Explicación técnica completa
- `HIYA_SELECTOR_GUIDE.md` → Cómo ajustar selectores CSS
- `ENV_SETUP.md` → Variables de entorno detalladas

---

**¿Dudas?** Revisa logs en Vercel → Functions → `/api/hiya-scrape`

