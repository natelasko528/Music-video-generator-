# GoHighLevel Integration Guide
## Complete OAuth 2.0 & API Client Implementation

---

## Table of Contents
1. [Overview](#overview)
2. [Setup & Configuration](#setup--configuration)
3. [OAuth 2.0 Flow](#oauth-20-flow)
4. [API Client Usage](#api-client-usage)
5. [Rate Limiting](#rate-limiting)
6. [Error Handling](#error-handling)
7. [Webhook Integration](#webhook-integration)
8. [Database Schema](#database-schema)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

---

## Overview

This integration provides a complete, production-ready GoHighLevel API client with:

✅ **OAuth 2.0 Authorization Code Flow** - Secure token management  
✅ **Automatic Token Refresh** - No manual token handling  
✅ **Intelligent Rate Limiting** - 100 req/min with exponential backoff  
✅ **Type-Safe Operations** - Full TypeScript support  
✅ **Error Recovery** - Automatic retries for transient errors  
✅ **Webhook Processing** - Event-driven architecture  
✅ **Database Integration** - Supabase for secure token storage  

---

## Setup & Configuration

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js zod
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GoHighLevel OAuth
GHL_CLIENT_ID=your-client-id
GHL_CLIENT_SECRET=your-client-secret
GHL_REDIRECT_URI=http://localhost:3000/api/auth/ghl/callback
GHL_SCOPES=contacts.write locations.write opportunities.write

# Webhook
GHL_WEBHOOK_SECRET=your-webhook-secret
```

### 3. Database Setup

Run the migration to create required tables:

```bash
supabase migration up
```

Or manually execute `supabase/migrations/001_create_ghl_tables.sql`

---

## OAuth 2.0 Flow

### Step 1: Initiate Authorization

**Frontend:**
```typescript
// components/ConnectGHL.tsx
import { useState } from 'react'

export function ConnectGHL() {
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/ghl/authorize')
      const { authorizationUrl } = await response.json()
      
      // Redirect user to GHL authorization page
      window.location.href = authorizationUrl
    } catch (error) {
      console.error('Failed to initiate authorization:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleConnect} disabled={loading}>
      {loading ? 'Connecting...' : 'Connect GoHighLevel'}
    </button>
  )
}
```

### Step 2: Handle Callback

The callback route (`/api/auth/ghl/callback/route.ts`) automatically:
- Exchanges authorization code for tokens
- Stores tokens securely in Supabase
- Creates location record
- Redirects to success page

### Step 3: Use the Client

```typescript
// lib/ghl-client.ts
import { createGHLClientFromEnv } from '@/lib/ghl'

export const ghl = createGHLClientFromEnv()
```

---

## API Client Usage

### Initialize Client

```typescript
import { createGHLClient } from '@/lib/ghl'

const ghl = createGHLClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  clientId: process.env.GHL_CLIENT_ID!,
  clientSecret: process.env.GHL_CLIENT_SECRET!,
  locationId: 'optional-default-location-id',
})
```

### Contact Operations

```typescript
// Create contact
const result = await ghl.contacts.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  tags: ['lead', 'website'],
}, locationId)

if (result.error) {
  console.error('Failed to create contact:', result.error)
} else {
  console.log('Contact created:', result.data.contact)
}

// Update contact
await ghl.contacts.update(contactId, {
  firstName: 'Jane',
  tags: ['customer'],
}, locationId)

// Search by email
const { data } = await ghl.contacts.getByEmail('john@example.com', locationId)

// Add tags
await ghl.contacts.addTags(contactId, ['vip', 'priority'], locationId)

// Bulk create
await ghl.contacts.bulkCreate([
  { email: 'user1@example.com', firstName: 'User', lastName: 'One' },
  { email: 'user2@example.com', firstName: 'User', lastName: 'Two' },
], locationId)
```

### Sub-Account Operations

```typescript
// Create sub-account
const result = await ghl.subaccounts.create({
  name: 'New Agency Location',
  address: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  country: 'US',
  postalCode: '94102',
  email: 'contact@agency.com',
  phone: '+1234567890',
  timezone: 'America/Los_Angeles',
}, companyId)

// List all sub-accounts
const { data } = await ghl.subaccounts.list({ companyId })

// Update branding
await ghl.subaccounts.updateLogo(locationId, 'https://example.com/logo.png')

// Update settings
await ghl.subaccounts.updateSettings(locationId, {
  allowDuplicateContact: false,
  allowDuplicateOpportunity: false,
})
```

### Snapshot Operations

```typescript
// List available snapshots
const { data } = await ghl.snapshots.list(companyId)

// Apply snapshot to location
const result = await ghl.snapshots.apply(snapshotId, locationId)

if (!result.error) {
  const jobId = result.data.jobId
  
  // Poll for completion
  const finalStatus = await ghl.snapshots.pollStatus(
    jobId,
    locationId,
    {
      maxAttempts: 60,
      intervalMs: 5000,
      onProgress: (status) => {
        console.log(`Progress: ${status.progress}%`)
      },
    }
  )
  
  if (finalStatus.data?.status === 'completed') {
    console.log('Snapshot applied successfully!')
  }
}

// Apply with customizations
await ghl.snapshots.applyWithCustomizations(
  snapshotId,
  locationId,
  {
    branding: {
      name: 'Custom Agency Name',
      logoUrl: 'https://example.com/logo.png',
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
      },
    },
    settings: {
      timezone: 'America/New_York',
      phone: '+1234567890',
      email: 'support@agency.com',
    },
  }
)
```

### Workflow Operations

```typescript
// List workflows
const { data } = await ghl.workflows.list(locationId)

// Create workflow
await ghl.workflows.create({
  name: 'New Lead Follow-up',
  status: 'draft',
}, locationId)

// Publish workflow
await ghl.workflows.publish(workflowId, locationId)

// Clone workflow
await ghl.workflows.clone(workflowId, 'Copy of Workflow', locationId)
```

---

## Rate Limiting

The client automatically handles GHL's 100 requests/minute limit:

### Automatic Handling

```typescript
// These requests are automatically rate-limited
const promises = Array.from({ length: 150 }, (_, i) => 
  ghl.contacts.get(`contact-${i}`, locationId)
)

// Executes respecting rate limits
const results = await Promise.all(promises)
```

### Manual Control

```typescript
// Check rate limit status
const status = ghl.getRateLimitStatus(locationId)
console.log(`Requests: ${status.requestCount}/${status.remainingRequests}`)
console.log(`Window resets in: ${status.windowResetIn}ms`)

// Execute with custom concurrency
await ghl.client.batch(
  requests,
  locationId,
  5 // Max 5 concurrent requests
)
```

### Exponential Backoff

Rate limit errors are automatically retried with exponential backoff:
- 1st retry: 1 second
- 2nd retry: 2 seconds
- 3rd retry: 4 seconds
- 4th retry: 8 seconds
- 5th retry: 16 seconds

---

## Error Handling

### Error Types

```typescript
import { 
  GHLAPIException, 
  GHLRateLimitException, 
  GHLAuthException 
} from '@/lib/ghl'

try {
  const result = await ghl.contacts.create(data, locationId)
  
  if (result.error) {
    if (result.error.retryable) {
      // Transient error - safe to retry
      console.log('Retrying...')
    } else {
      // Permanent error - don't retry
      console.error('Permanent error:', result.error.message)
    }
  }
} catch (error) {
  if (error instanceof GHLAuthException) {
    // Token expired or invalid - re-authenticate
    console.error('Authentication failed')
  } else if (error instanceof GHLRateLimitException) {
    // Rate limit exceeded - automatic retry
    console.log('Rate limited, retrying...')
  }
}
```

### Response Pattern

All API methods return a consistent response structure:

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

---

## Webhook Integration

### Setup Webhook URL

In your GHL app settings, configure:
- **Webhook URL**: `https://your-domain.com/api/webhooks/ghl`
- **Events**: Select events you want to receive

### Handle Events

The webhook handler automatically:
- Verifies signatures
- Stores events in database
- Processes based on event type
- Marks as processed

### Custom Event Handlers

Add custom logic in `/api/webhooks/ghl/route.ts`:

```typescript
async function handleContactCreated(payload: any, locationId: string) {
  console.log('New contact:', payload.contact)
  
  // Your custom logic
  // - Send welcome email
  // - Add to CRM
  // - Trigger automation
}
```

### Supported Events

- `contact.created`
- `contact.updated`
- `contact.deleted`
- `opportunity.created`
- `opportunity.stage.updated`
- `message.inbound`
- `form.submitted`
- `workflow.completed`

---

## Database Schema

### Tables

**ghl_tokens** - Stores encrypted OAuth tokens
```sql
location_id | access_token | refresh_token | expires_at | ...
```

**ghl_locations** - Location metadata
```sql
location_id | company_id | name | email | connected_at | ...
```

**ghl_webhook_events** - Webhook event log
```sql
event_id | event_type | location_id | payload | processed | ...
```

**ghl_api_logs** - API request logs
```sql
endpoint | method | status_code | duration_ms | ...
```

**ghl_implementation_jobs** - Snapshot/config jobs
```sql
job_id | location_id | status | progress | ...
```

### Cleanup Functions

```sql
-- Run daily to cleanup old data
SELECT cleanup_old_webhook_events(); -- >30 days
SELECT cleanup_old_api_logs();       -- >7 days
SELECT cleanup_expired_tokens();     -- >90 days
```

---

## Best Practices

### 1. Always Set Location ID

```typescript
// Set default location for all operations
ghl.setLocationId(locationId)

// Or pass per operation
await ghl.contacts.list({}, locationId)
```

### 2. Handle Errors Gracefully

```typescript
const result = await ghl.contacts.create(data, locationId)

if (result.error) {
  if (result.error.retryable) {
    // Queue for retry
    await retryQueue.add({ operation: 'createContact', data })
  } else {
    // Log and alert
    console.error('Permanent error:', result.error)
    await notifyAdmin(result.error)
  }
  return
}

// Success
console.log('Contact created:', result.data.contact)
```

### 3. Use Batch Operations

```typescript
// Instead of individual requests
for (const contact of contacts) {
  await ghl.contacts.create(contact, locationId) // Slow
}

// Use bulk operation
await ghl.contacts.bulkCreate(contacts, locationId) // Fast
```

### 4. Monitor Rate Limits

```typescript
// Check before heavy operations
const status = ghl.getRateLimitStatus(locationId)

if (status.remainingRequests < 10) {
  console.log('Approaching rate limit, waiting...')
  await new Promise(resolve => 
    setTimeout(resolve, status.windowResetIn)
  )
}
```

### 5. Encrypt Sensitive Data

The TokenManager uses basic encryption. In production:

```typescript
// Use proper encryption library
import { encrypt, decrypt } from '@/lib/encryption'

// Encrypt before storing
const encrypted = encrypt(token, encryptionKey)

// Decrypt when retrieving
const token = decrypt(encrypted, encryptionKey)
```

---

## Examples

### Complete Sub-Account Setup

```typescript
async function setupNewLocation(data: {
  name: string
  email: string
  phone: string
  snapshotId: string
}) {
  // 1. Create sub-account
  const locationResult = await ghl.subaccounts.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: '123 Main St',
    city: 'City',
    state: 'State',
    country: 'US',
    postalCode: '12345',
  })

  if (locationResult.error) {
    throw new Error(`Failed to create location: ${locationResult.error.message}`)
  }

  const locationId = locationResult.data.location.id

  // 2. Apply snapshot
  const snapshotResult = await ghl.snapshots.apply(
    data.snapshotId,
    locationId
  )

  if (snapshotResult.error) {
    throw new Error(`Failed to apply snapshot: ${snapshotResult.error.message}`)
  }

  // 3. Poll for completion
  const status = await ghl.snapshots.pollStatus(
    snapshotResult.data.jobId,
    locationId,
    {
      maxAttempts: 60,
      intervalMs: 5000,
    }
  )

  if (status.error || status.data?.status !== 'completed') {
    throw new Error('Snapshot application failed')
  }

  // 4. Update branding
  await ghl.subaccounts.updateLogo(
    locationId,
    'https://example.com/logo.png'
  )

  // 5. Test connection
  const isConnected = await ghl.testConnection(locationId)

  return {
    locationId,
    name: data.name,
    ready: isConnected,
  }
}
```

### Sync Contacts from External CRM

```typescript
async function syncContacts(
  externalContacts: any[],
  locationId: string
) {
  const results = {
    created: 0,
    updated: 0,
    errors: 0,
  }

  for (const externalContact of externalContacts) {
    // Check if contact exists
    const existing = await ghl.contacts.getByEmail(
      externalContact.email,
      locationId
    )

    if (existing.data?.contact) {
      // Update existing contact
      const result = await ghl.contacts.update(
        existing.data.contact.id,
        {
          firstName: externalContact.firstName,
          lastName: externalContact.lastName,
          phone: externalContact.phone,
        },
        locationId
      )

      if (result.error) {
        results.errors++
      } else {
        results.updated++
      }
    } else {
      // Create new contact
      const result = await ghl.contacts.create(
        {
          firstName: externalContact.firstName,
          lastName: externalContact.lastName,
          email: externalContact.email,
          phone: externalContact.phone,
        },
        locationId
      )

      if (result.error) {
        results.errors++
      } else {
        results.created++
      }
    }
  }

  return results
}
```

---

## Support & Resources

- **GHL API Docs**: https://highlevel.stoplight.io/
- **OAuth 2.0 Spec**: https://oauth.net/2/
- **Supabase Docs**: https://supabase.com/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

---

## License

MIT
