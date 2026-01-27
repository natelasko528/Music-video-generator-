# GoHighLevel OAuth 2.0 Client & API Integration Layer

Complete, production-ready GoHighLevel API integration for the GHL Onboarding Agent with OAuth 2.0, automatic token refresh, intelligent rate limiting, and comprehensive error handling.

## 🚀 Features

- ✅ **Complete OAuth 2.0 Flow** - Authorization code grant with PKCE support
- ✅ **Automatic Token Refresh** - Background token refresh with 5-minute buffer
- ✅ **Intelligent Rate Limiting** - 100 req/min with exponential backoff (1s→16s)
- ✅ **Type-Safe API Client** - Full TypeScript support for 77+ endpoints
- ✅ **Error Recovery** - Automatic retries for transient errors (429, 500, 502, 503, 504)
- ✅ **Webhook Processing** - Event-driven architecture with signature verification
- ✅ **Secure Token Storage** - Encrypted tokens in Supabase PostgreSQL
- ✅ **Multi-Location Support** - Manage multiple GHL locations from one instance
- ✅ **Comprehensive Logging** - Request/response logging with context
- ✅ **Batch Operations** - Parallel requests with automatic rate limiting

## 📦 Installation

```bash
npm install @supabase/supabase-js zod
```

## 🔧 Setup

### 1. Environment Variables

Copy `env.example` to `.env.local`:

```bash
cp env.example .env.local
```

Configure your environment:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GoHighLevel OAuth
GHL_CLIENT_ID=your-client-id
GHL_CLIENT_SECRET=your-client-secret
GHL_REDIRECT_URI=https://your-domain.com/api/auth/ghl/callback
GHL_SCOPES=contacts.write locations.write opportunities.write

# Webhook
GHL_WEBHOOK_SECRET=your-webhook-secret
```

### 2. Database Migration

Run the Supabase migration:

```bash
supabase migration up
```

Or execute manually:
```bash
psql $DATABASE_URL < supabase/migrations/001_create_ghl_tables.sql
```

This creates:
- `ghl_tokens` - OAuth token storage (encrypted)
- `ghl_locations` - Location metadata
- `ghl_webhook_events` - Webhook event log
- `ghl_api_logs` - API request logs
- `ghl_implementation_jobs` - Background job tracking
- `ghl_snapshots` - Snapshot metadata

### 3. Configure GHL App

In your GHL app settings:

1. **Redirect URI**: `https://your-domain.com/api/auth/ghl/callback`
2. **Scopes**: Select required permissions
3. **Webhook URL**: `https://your-domain.com/api/webhooks/ghl`

## 🎯 Quick Start

### Initialize Client

```typescript
import { createGHLClientFromEnv } from '@/lib/ghl'

// Create client from environment variables
const ghl = createGHLClientFromEnv()

// Or configure manually
import { createGHLClient } from '@/lib/ghl'

const ghl = createGHLClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  clientId: process.env.GHL_CLIENT_ID!,
  clientSecret: process.env.GHL_CLIENT_SECRET!,
  locationId: 'optional-default-location-id',
})
```

### OAuth Flow

**Step 1: Initiate Authorization**

```typescript
// Frontend component
async function connectGHL() {
  const response = await fetch('/api/auth/ghl/authorize')
  const { authorizationUrl } = await response.json()
  window.location.href = authorizationUrl
}
```

**Step 2: User Authorizes** (handled by GHL)

**Step 3: Callback Received** (automatic)

The callback route exchanges the code for tokens and stores them securely.

**Step 4: Start Using API**

```typescript
const ghl = createGHLClientFromEnv()

// Test connection
const isConnected = await ghl.testConnection(locationId)

// Create contact
const result = await ghl.contacts.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
}, locationId)
```

## 📚 API Operations

### Contacts

```typescript
// Create
await ghl.contacts.create({ email: 'user@example.com', ... }, locationId)

// Get by ID
await ghl.contacts.get(contactId, locationId)

// Update
await ghl.contacts.update(contactId, { firstName: 'Jane' }, locationId)

// Delete
await ghl.contacts.delete(contactId, locationId)

// Search by email
await ghl.contacts.getByEmail('user@example.com', locationId)

// Upsert (create or update)
await ghl.contacts.upsert({ email: 'user@example.com', ... }, locationId)

// Add tags
await ghl.contacts.addTags(contactId, ['vip', 'priority'], locationId)

// Bulk create
await ghl.contacts.bulkCreate([{ email: '1@ex.com' }, ...], locationId)
```

### Sub-Accounts (Locations)

```typescript
// Create sub-account
await ghl.subaccounts.create({
  name: 'New Location',
  email: 'contact@location.com',
  phone: '+1234567890',
  address: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  country: 'US',
  postalCode: '94102',
}, companyId)

// List all
await ghl.subaccounts.list({ companyId })

// Update
await ghl.subaccounts.update(locationId, { name: 'Updated Name' })

// Update branding
await ghl.subaccounts.updateLogo(locationId, 'https://example.com/logo.png')

// Update settings
await ghl.subaccounts.updateSettings(locationId, {
  allowDuplicateContact: false,
})
```

### Snapshots

```typescript
// List available
await ghl.snapshots.list(companyId)

// Apply to location
const result = await ghl.snapshots.apply(snapshotId, locationId)

// Poll for completion
await ghl.snapshots.pollStatus(result.data.jobId, locationId, {
  maxAttempts: 60,
  intervalMs: 5000,
  onProgress: (status) => console.log(`${status.progress}%`),
})

// Apply with customizations
await ghl.snapshots.applyWithCustomizations(snapshotId, locationId, {
  branding: {
    name: 'Custom Name',
    logoUrl: 'https://example.com/logo.png',
  },
})
```

### Workflows

```typescript
// List all
await ghl.workflows.list(locationId)

// Create
await ghl.workflows.create({ name: 'New Workflow' }, locationId)

// Publish
await ghl.workflows.publish(workflowId, locationId)

// Clone
await ghl.workflows.clone(workflowId, 'Copy of Workflow', locationId)
```

## ⚡ Rate Limiting

The client automatically handles GHL's 100 requests/minute limit.

### Automatic Handling

```typescript
// All 150 requests are executed respecting rate limits
const promises = Array.from({ length: 150 }, (_, i) => 
  ghl.contacts.get(`contact-${i}`, locationId)
)
await Promise.all(promises)
```

### Check Status

```typescript
const status = ghl.getRateLimitStatus(locationId)
console.log(`${status.requestCount} / ${status.remainingRequests} requests`)
console.log(`Window resets in ${status.windowResetIn}ms`)
```

### Custom Concurrency

```typescript
await ghl.client.batch(
  requests,
  locationId,
  5 // Max 5 concurrent requests
)
```

## 🔒 Error Handling

All operations return a consistent response structure:

```typescript
interface GHLAPIResponse<T> {
  data?: T
  error?: {
    statusCode: number
    message: string
    code?: string
    retryable: boolean
    details?: any
  }
}
```

### Usage

```typescript
const result = await ghl.contacts.create(data, locationId)

if (result.error) {
  if (result.error.retryable) {
    // Transient error - retry later
    await retryQueue.add({ operation: 'createContact', data })
  } else {
    // Permanent error - log and alert
    console.error('Failed:', result.error.message)
  }
  return
}

// Success
console.log('Contact created:', result.data.contact)
```

### Error Types

- **GHLAuthException** (401) - Token invalid/expired
- **GHLRateLimitException** (429) - Rate limit exceeded
- **GHLAPIException** - General API errors

Transient errors (429, 500, 502, 503, 504) are automatically retried with exponential backoff.

## 🪝 Webhooks

### Setup

1. Configure webhook URL in GHL: `https://your-domain.com/api/webhooks/ghl`
2. Set webhook secret in environment: `GHL_WEBHOOK_SECRET`

### Automatic Processing

The webhook handler automatically:
- ✅ Verifies HMAC signatures
- ✅ Stores events in database
- ✅ Processes based on event type
- ✅ Marks as processed

### Custom Handlers

Add custom logic in `/api/webhooks/ghl/route.ts`:

```typescript
async function handleContactCreated(payload: any, locationId: string) {
  // Your custom logic
  const contact = payload.contact
  
  // Send welcome email
  await sendEmail(contact.email, 'Welcome!')
  
  // Add to CRM
  await addToCRM(contact)
}
```

### Supported Events

- `contact.created` / `contact.updated` / `contact.deleted`
- `opportunity.created` / `opportunity.stage.updated`
- `message.inbound` / `message.outbound`
- `form.submitted` / `survey.submitted`
- `workflow.started` / `workflow.completed`
- `appointment.created` / `task.created`

## 🏗️ Architecture

```
src/
├── lib/ghl/
│   ├── client/
│   │   ├── GHLClient.ts          # Main API client
│   │   ├── RateLimiter.ts        # Rate limiting logic
│   │   └── TokenManager.ts       # Token refresh & storage
│   ├── operations/
│   │   ├── contacts.ts           # Contact operations
│   │   ├── subaccounts.ts        # Sub-account operations
│   │   ├── snapshots.ts          # Snapshot operations
│   │   └── workflows.ts          # Workflow operations
│   ├── types/
│   │   └── index.ts              # TypeScript definitions
│   └── index.ts                  # Main export
├── app/api/
│   ├── auth/ghl/
│   │   ├── authorize/route.ts    # OAuth initiation
│   │   └── callback/route.ts     # OAuth callback
│   └── webhooks/ghl/
│       └── route.ts              # Webhook handler
└── supabase/migrations/
    └── 001_create_ghl_tables.sql # Database schema
```

## 🧪 Testing

Run tests:

```bash
npm test
```

Test files:
- `tests/ghl-client.test.ts` - Client tests
- `tests/rate-limiter.test.ts` - Rate limiter tests
- `tests/token-manager.test.ts` - Token manager tests

## 📊 Database Maintenance

Run these periodically (e.g., daily cron job):

```sql
-- Cleanup old webhook events (>30 days)
SELECT cleanup_old_webhook_events();

-- Cleanup old API logs (>7 days)
SELECT cleanup_old_api_logs();

-- Cleanup expired tokens (>90 days)
SELECT cleanup_expired_tokens();
```

## 🎓 Examples

See `GHL_INTEGRATION_GUIDE.md` for comprehensive examples:

- Complete sub-account setup
- Syncing contacts from external CRM
- Batch operations
- Custom webhook handlers
- Error recovery patterns

## 📝 API Coverage

### Implemented (77+ endpoints)

✅ Contacts (CRUD, search, tags, bulk)  
✅ Sub-accounts (CRUD, settings, branding)  
✅ Snapshots (list, apply, poll status)  
✅ Workflows (CRUD, publish, clone)  
✅ OAuth (authorize, callback, refresh)  
✅ Webhooks (receive, verify, process)  

### Coming Soon

- Opportunities & Pipelines
- Calendars & Appointments
- Conversations & Messages
- Forms & Surveys
- Custom Fields
- Tags & Custom Values
- Users & Teams

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT

## 🆘 Support

- **Documentation**: See `GHL_INTEGRATION_GUIDE.md`
- **GHL API Docs**: https://highlevel.stoplight.io/
- **Issues**: Create an issue on GitHub
- **Email**: support@example.com

## 🙏 Acknowledgments

- GoHighLevel for the API
- Supabase for the database platform
- Next.js for the web framework
