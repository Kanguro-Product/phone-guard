# Simple Vonage A/B Integration

Integración simple con N8N webhook para llamadas A/B usando derivationId.

## 🎯 Objetivo

Integración mínima que solo:
1. **Hace login inicial** para autenticación
2. **Llama al webhook de N8N** con parámetros dinámicos
3. **Retorna resultado** estructurado
4. **Parametriza para A/B tests**

## 📋 Requisitos

- N8N webhook URL configurado
- API Key para autenticación
- Derivation IDs configurados en Vonage

## 🚀 Implementación

### Node.js

```javascript
const caller = new SimpleVonageABCaller(
  'https://n8n.test.kanguro.com/webhook/ab-test-call',
  'tu_api_key_aqui'
)

// Llamada individual A/B
const result = await caller.makeABCall({
  destinationNumber: '34661216995',
  derivationId: 'mobile-derivation-001', // Group A
  originNumber: '34604579589',
  group: 'A',
  testId: 'test_123',
  leadId: 'lead_456'
})
```

### Python

```python
caller = SimpleVonageABCaller(
  'https://n8n.test.kanguro.com/webhook/ab-test-call',
  'tu_api_key_aqui'
)

# Llamada individual A/B
result = caller.make_ab_call(
  destination_number='34661216995',
  derivation_id='mobile-derivation-001',  # Group A
  origin_number='34604579589',
  group='A',
  test_id='test_123',
  lead_id='lead_456'
)
```

## 🔧 Configuración A/B

### Configuración de Grupos

```javascript
const configuracionesAB = {
  groupA: {
    derivationId: 'mobile-derivation-001',
    originNumber: '34604579589',
    strategy: 'mobile-first'
  },
  groupB: {
    derivationId: 'landline-derivation-002',
    originNumber: '34604579589',
    strategy: 'landline-focused'
  }
}
```

### Llamada Parametrizada

```javascript
// Función para hacer llamada A/B parametrizada
async function llamadaABParametrizada(destinationNumber, group, testId, leadId) {
  const caller = new SimpleVonageABCaller(
    'https://n8n.test.kanguro.com/webhook/ab-test-call',
    'tu_api_key_aqui'
  )

  const config = group === 'A' ? configuracionesAB.groupA : configuracionesAB.groupB

  return await caller.makeABCall({
    destinationNumber,
    derivationId: config.derivationId,
    originNumber: config.originNumber,
    group,
    testId,
    leadId
  })
}
```

## 📊 Llamadas Batch

### Node.js

```javascript
const requests = [
  {
    destinationNumber: '34661216995',
    derivationId: 'mobile-derivation-001',
    originNumber: '34604579589',
    group: 'A',
    testId: 'test_123',
    leadId: 'lead_456'
  },
  {
    destinationNumber: '34661216995',
    derivationId: 'landline-derivation-002',
    originNumber: '34604579589',
    group: 'B',
    testId: 'test_123',
    leadId: 'lead_456'
  }
]

const results = await caller.makeBatchABCalls(requests)
```

### Python

```python
requests = [
  {
    'destinationNumber': '34661216995',
    'derivationId': 'mobile-derivation-001',
    'originNumber': '34604579589',
    'group': 'A',
    'testId': 'test_123',
    'leadId': 'lead_456'
  },
  {
    'destinationNumber': '34661216995',
    'derivationId': 'landline-derivation-002',
    'originNumber': '34604579589',
    'group': 'B',
    'testId': 'test_123',
    'leadId': 'lead_456'
  }
]

results = caller.make_batch_ab_calls(requests)
```

## 🔄 Flujo de Integración

### 1. Login Inicial
```javascript
// POST /webhook/ab-test-call/login
{
  "action": "login",
  "timestamp": "2025-01-20T10:00:00Z"
}
```

### 2. Llamada A/B
```javascript
// POST /webhook/ab-test-call
{
  "destinationNumber": "34661216995",
  "derivationId": "mobile-derivation-001",
  "originNumber": "34604579589",
  "group": "A",
  "testId": "test_123",
  "leadId": "lead_456",
  "timestamp": "2025-01-20T10:00:00Z"
}
```

### 3. Respuesta del Webhook
```javascript
{
  "success": true,
  "callId": "call_123",
  "message": "Call initiated successfully"
}
```

## 🛠️ Integración con API

### Endpoint: `/api/ab-caller/simple-call`

```javascript
// POST /api/ab-caller/simple-call
{
  "destinationNumber": "34661216995",
  "derivationId": "mobile-derivation-001",
  "originNumber": "34604579589",
  "group": "A",
  "testId": "test_123",
  "leadId": "lead_456"
}
```

### Respuesta
```javascript
{
  "success": true,
  "callId": "call_123",
  "metadata": {
    "group": "A",
    "derivationId": "mobile-derivation-001",
    "destinationNumber": "34661216995",
    "originNumber": "34604579589",
    "timestamp": "2025-01-20T10:00:00Z"
  },
  "message": "A/B call initiated successfully via N8N"
}
```

## 🔒 Autenticación

### Headers Requeridos
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer tu_api_key_aqui"
}
```

### Validación
- API Key válida
- Usuario autenticado
- Integración N8N configurada

## 📈 Monitoreo

### Logs de Llamadas
```javascript
// Cada llamada se registra con:
{
  "callId": "call_123",
  "group": "A",
  "derivationId": "mobile-derivation-001",
  "destinationNumber": "34661216995",
  "timestamp": "2025-01-20T10:00:00Z",
  "status": "initiated"
}
```

### Métricas A/B
- Total calls por grupo
- Success rate por grupo
- Average duration por grupo
- Cost per call por grupo

## 🚨 Troubleshooting

### Errores Comunes

1. **"Login failed"**
   - Verificar API Key
   - Comprobar URL del webhook

2. **"N8N webhook failed"**
   - Verificar que N8N está funcionando
   - Comprobar formato del payload

3. **"Missing required field"**
   - Verificar que todos los campos están presentes
   - Comprobar formato de los datos

### Debug
```javascript
// Habilitar logs detallados
const caller = new SimpleVonageABCaller(webhookUrl, apiKey)
caller.debug = true

// Ver logs de la llamada
console.log('Call result:', result)
```

## 📚 Ejemplos Completos

### Node.js Express
```javascript
const express = require('express')
const app = express()

app.post('/ab-call', async (req, res) => {
  try {
    const { destinationNumber, group, testId, leadId } = req.body
    
    const result = await llamadaABParametrizada(
      destinationNumber, group, testId, leadId
    )
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

### Python Flask
```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/ab-call', methods=['POST'])
def ab_call():
    try:
        data = request.json
        result = llamada_ab_parametrizada(
            data['destinationNumber'],
            data['group'],
            data['testId'],
            data['leadId']
        )
        return jsonify(result)
    except Exception as error:
        return jsonify({'error': str(error)}), 500
```

## 🎯 Casos de Uso

### Test A/B Mobile vs Landline
```javascript
// Group A: Mobile strategy
await llamadaABParametrizada('34661216995', 'A', 'test_123', 'lead_456')

// Group B: Landline strategy  
await llamadaABParametrizada('34661216995', 'B', 'test_123', 'lead_456')
```

### Test A/B Diferentes Horarios
```javascript
// Group A: Morning calls
await llamadaABParametrizada('34661216995', 'A', 'test_123', 'lead_456')

// Group B: Afternoon calls
await llamadaABParametrizada('34661216995', 'B', 'test_123', 'lead_456')
```

## 📋 Checklist de Implementación

- [ ] Configurar N8N webhook URL
- [ ] Configurar API Key
- [ ] Configurar derivation IDs
- [ ] Implementar login inicial
- [ ] Implementar llamada A/B
- [ ] Configurar monitoreo
- [ ] Probar con datos reales
- [ ] Configurar métricas A/B

## 🤝 Soporte

Para soporte técnico:
- **Email**: support@kanguro.com
- **Documentación**: [Phone Guard Docs](./DOCUMENTATION_INDEX.md)
- **GitHub**: [Repository Issues](https://github.com/Kanguro-Product/phone-guard/issues)
