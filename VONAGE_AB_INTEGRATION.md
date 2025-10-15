# Vonage A/B Caller Integration

Guía completa para integrar el A/B Caller Tool con Vonage Voice API usando derivationId.

## 🎯 Objetivo

Permitir realizar tests A/B de llamadas telefónicas usando Vonage Voice API con derivationId, integrando con el sistema existente de Phone Guard.

## 📋 Requisitos

### Variables de Entorno
```bash
# Vonage Voice API
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_APPLICATION_ID=your_application_id
VONAGE_PRIVATE_KEY=your_private_key

# Webhook URL
VONAGE_WEBHOOK_URL=https://your-domain.com/api/webhooks/vonage/events
```

### Configuración en Vonage
1. **Application ID**: Configurar en Vonage Dashboard
2. **Webhook URL**: `https://your-domain.com/api/webhooks/vonage/events`
3. **Event Types**: `started`, `ringing`, `answered`, `completed`, `failed`

## 🔧 Configuración Paso a Paso

### 1. Configurar Derivation IDs

En la sección "Vonage Config" del A/B Caller Tool:

```json
{
  "groupA": {
    "derivationId": "mobile-derivation-001",
    "originNumber": "+34604579589",
    "strategy": "mobile-first"
  },
  "groupB": {
    "derivationId": "landline-derivation-002", 
    "originNumber": "+34604579589",
    "strategy": "landline-focused"
  }
}
```

### 2. Configurar Webhook en Vonage

1. Ir a Vonage Dashboard → Applications
2. Seleccionar tu aplicación
3. En "Event URL" configurar: `https://your-domain.com/api/webhooks/vonage/events`
4. Seleccionar eventos: `started`, `ringing`, `answered`, `completed`, `failed`

### 3. Estructura de Llamada

#### Payload para Vonage API:
```json
{
  "to": [
    {
      "type": "phone",
      "number": "34661216995"
    }
  ],
  "from": {
    "type": "phone", 
    "number": "34604579589"
  },
  "ncco": [
    {
      "action": "connect",
      "endpoint": [
        {
          "type": "sip",
          "uri": "sip:DERIVATION_ID@kanguro-derivations.sip-eu.vonage.com"
        }
      ],
      "eventUrl": [
        "https://api.test.kanguro.com/api/v1/callBot/callback/DERIVATION_ID?api-key=API_KEY"
      ]
    }
  ]
}
```

## 🚀 Uso del Sistema

### 1. Crear Test A/B

```javascript
// POST /api/ab-tests
{
  "test_name": "Mobile vs Landline Strategy",
  "config": {
    "groups": {
      "A": {
        "label": "Mobile Strategy",
        "derivationId": "mobile-derivation-001"
      },
      "B": {
        "label": "Landline Strategy", 
        "derivationId": "landline-derivation-002"
      }
    },
    "leads": [
      {
        "phone": "+34661216995",
        "name": "Test Lead 1"
      }
    ]
  }
}
```

### 2. Hacer Llamada A/B

```javascript
// POST /api/ab-caller/make-call
{
  "testId": "test_123",
  "leadId": "lead_456", 
  "destinationNumber": "34661216995",
  "group": "A",
  "derivationId": "mobile-derivation-001",
  "originNumber": "34604579589"
}
```

### 3. Recibir Eventos de Vonage

El webhook `/api/webhooks/vonage/events` recibe automáticamente:

```json
{
  "uuid": "call_123",
  "status": "answered",
  "direction": "outbound",
  "from": "34604579589",
  "to": "34661216995",
  "duration": 45,
  "start_time": "2025-01-20T10:00:00Z",
  "end_time": "2025-01-20T10:00:45Z"
}
```

## 📊 Monitoreo y Métricas

### Métricas por Grupo
- **Total Calls**: Número total de llamadas
- **Answer Rate**: Porcentaje de llamadas contestadas
- **Average Duration**: Duración promedio
- **Cost per Call**: Costo por llamada

### Comparación A/B
- **Statistical Significance**: Significancia estadística
- **Winner**: Grupo ganador (A, B, o tie)
- **Confidence Level**: Nivel de confianza

## 🔄 Flujo de N8N

### Workflow: A/B Test Call
1. **Webhook Trigger**: Recibe solicitud de llamada A/B
2. **Validate Request**: Valida parámetros requeridos
3. **Get Test Config**: Obtiene configuración del test
4. **Build Vonage Payload**: Construye payload con derivationId
5. **Call Vonage API**: Hace la llamada a Vonage
6. **Log Call Attempt**: Registra intento en base de datos
7. **Success Response**: Retorna resultado

### Configuración en N8N
```json
{
  "webhook_url": "https://n8n.test.kanguro.com/webhook/ab-test-call",
  "method": "POST",
  "authentication": "headerAuth",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}
```

## 🛠️ Desarrollo y Testing

### Test Call
```bash
curl -X POST https://your-domain.com/api/ab-caller/make-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "testId": "test_123",
    "leadId": "lead_456",
    "destinationNumber": "34661216995", 
    "group": "A",
    "derivationId": "mobile-derivation-001",
    "originNumber": "34604579589"
  }'
```

### Verificar Webhook
```bash
curl -X GET https://your-domain.com/api/webhooks/vonage/events
# Debe retornar: {"status": "ok", "message": "Vonage webhook endpoint is healthy"}
```

## 🔒 Seguridad

### Autenticación
- **API Key**: Requerida para todas las llamadas
- **User Session**: Validación de usuario autenticado
- **Test Ownership**: Solo el propietario puede acceder a sus tests

### Validación
- **Phone Number**: Formato internacional válido
- **Derivation ID**: Debe existir en configuración
- **Test Status**: Solo tests activos pueden hacer llamadas

## 📈 Escalabilidad

### Rate Limiting
- **Calls per minute**: Configurable por CLI
- **Concurrent calls**: Límite por derivación
- **Daily limits**: Límite diario por test

### Monitoring
- **Call success rate**: Monitoreo en tiempo real
- **Error tracking**: Logs de errores detallados
- **Performance metrics**: Latencia y throughput

## 🚨 Troubleshooting

### Errores Comunes

1. **"Derivation ID not found"**
   - Verificar configuración en Vonage Dashboard
   - Comprobar que el derivationId existe

2. **"Invalid phone number"**
   - Verificar formato internacional (+34...)
   - Comprobar que el número es válido

3. **"Test not found"**
   - Verificar que el test existe
   - Comprobar que el test está activo

4. **"Webhook not receiving events"**
   - Verificar URL del webhook en Vonage
   - Comprobar que el endpoint está accesible

### Logs y Debugging
```bash
# Ver logs de llamadas
tail -f logs/ab-caller.log

# Ver métricas en tiempo real
curl https://your-domain.com/api/ab-tests/test_123/metrics
```

## 📚 Referencias

- [Vonage Voice API Documentation](https://developer.vonage.com/voice/voice-api/overview)
- [N8N Webhook Documentation](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.webhook/)
- [Phone Guard A/B Caller Tool](./AB_CALLER_TOOL_README.md)

## 🤝 Soporte

Para soporte técnico o preguntas sobre la integración:
- **Email**: support@kanguro.com
- **Documentación**: [Phone Guard Docs](./DOCUMENTATION_INDEX.md)
- **GitHub Issues**: [Repository Issues](https://github.com/Kanguro-Product/phone-guard/issues)
