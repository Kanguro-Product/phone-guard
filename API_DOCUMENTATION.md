# 🚀 API Documentation - Phone Guard

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Phone Number Management](#phone-number-management)
4. [SPAM Validation](#spam-validation)
5. [Hiya Scraping](#hiya-scraping)
6. [Calls](#calls)
7. [CallOps (A/B Testing)](#callops-ab-testing)
8. [Number Lists](#number-lists)
9. [Integrations](#integrations)
10. [Error Codes](#error-codes)
11. [Rate Limiting](#rate-limiting)
12. [Usage Examples](#usage-examples)

---

## 🌐 Overview

**Base URL**: `https://your-app.vercel.app`

**Format**: All endpoints return JSON

**Authentication**: JWT via cookies (Supabase Auth)

**HTTP Methods**:
- `GET`: Retrieve resources
- `POST`: Create resources
- `PATCH`: Update resources
- `DELETE`: Delete resources

---

## 🔐 Authentication

All API routes (except auth callbacks) require authentication.

### Required Headers

```http
Cookie: sb-access-token=<jwt_token>
Content-Type: application/json
```

### Get Token

Token is obtained automatically when logging in through:

```typescript
// Client
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Token is automatically saved in cookies
```

---

## 📞 Phone Number Management

### POST /api/validate-spam
Validate individual number with multiple providers

**Request Body**:
```json
{
  "phoneNumberId": "uuid",
  "selectedAPIs": {
    "numverify": true,
    "openai": true,
    "hiya": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "validation": {
    "overallResult": {
      "isSpam": false,
      "confidence": 0.85,
      "details": {
        "category": "clean",
        "reputation": 85,
        "reason": "Number appears legitimate"
      }
    },
    "providerResults": [
      {
        "provider": "ChatGPT",
        "isSpam": false,
        "confidence": 0.90,
        "details": {
          "category": "clean",
          "reputation": 90,
          "reason": "AI analysis indicates legitimate business number"
        }
      }
    ]
  },
  "updatedReputation": 85
}
```

**Status Codes**:
- `200`: Success
- `400`: Missing phoneNumberId
- `401`: Unauthorized
- `404`: Phone number not found
- `500`: Server error

---

### POST /api/bulk-validate
Validate multiple numbers in batch

**Request Body**:
```json
{
  "selectedAPIs": {
    "numverify": true,
    "openai": true,
    "hiya": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "results": {
    "total": 10,
    "validated": 10,
    "spam": 2,
    "clean": 8
  }
}
```

---

## 🌐 Hiya Scraping

### POST /api/hiya-scrape
Execute Hiya dashboard scraping

**Query Params**:
- `preview=true`: Preview mode (first row only, doesn't write to DB)
- `diagnostic=true`: Diagnostic mode (check configuration)

**Response (normal)**:
```json
{
  "ok": true,
  "checked": 145,
  "total": 145,
  "pagesScraped": 3,
  "durationMs": 24500
}
```

**Response (preview)**:
```json
{
  "ok": true,
  "preview": true,
  "firstRow": {
    "phone": "+34612345678",
    "label": "Spam Risk",
    "score": "85",
    "last_seen": "2025-10-08",
    "is_spam": true
  }
}
```

**Configuration (ENV)**:
```bash
BROWSERLESS_URL=wss://production-sfo.browserless.io?token=XXX
HIYA_EMAIL=your_email@hiya.com
HIYA_PASSWORD=your_password
MAX_PER_RUN=200
RATE_LIMIT_MINUTES=5
```

---

## 📊 Calls

### POST /api/log-call
Log a call

**Request Body**:
```json
{
  "phoneNumberId": "uuid",
  "cadenceId": "uuid",
  "destinationNumber": "+34600000000",
  "status": "success",
  "duration": 120,
  "cost": 0.05
}
```

**Valid Status**:
- `success`: Successful call
- `failed`: General failure
- `busy`: Busy
- `no_answer`: No answer
- `spam_detected`: Detected as spam

---

### POST /api/get-next-number
Get next number in rotation

**Request Body**:
```json
{
  "cadenceId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "id": "uuid",
    "number": "+34612345678",
    "provider": "Twilio",
    "reputation_score": 90
  }
}
```

**Rotation Strategies**:
- `round_robin`: By usage order (last_checked)
- `random`: Random
- `reputation_based`: Highest reputation_score first

---

## 🧪 CallOps (A/B Testing)

### GET /api/callops/tests
List user's tests

**Response**:
```json
{
  "tests": [
    {
      "id": "uuid",
      "test_key": "T-003",
      "full_id": "T-003-FM-2025-10-07",
      "name": "Mobile vs Fixed Line",
      "status": "Running",
      "variants": [
        { "id": "A", "label": "Mobile" },
        { "id": "B", "label": "Fixed" }
      ]
    }
  ]
}
```

---

### POST /api/callops/tests
Create new test

**Request Body**:
```json
{
  "name": "Mobile vs Fixed Line Test",
  "code": "FM",
  "hypothesis": "Mobile numbers have better pickup rate",
  "objective": "Increase pickup rate by 15%",
  "variants": [
    { "id": "A", "label": "Mobile" },
    { "id": "B", "label": "Fixed Line" }
  ],
  "sample_per_variant": { "A": 100, "B": 100 },
  "duration_hours": 24,
  "success_criteria": "Pickup rate > 60%"
}
```

---

### POST /api/callops/metrics
Report test metrics

**Request Body**:
```json
{
  "test_id": "uuid",
  "metrics": [
    {
      "variant_id": "A",
      "metric_name": "conversion_rate",
      "value": 0.65,
      "sample_size": 100
    },
    {
      "variant_id": "B",
      "metric_name": "conversion_rate",
      "value": 0.52,
      "sample_size": 100
    }
  ]
}
```

---

## 📋 Number Lists

### GET /api/number-lists
Get user's lists

**Response**:
```json
{
  "lists": [
    {
      "id": "uuid",
      "name": "High Priority",
      "description": "VIP numbers",
      "color": "#3B82F6",
      "icon": "Star",
      "item_count": 15
    }
  ]
}
```

---

### POST /api/number-lists/[id]/add
Add numbers to a list

**Request Body**:
```json
{
  "phoneNumberIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response**:
```json
{
  "success": true,
  "added": 3,
  "skipped": 0
}
```

---

## 🔌 Integrations

### GET /api/integrations/credentials
Check if credentials are configured (without exposing values)

**Response**:
```json
{
  "numverify": {
    "hasKey": true,
    "hasSecret": false,
    "isConfigured": true
  },
  "openai": {
    "hasKey": true,
    "isConfigured": true
  },
  "hiya": {
    "hasKey": true,
    "hasSecret": true,
    "isConfigured": true
  }
}
```

---

## ❌ Error Codes

### Common Errors

| Code | Meaning | Solution |
|------|---------|----------|
| `400` | Bad Request | Check body and parameters |
| `401` | Unauthorized | Login required |
| `403` | Forbidden | No permissions (e.g., not admin) |
| `404` | Not Found | Resource doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded, wait |
| `500` | Internal Server Error | Server error, check logs |

### Error Format

```json
{
  "error": "Error message",
  "details": "Additional context (optional)",
  "code": "ERROR_CODE (optional)"
}
```

---

## ⏱️ Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window | Headers |
|----------|-------|--------|---------|
| `/api/hiya-scrape` | 1 request | 5 min | N/A |
| `/api/bulk-validate` | 10 requests | 1 hour | N/A |
| `/api/validate-spam` | 100 requests | 1 hour | N/A |
| Others | No limit | - | - |

---

## 📝 Usage Examples

### JavaScript/TypeScript (fetch)

```typescript
// Validate SPAM
const response = await fetch('/api/validate-spam', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumberId: 'uuid-here',
    selectedAPIs: {
      numverify: true,
      openai: true,
      hiya: false
    }
  })
})

const data = await response.json()

if (data.success) {
  console.log('Validation:', data.validation)
} else {
  console.error('Error:', data.error)
}
```

---

### Python (requests)

```python
import requests

# Login first (get cookies)
auth = requests.post(
    'https://your-app.vercel.app/auth/api/sign-in',
    json={
        'email': 'user@example.com',
        'password': 'password'
    }
)

cookies = auth.cookies

# Then call API
response = requests.post(
    'https://your-app.vercel.app/api/validate-spam',
    json={
        'phoneNumberId': 'uuid-here',
        'selectedAPIs': {
            'numverify': True,
            'openai': True,
            'hiya': True
        }
    },
    cookies=cookies
)

data = response.json()
print(data)
```

---

### cURL

```bash
# Hiya scraping (preview)
curl -X POST \
  'https://your-app.vercel.app/api/hiya-scrape?preview=true' \
  -H 'Cookie: sb-access-token=YOUR_TOKEN'

# Create CallOps test
curl -X POST \
  'https://your-app.vercel.app/api/callops/tests' \
  -H 'Cookie: sb-access-token=YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Mobile vs Fixed Test",
    "code": "MF",
    "hypothesis": "Mobile has better pickup",
    "variants": [
      {"id": "A", "label": "Mobile"},
      {"id": "B", "label": "Fixed"}
    ],
    "sample_per_variant": {"A": 100, "B": 100},
    "duration_hours": 24
  }'
```

---

## 📚 Resources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [TypeScript Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

**Last update**: October 2025  
**API version**: v1.0  
**Maintainer**: [Your name]
