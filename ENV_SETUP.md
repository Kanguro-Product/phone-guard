# 🔐 CONFIGURACIÓN DE VARIABLES DE ENTORNO PARA HIYA SCRAPING

## Variables a añadir en Vercel Dashboard

Ve a tu proyecto en Vercel → Settings → Environment Variables y añade:

### 1. Browserless
```
BROWSERLESS_URL=wss://chrome.browserless.io?token=TU_TOKEN_AQUI
```
**Cómo obtener el token:**
1. Regístrate en https://www.browserless.io/
2. Plan Free: 6 horas/mes gratis
3. Copia tu token del dashboard
4. Pega en la URL como query param: `?token=XXX`

### 2. Credenciales Hiya
```
HIYA_EMAIL=tu_email@ejemplo.com
HIYA_PASSWORD=tu_contraseña_hiya
```

### 3. URLs de Hiya (opcionales, ya tienen defaults)
```
HIYA_LOGIN_URL=https://www.hiya.com/login
HIYA_TRACKED_URL=https://dashboard.hiya.com/tracked
```

### 4. Límites de scraping
```
MAX_PER_RUN=200
RATE_LIMIT_MINUTES=5
```

### 5. Supabase (ya deberías tenerlas)
```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## ⚠️ IMPORTANTE
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en backend (API routes)
- Nunca pongas `NEXT_PUBLIC_` en credenciales sensibles (Hiya, Browserless)
- Todas estas vars deben estar en "Production", "Preview" y "Development" environments en Vercel

## Para desarrollo local
Crea `.env.local` (ya está en .gitignore) y copia las mismas variables.

