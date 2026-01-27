# GHL Onboarding Agent API Documentation

Complete API reference for the GHL Onboarding Agent backend.

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)

---

## Authentication

All endpoints (except health check) require authentication using a JWT Bearer token from Supabase Auth.

Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

Use Supabase Auth to sign in and obtain a JWT:

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

const token = data.session.access_token;
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `AUTHENTICATION_REQUIRED` | No or invalid auth token | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource conflict | 409 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `EXTERNAL_API_ERROR` | External service error | 502 |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default**: 100 requests/minute
- **Auth endpoints**: 10 requests/minute
- **Form endpoints**: 50 requests/minute
- **Implementation endpoints**: 20 requests/minute
- **Health check**: 200 requests/minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Endpoints

### Form Submission & Management

#### POST /api/form/submit

Save form stage data and create/update submission.

**Request Body:**

```json
{
  "submission_id": "uuid",          // Optional, omit to create new
  "stage_number": 1,                 // 1-6
  "stage_data": { ... },             // Stage-specific data
  "is_final_submit": false           // Set true for final submission
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "submission": {
      "id": "uuid",
      "user_id": "uuid",
      "form_data": { ... },
      "status": "draft",
      "step_completed": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "submitted_at": null
    },
    "message": "Progress saved"
  },
  "message": "Progress saved successfully"
}
```

**cURL Example:**

```bash
curl -X POST https://api.yourapp.com/api/form/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stage_number": 1,
    "stage_data": {
      "businessName": "ACME HVAC",
      "industry": "hvac",
      "businessEmail": "contact@acmehvac.com",
      "businessPhone": "+15551234567",
      "businessAddress": {
        "street": "123 Main St",
        "city": "Austin",
        "state": "TX",
        "postalCode": "78701",
        "country": "US"
      },
      "brandColors": {
        "primary": "#FF5733",
        "secondary": "#3357FF",
        "accent": "#FFC300"
      }
    }
  }'
```

---

#### GET /api/form/[formId]

Retrieve form data by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "form_data": {
      "step_1": { ... },
      "step_2": { ... }
    },
    "status": "draft",
    "step_completed": 2,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "submitted_at": null
  }
}
```

**cURL Example:**

```bash
curl https://api.yourapp.com/api/form/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### PUT /api/form/[formId]/stage/[stageNumber]

Update specific stage of a form submission.

**Request Body:**

```json
{
  "stage_data": {
    "services": [
      {
        "name": "Residential HVAC Installation",
        "description": "Complete HVAC system installation",
        "priceRange": {
          "min": 3000,
          "max": 8000
        }
      }
    ],
    "leadTypes": ["residential", "commercial"],
    "salesProcess": ["inquiry", "consultation", "quote", "closing"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "submission": { ... },
    "stage_number": 2
  },
  "message": "Stage 2 updated successfully"
}
```

**cURL Example:**

```bash
curl -X PUT https://api.yourapp.com/api/form/550e8400-e29b-41d4-a716-446655440000/stage/2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stage_data": {
      "services": [
        {
          "name": "HVAC Repair",
          "description": "Emergency repair services"
        }
      ],
      "leadTypes": ["emergency"],
      "salesProcess": ["call", "dispatch", "repair", "payment"]
    }
  }'
```

---

#### GET /api/form/list

List all forms for the authenticated user with pagination.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `status` (optional: draft, submitted, processing, completed, failed)
- `sort_by` (default: created_at)
- `sort_order` (default: desc)

**Response:**

```json
{
  "success": true,
  "data": {
    "forms": [ ... ],
    "total": 42,
    "page": 1,
    "limit": 10
  }
}
```

**cURL Example:**

```bash
curl "https://api.yourapp.com/api/form/list?page=1&limit=20&status=draft" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Implementation Management

#### POST /api/implementation/start

Trigger implementation workflow for a submitted form.

**Request Body:**

```json
{
  "submission_id": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "implementation_id": "uuid",
    "status": "pending",
    "message": "Implementation started successfully"
  },
  "message": "Implementation workflow initiated"
}
```

**cURL Example:**

```bash
curl -X POST https://api.yourapp.com/api/implementation/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

#### GET /api/implementation/[implementationId]

Get implementation status with full details and logs.

**Response:**

```json
{
  "success": true,
  "data": {
    "implementation": {
      "id": "uuid",
      "submission_id": "uuid",
      "user_id": "uuid",
      "status": "in_progress",
      "current_step": "Creating location",
      "total_steps": 10,
      "completed_steps": 3,
      "progress_percentage": 30,
      "created_at": "2024-01-01T00:00:00Z",
      "started_at": "2024-01-01T00:01:00Z"
    },
    "logs": [
      {
        "id": "uuid",
        "step_id": "create_location",
        "step_name": "Create GHL Location",
        "status": "completed",
        "message": "Location created successfully",
        "created_at": "2024-01-01T00:01:00Z"
      }
    ],
    "real_time_enabled": true
  }
}
```

**cURL Example:**

```bash
curl https://api.yourapp.com/api/implementation/660e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### GET /api/implementation/[implementationId]/progress

Get real-time progress summary (lightweight endpoint for polling).

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "in_progress",
    "progress_percentage": 45,
    "current_step": "Creating workflows",
    "completed_steps": 4,
    "total_steps": 10,
    "elapsed_seconds": 120,
    "estimated_remaining_seconds": 180,
    "recent_logs": [ ... ]
  }
}
```

**cURL Example:**

```bash
curl https://api.yourapp.com/api/implementation/660e8400-e29b-41d4-a716-446655440000/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### POST /api/implementation/[implementationId]/cancel

Cancel a running implementation.

**Request Body:**

```json
{
  "reason": "User requested cancellation"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "cancelled": true,
    "implementation_id": "uuid"
  },
  "message": "Implementation cancelled successfully"
}
```

**cURL Example:**

```bash
curl -X POST https://api.yourapp.com/api/implementation/660e8400-e29b-41d4-a716-446655440000/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Changed requirements"
  }'
```

---

### GHL OAuth Flow

#### GET /api/auth/ghl/authorize

Initiate GHL OAuth flow. Redirects to GHL authorization page.

**cURL Example:**

```bash
curl https://api.yourapp.com/api/auth/ghl/authorize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### GET /api/auth/ghl/callback

Handle OAuth callback (called by GHL, not directly by client).

**Query Parameters:**
- `code`: Authorization code
- `state`: CSRF protection token

---

#### POST /api/auth/ghl/disconnect

Disconnect GHL account.

**Request Body:**

```json
{
  "confirm": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "disconnected": true
  },
  "message": "GHL account disconnected successfully"
}
```

**cURL Example:**

```bash
curl -X POST https://api.yourapp.com/api/auth/ghl/disconnect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'
```

---

#### GET /api/auth/ghl/status

Check GHL connection status.

**Response:**

```json
{
  "success": true,
  "data": {
    "connected": true,
    "agency_id": "ghl_agency_123",
    "token_expires_at": "2024-12-31T23:59:59Z",
    "token_valid": true,
    "scopes": [
      "contacts.readonly",
      "contacts.write",
      "locations.readonly",
      "locations.write"
    ]
  }
}
```

**cURL Example:**

```bash
curl https://api.yourapp.com/api/auth/ghl/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### User & Organization

#### GET /api/user/me

Get current user profile.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "agency_name": "ACME Marketing",
    "ghl_agency_id": "ghl_123",
    "ghl_token_expires_at": "2024-12-31T23:59:59Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**cURL Example:**

```bash
curl https://api.yourapp.com/api/user/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### PUT /api/user/me

Update user profile.

**Request Body:**

```json
{
  "full_name": "Jane Doe",
  "agency_name": "Better Marketing Agency"
}
```

**Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Profile updated successfully"
}
```

**cURL Example:**

```bash
curl -X PUT https://api.yourapp.com/api/user/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith",
    "agency_name": "Smith Marketing"
  }'
```

---

#### GET /api/organization

Get organization details.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Organization",
    "settings": {
      "default_industry": "hvac",
      "branding": {
        "logo_url": "https://...",
        "primary_color": "#FF5733",
        "secondary_color": "#3357FF"
      },
      "notifications": {
        "email_enabled": true,
        "webhook_url": "https://..."
      }
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**cURL Example:**

```bash
curl https://api.yourapp.com/api/organization \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### PUT /api/organization

Update organization settings.

**Request Body:**

```json
{
  "name": "Updated Organization Name",
  "settings": {
    "default_industry": "real_estate",
    "branding": {
      "primary_color": "#00AA00"
    },
    "notifications": {
      "email_enabled": false
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Organization updated successfully"
}
```

**cURL Example:**

```bash
curl -X PUT https://api.yourapp.com/api/organization \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Agency Name",
    "settings": {
      "branding": {
        "primary_color": "#0066CC"
      }
    }
  }'
```

---

### Health & Monitoring

#### GET /api/health

Health check endpoint (no authentication required).

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "services": {
      "database": {
        "status": "up",
        "latency_ms": 23
      },
      "storage": {
        "status": "up",
        "latency_ms": 45
      },
      "ghl_api": {
        "status": "up",
        "latency_ms": 120
      },
      "inngest": {
        "status": "up"
      }
    }
  }
}
```

**cURL Example:**

```bash
curl https://api.yourapp.com/api/health
```

---

#### GET /api/metrics

Application metrics (requires authentication).

**Query Parameters:**
- `period` (default: 7d, options: 7d, 30d, 90d)

**Response:**

```json
{
  "success": true,
  "data": {
    "implementations": {
      "total": 150,
      "completed": 145,
      "failed": 3,
      "in_progress": 2,
      "success_rate": 96.67,
      "avg_duration_seconds": 420
    },
    "forms": {
      "total_submissions": 200,
      "draft": 20,
      "submitted": 30,
      "completed": 150
    },
    "users": {
      "total": 50,
      "with_ghl_connected": 45
    },
    "performance": {
      "avg_api_latency_ms": 125,
      "p95_api_latency_ms": 380
    },
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-08T00:00:00Z"
    }
  }
}
```

**cURL Example:**

```bash
curl "https://api.yourapp.com/api/metrics?period=30d" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Complete Testing Script

```bash
#!/bin/bash

# Set your API base URL and token
API_URL="https://api.yourapp.com"
TOKEN="YOUR_JWT_TOKEN"

echo "Testing GHL Onboarding Agent API..."

# 1. Health Check
echo "\n1. Health Check"
curl -s "$API_URL/api/health" | jq

# 2. Get User Profile
echo "\n2. Get User Profile"
curl -s "$API_URL/api/user/me" \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Check GHL Status
echo "\n3. Check GHL Connection Status"
curl -s "$API_URL/api/auth/ghl/status" \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Create Form Submission
echo "\n4. Create Form Submission"
SUBMISSION=$(curl -s -X POST "$API_URL/api/form/submit" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stage_number": 1,
    "stage_data": {
      "businessName": "Test HVAC",
      "industry": "hvac",
      "businessEmail": "test@test.com",
      "businessPhone": "+15551234567",
      "businessAddress": {
        "street": "123 Test St",
        "city": "Austin",
        "state": "TX",
        "postalCode": "78701",
        "country": "US"
      },
      "brandColors": {
        "primary": "#FF5733",
        "secondary": "#3357FF",
        "accent": "#FFC300"
      }
    }
  }')

echo $SUBMISSION | jq
SUBMISSION_ID=$(echo $SUBMISSION | jq -r '.data.submission.id')

# 5. Get Form
echo "\n5. Get Form Submission"
curl -s "$API_URL/api/form/$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# 6. List Forms
echo "\n6. List All Forms"
curl -s "$API_URL/api/form/list?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq

# 7. Get Metrics
echo "\n7. Get Metrics"
curl -s "$API_URL/api/metrics?period=7d" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "\n✅ API Testing Complete"
```

---

## Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# GHL OAuth
NEXT_PUBLIC_GHL_CLIENT_ID=xxx
GHL_CLIENT_SECRET=xxx
GHL_REDIRECT_URI=https://yourapp.com/api/auth/ghl/callback

# App
NEXT_PUBLIC_APP_URL=https://yourapp.com
APP_VERSION=1.0.0

# Inngest
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx
```

---

## Production Deployment Checklist

- [ ] Set all environment variables in Vercel
- [ ] Enable RLS policies in Supabase
- [ ] Configure CORS for your domain
- [ ] Set up error monitoring (Sentry)
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Enable SSL/HTTPS
- [ ] Configure logging
- [ ] Set up health check monitoring
- [ ] Test all endpoints
- [ ] Document API changes
- [ ] Version API endpoints

---

## Support

For issues or questions:
- GitHub Issues: [your-repo/issues]
- Email: support@yourapp.com
- Documentation: https://docs.yourapp.com
