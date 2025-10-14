# A/B Caller Tool

Sistema completo para realizar tests A/B de llamadas con integración de Vonage Voice, Meta WhatsApp, Email y Spam Checker interno.

## 🚀 Características

- **Tests A/B parametrizables**: Configuración 100% flexible sin números hardcodeados
- **Integración multi-canal**: Vonage Voice + Meta WhatsApp + Email
- **Spam Checker interno**: Integración con el sistema de detección de spam existente
- **Quality Gates**: Control de calidad en tiempo real con reglas configurables
- **Rate Limiting**: Control de velocidad de llamadas por CLI
- **Métricas avanzadas**: Análisis estadístico y comparación entre grupos
- **Webhooks seguros**: Manejo de eventos de voz y WhatsApp
- **UI completa**: Interfaz moderna para gestión de tests

## 📋 Arquitectura

### Core Services
- **TestRunner**: Orquestador principal de tests
- **QualityGate**: Control de calidad con spam checker
- **MetricsService**: Recopilación y análisis de métricas
- **StopRules**: Reglas de parada automática
- **RateLimiter**: Control de velocidad de llamadas

### Adapters
- **VonageVoiceAdapter**: Integración con Vonage Voice API
- **MetaWhatsAppAdapter**: Integración con Meta WhatsApp Cloud API
- **TransactionalEmailAdapter**: Integración con servicios de email
- **InternalSpamCheckerAdapter**: Integración con spam checker interno

### Database Schema
- `ab_tests`: Tests principales
- `ab_test_call_metrics`: Métricas de llamadas individuales
- `ab_test_metrics`: Métricas agregadas por grupo
- `ab_test_voice_events`: Eventos de voz de Vonage
- `ab_test_whatsapp_events`: Eventos de WhatsApp de Meta
- `ab_test_callbacks`: Callbacks y respuestas
- `ab_test_spam_snapshots`: Snapshots de spam para monitoreo

## 🛠️ Configuración

### Variables de Entorno Requeridas

```bash
# Vonage Voice API
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_APPLICATION_ID=your_application_id
VONAGE_PRIVATE_KEY=your_private_key

# Meta WhatsApp Cloud API
META_WA_TOKEN=your_whatsapp_token
META_WA_VERIFY_TOKEN=your_verify_token
META_WA_APP_SECRET=your_app_secret
META_GRAPH_VERSION=v18.0
META_WA_PHONE_NUMBER_ID=your_phone_number_id

# Email Service
SMTP_API_KEY=your_smtp_api_key

# Webhooks
WEBHOOK_BASE_URL=https://your-domain.com
```

### Base de Datos

Ejecutar el script de migración:

```sql
-- Ejecutar el archivo scripts/ab_tests_tables.sql
\i scripts/ab_tests_tables.sql
```

## 📖 Uso

### 1. Crear un Test A/B

```typescript
const testConfig = {
  test_name: "Mobile vs Fixed Line Test",
  timezone: "Europe/Madrid",
  workday: {
    start: "09:00",
    end: "17:00"
  },
  groups: {
    A: { label: "Mobile", cli: "+1234567890" },
    B: { label: "Fixed", cli: "+0987654321" }
  },
  leads: [
    { lead_id: "lead_1", phone: "+1111111111", sector: "tech", province: "madrid" },
    { lead_id: "lead_2", phone: "+2222222222", sector: "finance", province: "barcelona" }
  ],
  assignment: {
    mode: "random_1_to_1"
  },
  attempts_policy: {
    max_attempts: 3,
    ring_times_sec: [30, 30, 30],
    min_gap_after_attempts: {
      after_1: 30,
      after_2: 60
    },
    max_attempts_per_hour_per_lead: 2
  },
  spam_checker: {
    enabled: true,
    policy: "mixed",
    signal_source: "internal_api",
    scoring_field: "reputation_score",
    labels_field: "labels",
    thresholds: {
      block_above: 80,
      slow_above: 60,
      warn_above: 40
    },
    actions: {
      block: "skip_call",
      slow: "downshift_rate",
      warn: "log_only"
    }
  }
}
```

### 2. Endpoints API

#### Crear Test
```bash
POST /api/ab-tests
Content-Type: application/json

{
  "test_name": "Test Example",
  "config": { ... }
}
```

#### Controlar Test
```bash
POST /api/ab-tests/{testId}/actions
Content-Type: application/json

{
  "action": "start",  // start, pause, resume, stop
  "reason": "Starting test"
}
```

#### Obtener Métricas
```bash
GET /api/ab-tests/{testId}/metrics?interval=total&group=A
```

### 3. Webhooks

#### Voice Events (Vonage)
```
POST /api/webhooks/voice/events
```

#### WhatsApp Events (Meta)
```
GET /api/webhooks/whatsapp  # Verification
POST /api/webhooks/whatsapp  # Events
```

## 📊 Métricas y Análisis

### Métricas por Grupo
- **Total Calls**: Número total de llamadas
- **Answer Rate**: Porcentaje de llamadas contestadas
- **Connect Rate**: Porcentaje de llamadas conectadas (answered + voicemail)
- **Spam Block Rate**: Porcentaje de llamadas bloqueadas por spam
- **Average Duration**: Duración promedio de llamadas contestadas
- **Hangup Rate**: Porcentaje de colgadas rápidas

### Comparación Estadística
- **Answer Rate Difference**: Diferencia en tasa de respuesta
- **Statistical Significance**: Significancia estadística
- **Confidence Level**: Nivel de confianza
- **Winner**: Grupo ganador (A, B, o tie)

## 🔒 Seguridad y Compliance

### Row Level Security (RLS)
- Los usuarios solo pueden acceder a sus propios tests
- Políticas de seguridad en todas las tablas
- Autenticación requerida para todas las operaciones

### Spam Protection
- Integración con spam checker interno
- Quality gates configurables
- Stop rules automáticas
- Rate limiting por CLI

### Compliance
- Respeto a la lista Robinson
- Límites de llamadas por hora por CLI
- Configuración de horarios laborales
- Registro de eventos para auditoría

## 🎯 Casos de Uso

### Test de 5 Días (Ejemplo)

**Día 1 - Baseline**: Solo llamadas, sin nudges
**Día 2 - WhatsApp**: Llamadas + WhatsApp tras 2º intento fallido
**Día 3 - Timbrado**: Diferentes tiempos de timbrado por grupo
**Día 4 - Timing**: Diferentes horarios de primer intento
**Día 5 - VM + WA**: Voicemail + WhatsApp en último intento

### Configuración por Día

```json
// Día 1 - Baseline
{
  "nudges": {
    "whatsapp": { "enabled": false },
    "voicemail": { "enabled": false },
    "email": { "enabled": false }
  }
}

// Día 2 - WhatsApp
{
  "nudges": {
    "whatsapp": {
      "enabled": true,
      "when": "after_attempt_2_fail",
      "text_template": "Hi {{lead_id}}, we tried to reach you..."
    }
  }
}
```

## 🔧 Desarrollo

### Estructura del Proyecto

```
core/ab_caller_tool/
├── adapters/           # Integraciones externas
│   ├── voice/         # Vonage Voice
│   ├── whatsapp/      # Meta WhatsApp
│   ├── email/         # Email services
│   └── spam_checker/  # Spam checker interno
├── domain/            # Lógica de negocio
│   ├── assigner.ts    # Asignación de leads
│   ├── scheduler.ts   # Programación de llamadas
│   ├── quality_gate.ts # Control de calidad
│   ├── rate_limiter.ts # Control de velocidad
│   ├── stop_rules.ts  # Reglas de parada
│   └── metrics.ts     # Métricas
└── services/          # Servicios principales
    └── test_runner.ts # Orquestador principal
```

### Testing

```bash
# Tests unitarios
npm test

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e
```

## 📈 Monitoreo

### Métricas en Tiempo Real
- Dashboard con métricas live
- Alertas automáticas por umbrales
- Exportación de datos a CSV
- Integración con sistemas de monitoreo

### Logs y Debugging
- Logs estructurados de todas las operaciones
- Trazabilidad completa de llamadas
- Debug de webhooks y eventos
- Métricas de performance

## 🚀 Despliegue

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- Redis (opcional, para cache)
- Variables de entorno configuradas

### Pasos
1. Instalar dependencias: `npm install`
2. Configurar variables de entorno
3. Ejecutar migraciones de base de datos
4. Desplegar aplicación: `npm run build && npm start`
5. Configurar webhooks en Vonage y Meta

## 📚 Documentación Adicional

- [API Documentation](./openapi/ab_caller_tool.yaml)
- [Database Schema](./scripts/ab_tests_tables.sql)
- [Component Guide](./COMPONENTS_GUIDE.md)
- [Setup Guide](./SETUP_GUIDE.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Add nueva funcionalidad'`
4. Push branch: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.
