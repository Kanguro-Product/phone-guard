# 🎯 GUÍA PARA AJUSTAR SELECTORES DE HIYA

Esta guía te ayudará a ajustar los selectores CSS después de la primera ejecución del scraper.

## 📋 Paso 1: Ejecutar en Modo Preview

1. Ve al panel de admin: `/admin`
2. Haz clic en la pestaña "Hiya Scraping"
3. Haz clic en el botón "Preview"
4. Espera a que termine (unos segundos)
5. Verás un JSON con la primera fila extraída

## 🔍 Paso 2: Analizar el Resultado

El JSON del preview te mostrará algo como:

```json
{
  "phone": "+34612345678",
  "label": "Spam Risk",
  "score": "85",
  "last_seen": "2025-10-08",
  "is_spam": true,
  "raw": {
    "phone": "+34612345678",
    "label": "Spam Risk",
    "score": "85",
    "lastSeen": "2025-10-08",
    "rawHtml": "<tr>...</tr>"
  }
}
```

### ✅ Si ves datos correctos:
Los selectores están funcionando. ¡No necesitas cambiar nada!

### ❌ Si ves campos vacíos o incorrectos:
Necesitas ajustar los selectores CSS.

## 🛠️ Paso 3: Inspeccionar el HTML Real

1. **Abre Hiya en tu navegador** (manualmente)
2. Inicia sesión con tus credenciales
3. Ve a la página de "tracked numbers"
4. **Abre DevTools** (F12 o Click derecho → Inspeccionar)
5. **Localiza la tabla** de números
6. **Haz click derecho** en una fila → "Inspeccionar elemento"

Verás algo como:

```html
<table class="tracked-table">
  <thead>
    <tr>
      <th>Phone Number</th>
      <th>Label</th>
      <th>Score</th>
      <th>Last Seen</th>
    </tr>
  </thead>
  <tbody>
    <tr class="number-row">
      <td class="phone-cell">+34612345678</td>
      <td class="label-cell">Spam Risk</td>
      <td class="score-cell">85</td>
      <td class="date-cell">2025-10-08</td>
    </tr>
    <!-- más filas... -->
  </tbody>
</table>
```

## ✏️ Paso 4: Actualizar los Selectores

Abre el archivo: `app/api/hiya-scrape/route.ts`

Busca la sección `SELECTORS` (línea ~30):

```typescript
const SELECTORS = {
  // Login page selectors
  emailInput: 'input[type="email"], input[name="email"], #email',
  passwordInput: 'input[type="password"], input[name="password"], #password',
  loginButton: 'button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")',
  
  // Tracked numbers page selectors
  tableRows: 'table tbody tr, .table-row, [role="row"]',
  
  // Column selectors (AJUSTA ESTOS)
  phoneCell: 'td:nth-child(1), [data-column="phone"]',
  labelCell: 'td:nth-child(2), [data-column="label"]',
  scoreCell: 'td:nth-child(3), [data-column="score"]',
  lastSeenCell: 'td:nth-child(4), [data-column="last_seen"]',
  
  // Pagination
  nextPageButton: 'button:has-text("Next"), .pagination-next, [aria-label="Next page"]'
}
```

### Opciones de Selectores

#### Opción 1: Por clases CSS (más robusto)
Si las celdas tienen clases específicas:
```typescript
phoneCell: '.phone-cell, .number-cell',
labelCell: '.label-cell, .tag-cell',
scoreCell: '.score-cell, .rating-cell',
lastSeenCell: '.date-cell, .last-seen-cell',
```

#### Opción 2: Por atributos data (más semántico)
Si usan atributos `data-*`:
```typescript
phoneCell: '[data-column="phone"], [data-field="number"]',
labelCell: '[data-column="label"], [data-field="tag"]',
scoreCell: '[data-column="score"], [data-field="rating"]',
lastSeenCell: '[data-column="date"], [data-field="last_seen"]',
```

#### Opción 3: Por posición (menos robusto)
Si no tienen clases ni atributos:
```typescript
phoneCell: 'td:nth-child(1)',  // Primera columna
labelCell: 'td:nth-child(2)',  // Segunda columna
scoreCell: 'td:nth-child(3)',  // Tercera columna
lastSeenCell: 'td:nth-child(4)', // Cuarta columna
```

⚠️ **IMPORTANTE**: `nth-child(1)` es la primera columna, `nth-child(2)` la segunda, etc.

#### Opción 4: Múltiples selectores (failover)
Puedes usar múltiples selectores separados por coma (el primero que coincida se usará):
```typescript
phoneCell: '.phone-cell, td:nth-child(1), [data-column="phone"]',
```

## 🔄 Paso 5: Probar los Cambios

1. **Guarda el archivo** `app/api/hiya-scrape/route.ts`
2. **Redeploy en Vercel** (push a tu repo o manual deploy)
3. **Vuelve al panel de admin**
4. **Haz clic en "Preview"** de nuevo
5. **Verifica que los datos ahora se extraen correctamente**

## 🎯 Ejemplos Comunes

### Ejemplo 1: Hiya usa clases personalizadas
```typescript
tableRows: '.number-row, tr.tracked-number',
phoneCell: '.phone-number, .number-col',
labelCell: '.label-col, .tag-col',
scoreCell: '.score-col, .rating-col',
lastSeenCell: '.timestamp-col, .date-col',
```

### Ejemplo 2: Hiya usa tabla simple sin clases
```typescript
tableRows: 'table tbody tr',
phoneCell: 'td:nth-child(1)',
labelCell: 'td:nth-child(2)',
scoreCell: 'td:nth-child(3)',
lastSeenCell: 'td:nth-child(4)',
```

### Ejemplo 3: Hiya usa divs en vez de tabla
```typescript
tableRows: '.number-item, .tracked-number-row',
phoneCell: '.phone-field, [data-field="phone"]',
labelCell: '.label-field, [data-field="label"]',
scoreCell: '.score-field, [data-field="score"]',
lastSeenCell: '.date-field, [data-field="date"]',
```

## 🚨 Problemas Comunes

### Problema 1: "No se encontraron filas"
**Causa**: El selector `tableRows` es incorrecto.

**Solución**:
1. Inspecciona la tabla en DevTools
2. Encuentra el selector que envuelve cada fila
3. Actualiza `tableRows` con ese selector

### Problema 2: "Todos los campos vienen vacíos"
**Causa**: Los selectores de celdas son incorrectos.

**Solución**:
1. Inspecciona una celda específica (phone, label, etc.)
2. Copia su clase o atributo
3. Actualiza el selector correspondiente

### Problema 3: "El orden de columnas está mezclado"
**Causa**: Las columnas están en diferente orden del que esperamos.

**Solución**:
Cuenta el orden visual de las columnas (1, 2, 3, 4) y ajusta los `nth-child`:
```typescript
// Si el orden real es: Label | Phone | Score | Date
phoneCell: 'td:nth-child(2)',  // Phone es la segunda
labelCell: 'td:nth-child(1)',  // Label es la primera
scoreCell: 'td:nth-child(3)',  // Score es la tercera
lastSeenCell: 'td:nth-child(4)', // Date es la cuarta
```

### Problema 4: "Rate limit" incluso sin haber ejecutado antes
**Causa**: Se ejecutó hace menos de 5 minutos.

**Solución**:
Espera el tiempo indicado o ajusta `RATE_LIMIT_MINUTES` en las variables de entorno.

### Problema 5: "Login failed"
**Posibles causas**:
- Credenciales incorrectas
- Hiya tiene MFA/2FA activado
- Hiya tiene CAPTCHA

**Soluciones**:
1. Verifica `HIYA_EMAIL` y `HIYA_PASSWORD`
2. Si hay MFA: desactívalo temporalmente o usa un token de sesión
3. Si hay CAPTCHA: considera usar un servicio de resolución de CAPTCHA

## 📊 Paso 6: Verificar en Supabase

Después de una ejecución exitosa:

1. Ve a Supabase → Table Editor
2. Abre la tabla `hiya_numbers`
3. Verifica que los datos se hayan insertado correctamente:
   - `phone`: Debe tener el número completo
   - `is_spam`: true/false según las keywords
   - `label`: El texto del label de Hiya
   - `score`: El score numérico (si existe)
   - `checked_at`: La fecha/hora actual
   - `raw`: JSON con todos los datos extraídos

## 🎉 Éxito

Si ves:
- ✅ Filas insertadas en `hiya_numbers`
- ✅ Datos correctos en cada columna
- ✅ `is_spam` detectado correctamente
- ✅ `checked_at` actualizado

**¡Los selectores están correctos!** Ya puedes usar el scraper en producción.

## 💡 Tips Finales

1. **Usa múltiples selectores** separados por coma para mayor robustez
2. **Prefiere clases CSS** sobre `nth-child` (más estable si Hiya cambia el HTML)
3. **Documenta** cualquier cambio que hagas en los selectores
4. **Prueba con Preview** antes de una ejecución completa
5. **Revisa los logs** de Vercel si algo falla
6. **Guarda las credenciales** de forma segura (nunca en el código)

## 🔗 Recursos

- **Selectores CSS**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
- **Puppeteer Docs**: https://pptr.dev/
- **Browserless**: https://www.browserless.io/docs

---

Si tienes problemas, revisa los logs de Vercel:
1. Ve a tu proyecto en Vercel
2. Click en "Deployments"
3. Click en el deployment más reciente
4. Click en "Functions" → `/api/hiya-scrape`
5. Revisa los logs para ver qué selector está fallando

