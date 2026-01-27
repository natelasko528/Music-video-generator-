# GHL Onboarding Agent - API Architecture

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                          │
│                                                                        │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│   │   React      │  │   Mobile     │  │   Admin      │              │
│   │   Frontend   │  │   App        │  │   Dashboard  │              │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│          │                  │                  │                      │
└──────────┼──────────────────┼──────────────────┼──────────────────────┘
           │                  │                  │
           │  HTTPS + JWT     │                  │
           ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       MIDDLEWARE LAYER                               │
│                                                                        │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│   │ Authentication │  │ Rate Limiting  │  │ Error Handler  │        │
│   │   (JWT Auth)   │  │  (Per Route)   │  │  (Consistent)  │        │
│   └────────────────┘  └────────────────┘  └────────────────┘        │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
           │
           │ Next.js 14 App Router
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      API ROUTES (18 ENDPOINTS)                       │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  FORM MANAGEMENT API                                            │ │
│  │                                                                   │ │
│  │  POST   /api/form/submit                    Save form data      │ │
│  │  GET    /api/form/{id}                      Get form            │ │
│  │  DELETE /api/form/{id}                      Delete form         │ │
│  │  PUT    /api/form/{id}/stage/{n}            Update stage        │ │
│  │  GET    /api/form/{id}/stage/{n}            Get stage           │ │
│  │  GET    /api/form/list                      List forms          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  IMPLEMENTATION API                                             │ │
│  │                                                                   │ │
│  │  POST   /api/implementation/start           Start workflow      │ │
│  │  GET    /api/implementation/{id}            Full status         │ │
│  │  GET    /api/implementation/{id}/progress   Progress only       │ │
│  │  POST   /api/implementation/{id}/cancel     Cancel              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  GHL OAUTH API                                                  │ │
│  │                                                                   │ │
│  │  GET    /api/auth/ghl/authorize             Start OAuth         │ │
│  │  GET    /api/auth/ghl/callback              OAuth callback      │ │
│  │  POST   /api/auth/ghl/disconnect            Disconnect          │ │
│  │  GET    /api/auth/ghl/status                Check status        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  USER & ORG API                                                 │ │
│  │                                                                   │ │
│  │  GET    /api/user/me                        Get profile         │ │
│  │  PUT    /api/user/me                        Update profile      │ │
│  │  GET    /api/organization                   Get org             │ │
│  │  PUT    /api/organization                   Update org          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  MONITORING API                                                 │ │
│  │                                                                   │ │
│  │  GET    /api/health                         Health check        │ │
│  │  GET    /api/metrics                        App metrics         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
           │
           │ Supabase Client + RLS
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER (Supabase)                         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────┐        │
│  │  PostgreSQL Database with Row Level Security (RLS)      │        │
│  │                                                            │        │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │        │
│  │  │   profiles     │  │  submissions   │  │  impls     │ │        │
│  │  │  (users)       │  │  (forms)       │  │  (status)  │ │        │
│  │  └────────────────┘  └────────────────┘  └────────────┘ │        │
│  │                                                            │        │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │        │
│  │  │  impl_logs     │  │  organizations │  │  snapshots │ │        │
│  │  │  (tracking)    │  │  (settings)    │  │  (configs) │ │        │
│  │  └────────────────┘  └────────────────┘  └────────────┘ │        │
│  │                                                            │        │
│  │  All tables have RLS policies                             │        │
│  │  Users can only access their own data                     │        │
│  └──────────────────────────────────────────────────────────┘        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────┐        │
│  │  Real-Time Subscriptions                                 │        │
│  │  - Implementation progress updates                       │        │
│  │  - Form status changes                                   │        │
│  │  - Log entries                                           │        │
│  └──────────────────────────────────────────────────────────┘        │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
           │
           │ REST API Calls
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                                │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  GoHighLevel     │  │   Inngest        │  │   Monitoring     │  │
│  │  CRM & API       │  │   (Future Jobs)  │  │   (Health)       │  │
│  │                  │  │                  │  │                  │  │
│  │  - Locations     │  │  - Workflows     │  │  - Sentry        │  │
│  │  - Contacts      │  │  - Retries       │  │  - Vercel        │  │
│  │  - Workflows     │  │  - Scheduling    │  │  - Uptime        │  │
│  │  - Pipelines     │  │  - Events        │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Form Submission Flow

```
┌─────────┐     1. Submit Form      ┌─────────────┐
│ Client  │ ───────────────────────> │ POST /form/ │
│         │                          │   submit    │
└─────────┘                          └──────┬──────┘
                                            │
                                            │ 2. Validate with Zod
                                            ▼
                                     ┌──────────────┐
                                     │ Validation   │
                                     │ Schemas      │
                                     └──────┬───────┘
                                            │
                                            │ 3. Check Auth
                                            ▼
                                     ┌──────────────┐
                                     │ JWT Auth     │
                                     │ Middleware   │
                                     └──────┬───────┘
                                            │
                                            │ 4. Save to DB
                                            ▼
                                     ┌──────────────┐
                                     │  Supabase    │
                                     │  RLS Check   │
                                     └──────┬───────┘
                                            │
                                            │ 5. If final submit
                                            ▼
                                     ┌──────────────┐
                                     │  Trigger     │
                                     │  Workflow    │
                                     └──────────────┘
```

### Authentication Flow

```
┌─────────┐     1. Request      ┌──────────────┐
│ Client  │ ─────────────────> │ API Endpoint │
│         │  Authorization:     └──────┬───────┘
│         │  Bearer <JWT>              │
└─────────┘                            │ 2. Extract Token
                                       ▼
                                ┌──────────────┐
                                │ Auth Helper  │
                                │ lib/auth.ts  │
                                └──────┬───────┘
                                       │
                                       │ 3. Verify JWT
                                       ▼
                                ┌──────────────┐
                                │  Supabase    │
                                │  Auth        │
                                └──────┬───────┘
                                       │
                                       │ 4. Get Profile
                                       ▼
                                ┌──────────────┐
                                │  Database    │
                                │  (RLS)       │
                                └──────┬───────┘
                                       │
                                       │ 5. Return User
                                       ▼
                                ┌──────────────┐
                                │ Route Handler│
                                └──────────────┘
```

### GHL OAuth Flow

```
┌─────────┐  1. Click Connect  ┌──────────────┐
│ Client  │ ─────────────────> │ GET /auth/   │
│         │                     │   ghl/       │
└─────────┘                     │   authorize  │
     ▲                          └──────┬───────┘
     │                                 │
     │                                 │ 2. Redirect
     │                                 ▼
     │                          ┌──────────────┐
     │                          │ GoHighLevel  │
     │                          │ OAuth Page   │
     │                          └──────┬───────┘
     │                                 │
     │                                 │ 3. User Approves
     │                                 ▼
     │                          ┌──────────────┐
     │  5. Redirect to App      │ GHL Callback │
     └──────────────────────────┤ with Code    │
                                └──────┬───────┘
                                       │
                                       │ 4. Exchange Code
                                       ▼
                                ┌──────────────┐
                                │ GET /auth/   │
                                │   ghl/       │
                                │   callback   │
                                └──────┬───────┘
                                       │
                                       │ 5. Store Tokens
                                       ▼
                                ┌──────────────┐
                                │  Database    │
                                │  (Encrypted) │
                                └──────────────┘
```

## Security Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
│                                                                │
│  Layer 1: Network                                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • HTTPS/TLS Encryption                                │  │
│  │  • CORS Configuration                                  │  │
│  │  • Rate Limiting (IP-based)                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  Layer 2: Authentication                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • JWT Token Validation                                │  │
│  │  • Supabase Auth Integration                           │  │
│  │  • Token Expiration Checks                             │  │
│  │  • CSRF Protection (OAuth State)                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  Layer 3: Authorization                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • Row Level Security (RLS)                            │  │
│  │  • User Ownership Checks                               │  │
│  │  • Resource Access Validation                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  Layer 4: Input Validation                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • Zod Schema Validation                               │  │
│  │  • Type Safety (TypeScript)                            │  │
│  │  • UUID Format Validation                              │  │
│  │  • SQL Injection Prevention                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  Layer 5: Data Protection                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • Encrypted Token Storage                             │  │
│  │  • Sensitive Data Filtering                            │  │
│  │  • Error Message Sanitization                          │  │
│  │  • Service Role Key Protection                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## Rate Limiting Strategy

```
┌────────────────────────────────────────────────────────┐
│                  RATE LIMITING                         │
│                                                          │
│  ┌──────────────┐      ┌──────────────┐               │
│  │   Request    │      │   Check      │               │
│  │   Arrives    │ ───> │   Rate       │               │
│  │              │      │   Limit      │               │
│  └──────────────┘      └──────┬───────┘               │
│                               │                         │
│                        ┌──────┴──────┐                 │
│                        │             │                 │
│                    Within      Exceeded                │
│                     Limit       Limit                  │
│                        │             │                 │
│                        │             │                 │
│                        ▼             ▼                 │
│                 ┌──────────┐   ┌─────────┐            │
│                 │ Process  │   │ Return  │            │
│                 │ Request  │   │ 429     │            │
│                 └──────────┘   └─────────┘            │
│                                                          │
│  Rate Limits by Endpoint Type:                         │
│  • Default:         100 req/min                        │
│  • Auth:            10 req/min                         │
│  • Form:            50 req/min                         │
│  • Implementation:  20 req/min                         │
│  • Progress:        60 req/min                         │
│  • Health:          200 req/min                        │
│                                                          │
└────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────┐
│   Request   │
│   Arrives   │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ try {        │
│   Process    │
│   Request    │
│ }            │
└──────┬───────┘
       │
       ├────> Success ────> Return 200/201
       │
       └────> Error
              │
              ▼
       ┌──────────────┐
       │ Error Type?  │
       └──────┬───────┘
              │
    ┌─────────┼─────────┬─────────┬─────────┐
    │         │         │         │         │
    ▼         ▼         ▼         ▼         ▼
 Zod      Auth    Database  Rate    Other
 Error    Error    Error    Limit   Error
  │         │         │       │       │
  │         │         │       │       │
  ▼         ▼         ▼       ▼       ▼
 400       401       500     429     500
 
Return consistent error format:
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description",
    "details": {...}
  }
}
```

## Deployment Architecture (Vercel)

```
┌──────────────────────────────────────────────────────┐
│                   VERCEL CLOUD                       │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  Next.js Serverless Functions                  │  │
│  │  (One per API route - auto-scaled)             │  │
│  │                                                  │  │
│  │  /api/form/submit     → Function A             │  │
│  │  /api/form/[id]       → Function B             │  │
│  │  /api/implementation  → Function C             │  │
│  │  /api/user/me         → Function D             │  │
│  │  ...                                            │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  Edge Network (CDN)                            │  │
│  │  • Global distribution                         │  │
│  │  • Static assets cached                        │  │
│  │  • Low latency                                 │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
└──────────────────────────────────────────────────────┘
                        │
                        │ Database Connection
                        ▼
┌──────────────────────────────────────────────────────┐
│                SUPABASE CLOUD                        │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                           │  │
│  │  • Connection pooling                          │  │
│  │  • Auto-scaling                                │  │
│  │  • Automatic backups                           │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  Real-Time Engine                              │  │
│  │  • WebSocket connections                       │  │
│  │  • Change data capture                         │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

**This architecture diagram provides a visual overview of the complete GHL Onboarding Agent API system.**
