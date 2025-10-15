# Verificación de Conexión Vonage + N8N

Guía completa para verificar que tu integración con Vonage y N8N está funcionando correctamente.

## 🎯 Cómo Verificar la Conexión

### **1. Estado en Tiempo Real**
En la sección **"Vonage Config"** del A/B Caller Tool, verás:

- **Integration Status**: Estado general de todos los sistemas
- **Connection Tester**: Herramienta para probar cada componente
- **Status Cards**: Estado individual de Vonage, N8N y Webhook

### **2. Tests Disponibles**

#### **🔐 Login Test**
- **Qué hace**: Prueba la conexión inicial con N8N
- **Cuándo usar**: Para verificar que las credenciales son correctas
- **Resultado esperado**: ✅ "N8N login successful"

#### **📡 Webhook Test**
- **Qué hace**: Prueba el webhook con N8N (modo test)
- **Cuándo usar**: Para verificar que N8N puede recibir datos
- **Resultado esperado**: ✅ "Webhook test successful"

#### **📞 Full Call Test**
- **Qué hace**: Hace una llamada real con Vonage
- **Cuándo usar**: Para verificar que todo el flujo funciona
- **Resultado esperado**: ✅ "Full call test successful"

## 🛠️ Configuración Requerida

### **1. N8N Integration**
En la sección **"Integrations"**:

```json
{
  "provider": "n8n",
  "enabled": true,
  "credentials": {
    "webhook_url": "https://n8n.test.kanguro.com/webhook/ab-test-call",
    "api_key": "tu_api_key_aqui"
  }
}
```

### **2. Vonage Application**
En tu aplicación de Vonage:

1. **Webhook URL**: `http://localhost:3000/api/webhooks/vonage/events`
2. **Event Types**: `call.answered`, `call.completed`, `call.failed`
3. **Authentication**: Configurar API Key

### **3. Derivation IDs**
Configurar en Vonage:

- **Mobile**: `mobile-derivation-001`
- **Landline**: `landline-derivation-002`
- **Hybrid**: `hybrid-derivation-003`

## 📊 Estados de Conexión

### **✅ Connected (Verde)**
- **Vonage API**: Conectado y funcionando
- **N8N Workflow**: Conectado y funcionando
- **Webhook**: Configurado y activo

### **⚠️ Issues Detected (Naranja)**
- Uno o más componentes tienen problemas
- Revisar logs para detalles específicos

### **❌ Error (Rojo)**
- Fallo crítico en la conexión
- Requiere intervención manual

## 🔍 Diagnóstico de Problemas

### **Problema: "N8N login failed"**
**Causas posibles:**
- API Key incorrecta
- URL del webhook incorrecta
- N8N no está funcionando

**Solución:**
1. Verificar API Key en Integrations
2. Comprobar URL del webhook
3. Verificar que N8N está funcionando

### **Problema: "Webhook test failed"**
**Causas posibles:**
- Webhook no configurado en N8N
- Payload incorrecto
- N8N workflow no está activo

**Solución:**
1. Verificar que el webhook está configurado en N8N
2. Comprobar que el workflow está activo
3. Revisar logs de N8N

### **Problema: "Full call test failed"**
**Causas posibles:**
- Derivation ID incorrecto
- Número de origen incorrecto
- Vonage API no configurada

**Solución:**
1. Verificar Derivation ID en Vonage
2. Comprobar número de origen
3. Verificar credenciales de Vonage

## 📈 Monitoreo Continuo

### **Auto-refresh**
- El estado se actualiza cada 30 segundos
- Notificaciones en tiempo real
- Logs de eventos guardados

### **Logs de Eventos**
Todos los tests se guardan en `ab_test_events`:

```sql
SELECT * FROM ab_test_events 
WHERE event_type = 'connection_test' 
ORDER BY created_at DESC;
```

### **Métricas de Rendimiento**
- Tiempo de respuesta de cada test
- Tasa de éxito por componente
- Historial de fallos

## 🚀 Flujo de Verificación Completo

### **Paso 1: Configurar Integración**
1. Ir a **"Integrations"**
2. Configurar N8N con webhook URL y API key
3. Verificar que está habilitado

### **Paso 2: Configurar Vonage**
1. Ir a **"Vonage Config"**
2. Configurar Derivation IDs
3. Verificar números de origen

### **Paso 3: Ejecutar Tests**
1. **Login Test**: Verificar conexión N8N
2. **Webhook Test**: Verificar recepción de datos
3. **Full Call Test**: Verificar llamada completa

### **Paso 4: Monitorear Estado**
1. Verificar **Integration Status**
2. Revisar logs de eventos
3. Configurar alertas si es necesario

## 🔧 Troubleshooting Avanzado

### **Logs de Debug**
```bash
# Ver logs del servidor
tail -f .next/server.log

# Ver logs de N8N
curl -X GET "https://n8n.test.kanguro.com/api/v1/executions"
```

### **Test Manual de Webhook**
```bash
curl -X POST "http://localhost:3000/api/webhooks/vonage/events" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "call.answered",
    "call_id": "test_call_123",
    "destination": "34661216995",
    "origin": "34604579589"
  }'
```

### **Verificar N8N Workflow**
1. Ir a N8N dashboard
2. Verificar que el workflow está activo
3. Revisar logs de ejecución
4. Comprobar que recibe webhooks

## 📋 Checklist de Verificación

- [ ] N8N integration configurada
- [ ] API Key válida
- [ ] Webhook URL correcta
- [ ] Derivation IDs configurados
- [ ] Números de origen válidos
- [ ] Login test exitoso
- [ ] Webhook test exitoso
- [ ] Full call test exitoso
- [ ] Estado general "All Systems Operational"

## 🆘 Soporte

Si tienes problemas:

1. **Revisar logs**: Usar Connection Tester
2. **Verificar configuración**: Comprobar todas las credenciales
3. **Test individual**: Ejecutar cada test por separado
4. **Contactar soporte**: Si el problema persiste

## 📞 Contacto

- **Email**: support@kanguro.com
- **Documentación**: [Phone Guard Docs](./DOCUMENTATION_INDEX.md)
- **GitHub**: [Repository Issues](https://github.com/Kanguro-Product/phone-guard/issues)
