# N8N Webhook Troubleshooting Guide

## Error: "N8N webhook not found (404)"

Este error indica que la URL del webhook no existe o no está activa en N8N.

### 🔍 Diagnóstico del Problema

#### **1. Verificar URL del Webhook**
La URL debe tener este formato:
```
https://n8n.test.kanguro.com/webhook/ab-test-call
```

**❌ URLs Incorrectas:**
- `https://n8n.test.kanguro.com/workflow/SaU99fUufXsmTQ1n` (es un workflow, no un webhook)
- `https://n8n.test.kanguro.com/` (falta el path del webhook)

**✅ URL Correcta:**
- `https://n8n.test.kanguro.com/webhook/ab-test-call`

#### **2. Verificar en N8N Dashboard**

1. **Ve a tu N8N Dashboard**
2. **Busca el workflow** `SaU99fUufXsmTQ1n`
3. **Verifica que esté ACTIVO** (toggle verde)
4. **Busca el nodo "Webhook"** en el workflow
5. **Copia la URL del webhook** (no la del workflow)

#### **3. Configurar Webhook en N8N**

Si no tienes el webhook configurado:

1. **Abre el workflow** en N8N
2. **Agrega un nodo "Webhook"**
3. **Configura el webhook:**
   - **HTTP Method**: POST
   - **Path**: `/ab-test-call`
   - **Response Mode**: "Respond to Webhook"
4. **Activa el workflow**
5. **Copia la URL del webhook**

### 🛠️ Soluciones Paso a Paso

#### **Solución 1: Usar URL del Webhook Correcta**

1. **Ve a N8N Dashboard**
2. **Abre el workflow** `SaU99fUufXsmTQ1n`
3. **Busca el nodo Webhook**
4. **Copia la URL del webhook** (debe terminar en `/webhook/...`)
5. **Pega la URL correcta** en Phone Guard

#### **Solución 2: Crear Webhook si No Existe**

1. **En N8N, abre el workflow**
2. **Agrega un nodo "Webhook"**
3. **Configura:**
   ```
   HTTP Method: POST
   Path: ab-test-call
   Response Mode: Respond to Webhook
   ```
4. **Conecta el webhook** al resto del workflow
5. **Activa el workflow**
6. **Copia la URL del webhook**

#### **Solución 3: Verificar que el Workflow Esté Activo**

1. **En N8N Dashboard**
2. **Busca el workflow** `SaU99fUufXsmTQ1n`
3. **Verifica que el toggle esté ENCENDIDO** (verde)
4. **Si está apagado, actívalo**

### 📋 Checklist de Verificación

- [ ] URL termina en `/webhook/...` (no `/workflow/...`)
- [ ] Workflow está ACTIVO en N8N
- [ ] Nodo Webhook está configurado correctamente
- [ ] Webhook responde a POST requests
- [ ] N8N instance está funcionando
- [ ] No hay errores en los logs de N8N

### 🔧 URLs Comunes

#### **Para Workflow:**
```
https://n8n.test.kanguro.com/workflow/SaU99fUufXsmTQ1n
```

#### **Para Webhook (lo que necesitas):**
```
https://n8n.test.kanguro.com/webhook/ab-test-call
```

### 🚨 Errores Comunes

#### **Error 404 - Not Found**
- **Causa**: URL incorrecta o webhook no existe
- **Solución**: Usar URL del webhook, no del workflow

#### **Error 401 - Unauthorized**
- **Causa**: Webhook requiere autenticación
- **Solución**: Configurar webhook sin autenticación

#### **Error 500 - Internal Server Error**
- **Causa**: Error en el workflow de N8N
- **Solución**: Revisar logs de N8N y configuración del workflow

### 📞 Soporte

Si el problema persiste:

1. **Revisa los logs de N8N**
2. **Verifica que el workflow esté funcionando**
3. **Prueba el webhook manualmente** con Postman/curl
4. **Contacta al administrador de N8N**

### 🧪 Test Manual del Webhook

Puedes probar el webhook manualmente:

```bash
curl -X POST "https://n8n.test.kanguro.com/webhook/ab-test-call" \
  -H "Content-Type: application/json" \
  -d '{
    "test": true,
    "destinationNumber": "34661216995",
    "derivationId": "test-derivation-001",
    "originNumber": "34604579589",
    "group": "A"
  }'
```

**Respuesta esperada**: Status 200 con respuesta del workflow
