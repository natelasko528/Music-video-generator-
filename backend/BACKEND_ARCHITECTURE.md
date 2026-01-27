# GoHighLevel API Client - Quick Reference

## 🚀 Quick Start

```typescript
import { createGHLClientFromEnv } from '@/lib/ghl'

const ghl = createGHLClientFromEnv()
ghl.setLocationId('your-location-id')
```

---

## 📞 Contacts

```typescript
// Create
await ghl.contacts.create({ 
  firstName: 'John', 
  email: 'john@example.com' 
}, locationId)

// Get by ID
await ghl.contacts.get(contactId, locationId)

// Get by email
await ghl.contacts.getByEmail('john@example.com', locationId)

// Update
await ghl.contacts.update(contactId, { firstName: 'Jane' }, locationId)

// Delete
await ghl.contacts.delete(contactId, locationId)

// Upsert (create or update)
await ghl.contacts.upsert({ 
  email: 'john@example.com',
  firstName: 'John' 
}, locationId)

// Add tags
await ghl.contacts.addTags(contactId, ['vip', 'priority'], locationId)

// Remove tags
await ghl.contacts.removeTags(contactId, ['old-tag'], locationId)

// List with pagination
await ghl.contacts.list({ 
  limit: 100, 
  skip: 0 
}, locationId)

// Bulk create
await ghl.contacts.bulkCreate([
  { email: '1@ex.com', firstName: 'User1' },
  { email: '2@ex.com', firstName: 'User2' }
], locationId)

// Get tasks
await ghl.contacts.getTasks(contactId, locationId)

// Get notes
await ghl.contacts.getNotes(contactId, locationId)

// Add to campaign
await ghl.contacts.addToCampaign(contactId, campaignId, locationId)
```

---

## 🏢 Sub-Accounts (Locations)

```typescript
// Create
await ghl.subaccounts.create({
  name: 'New Location',
  email: 'contact@location.com',
  phone: '+1234567890',
  address: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  country: 'US',
  postalCode: '94102',
  timezone: 'America/Los_Angeles'
}, companyId)

// Get by ID
await ghl.subaccounts.get(locationId)

// Update
await ghl.subaccounts.update(locationId, { 
  name: 'Updated Name' 
})

// Update logo
await ghl.subaccounts.updateLogo(
  locationId, 
  'https://example.com/logo.png'
)

// Update settings
await ghl.subaccounts.updateSettings(locationId, {
  allowDuplicateContact: false,
  allowDuplicateOpportunity: false
})

// List all
await ghl.subaccounts.list({ companyId })

// Search
await ghl.subaccounts.search('search-term', companyId)

// Clone
await ghl.subaccounts.clone(sourceLocationId, {
  name: 'Cloned Location'
})
```

---

## 📸 Snapshots

```typescript
// List available
await ghl.snapshots.list(companyId)

// Get by ID
await ghl.snapshots.get(snapshotId)

// Apply to location
const result = await ghl.snapshots.apply(snapshotId, locationId)
const jobId = result.data.jobId

// Poll status
await ghl.snapshots.pollStatus(jobId, locationId, {
  maxAttempts: 60,
  intervalMs: 5000,
  onProgress: (status) => {
    console.log(`Progress: ${status.progress}%`)
  }
})

// Apply with customizations
await ghl.snapshots.applyWithCustomizations(
  snapshotId,
  locationId,
  {
    branding: {
      name: 'Custom Name',
      logoUrl: 'https://example.com/logo.png',
      colors: {
        primary: '#007bff',
        secondary: '#6c757d'
      }
    },
    settings: {
      timezone: 'America/New_York',
      phone: '+1234567890'
    }
  }
)

// Create snapshot
await ghl.snapshots.create(locationId, {
  name: 'My Snapshot',
  type: 'location'
})

// Share snapshot
await ghl.snapshots.share(snapshotId, targetCompanyId)
```

---

## 🔄 Workflows

```typescript
// List all
await ghl.workflows.list(locationId)

// Get by ID
await ghl.workflows.get(workflowId, locationId)

// Create
await ghl.workflows.create({
  name: 'New Workflow',
  status: 'draft'
}, locationId)

// Update
await ghl.workflows.update(workflowId, {
  name: 'Updated Name'
}, locationId)

// Publish
await ghl.workflows.publish(workflowId, locationId)

// Unpublish
await ghl.workflows.unpublish(workflowId, locationId)

// Clone
await ghl.workflows.clone(
  workflowId, 
  'Copy of Workflow', 
  locationId
)

// Delete
await ghl.workflows.delete(workflowId, locationId)
```

---

## 🔐 OAuth Flow

```typescript
// Step 1: Get authorization URL (Frontend)
const response = await fetch('/api/auth/ghl/authorize')
const { authorizationUrl } = await response.json()
window.location.href = authorizationUrl

// Step 2: User authorizes in GHL (automatic)

// Step 3: Callback receives code and exchanges for tokens (automatic)

// Step 4: Start using API
const ghl = createGHLClientFromEnv()
const isConnected = await ghl.testConnection(locationId)
```

---

## 📊 Rate Limiting

```typescript
// Check status
const status = ghl.getRateLimitStatus(locationId)
console.log(`${status.requestCount}/${status.remainingRequests} requests`)
console.log(`Resets in ${status.windowResetIn}ms`)

// Automatic handling (no manual intervention needed)
const promises = Array(150).fill(0).map((_, i) => 
  ghl.contacts.get(`contact-${i}`, locationId)
)
await Promise.all(promises) // Automatically rate limited

// Batch with custom concurrency
await ghl.client.batch(
  requests,
  locationId,
  5 // Max 5 concurrent
)
```

---

## ❌ Error Handling

```typescript
const result = await ghl.contacts.create(data, locationId)

// Check for errors
if (result.error) {
  console.error('Error:', result.error.message)
  
  if (result.error.retryable) {
    // Transient error - retry later
    console.log('Retrying...')
  } else {
    // Permanent error - log and alert
    console.error('Permanent error')
  }
  return
}

// Success
const contact = result.data.contact
console.log('Created:', contact.id)
```

### Response Structure

```typescript
interface GHLAPIResponse<T> {
  data?: T                // Success data
  error?: {
    statusCode: number    // HTTP status
    message: string       // Error message
    code?: string         // Error code
    retryable: boolean    // Can retry?
    details?: any         // Extra info
  }
}
```

---

## 🪝 Webhooks

### Setup
1. Set webhook URL: `https://your-domain.com/api/webhooks/ghl`
2. Set secret: `GHL_WEBHOOK_SECRET` in env

### Custom Handlers

Edit `/api/webhooks/ghl/route.ts`:

```typescript
async function handleContactCreated(payload: any, locationId: string) {
  const contact = payload.contact
  
  // Your logic here
  await sendWelcomeEmail(contact.email)
  await addToCRM(contact)
}
```

### Event Types
- `contact.created` / `updated` / `deleted`
- `opportunity.created` / `stage.updated`
- `message.inbound` / `outbound`
- `form.submitted`
- `workflow.completed`
- `appointment.created`
- `task.created`

---

## 🧪 Testing

```typescript
// Test connection
const isConnected = await ghl.testConnection(locationId)

// Test with mock data
const result = await ghl.contacts.create({
  firstName: 'Test',
  email: 'test@example.com'
}, locationId)

if (result.error) {
  console.error('Test failed:', result.error)
} else {
  console.log('Test passed:', result.data.contact.id)
}
```

---

## 🔧 Configuration

### Environment Variables

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
GHL_CLIENT_ID=your-client-id
GHL_CLIENT_SECRET=your-client-secret
GHL_REDIRECT_URI=https://your-domain.com/api/auth/ghl/callback

# Optional
GHL_SCOPES=contacts.write locations.write
GHL_WEBHOOK_SECRET=your-webhook-secret
```

### Manual Configuration

```typescript
import { createGHLClient } from '@/lib/ghl'

const ghl = createGHLClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  clientId: process.env.GHL_CLIENT_ID!,
  clientSecret: process.env.GHL_CLIENT_SECRET!,
  locationId: 'default-location-id',
  companyId: 'default-company-id'
})
```

---

## 📦 Import Paths

```typescript
// Main client
import { createGHLClientFromEnv, createGHLClient } from '@/lib/ghl'

// Types
import type { 
  Contact,
  SubAccount,
  Snapshot,
  Workflow,
  GHLAPIResponse 
} from '@/lib/ghl'

// Exceptions
import { 
  GHLAPIException,
  GHLAuthException,
  GHLRateLimitException 
} from '@/lib/ghl'
```

---

## 🎯 Common Patterns

### Complete Sub-Account Setup

```typescript
async function setupLocation(data: {
  name: string
  email: string
  snapshotId: string
}) {
  // 1. Create location
  const location = await ghl.subaccounts.create({ ...data })
  const locationId = location.data.location.id
  
  // 2. Apply snapshot
  const job = await ghl.snapshots.apply(data.snapshotId, locationId)
  
  // 3. Wait for completion
  await ghl.snapshots.pollStatus(job.data.jobId, locationId)
  
  // 4. Update branding
  await ghl.subaccounts.updateLogo(locationId, 'logo.png')
  
  return locationId
}
```

### Sync Contacts

```typescript
async function syncContacts(contacts: any[], locationId: string) {
  for (const contact of contacts) {
    await ghl.contacts.upsert({
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName
    }, locationId)
  }
}
```

### Bulk Operations

```typescript
async function bulkCreate(data: any[], locationId: string) {
  // Create in batches of 50
  const batches = chunk(data, 50)
  
  for (const batch of batches) {
    await ghl.contacts.bulkCreate(batch, locationId)
  }
}
```

---

## 🔍 Debugging

```typescript
// Enable debug logging (add to client)
const ghl = createGHLClient({
  ...config,
  debug: true // Logs all requests/responses
})

// Check rate limit status
const status = ghl.getRateLimitStatus(locationId)
console.log('Rate limit:', status)

// Test connection
const connected = await ghl.testConnection(locationId)
console.log('Connected:', connected)

// View token metadata (no decryption)
const metadata = await tokenManager.getTokenMetadata(locationId)
console.log('Token expires:', metadata.expiresAt)
```

---

## 📚 Documentation

- **Full Guide**: `GHL_INTEGRATION_GUIDE.md`
- **README**: `README_GHL_INTEGRATION.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`
- **This File**: `QUICK_REFERENCE.md`

---

## 🆘 Common Issues

### "Location ID is required"
```typescript
// Set default location
ghl.setLocationId('your-location-id')

// Or pass per operation
await ghl.contacts.create(data, 'specific-location-id')
```

### "Token expired"
```typescript
// Tokens refresh automatically
// If manual refresh needed:
await tokenManager.forceRefresh(locationId)
```

### "Rate limit exceeded"
```typescript
// Wait for window to reset
const status = ghl.getRateLimitStatus(locationId)
await sleep(status.windowResetIn)
```

### "OAuth failed"
```typescript
// Check environment variables
console.log('Client ID:', process.env.GHL_CLIENT_ID)
console.log('Redirect URI:', process.env.GHL_REDIRECT_URI)

// Verify redirect URI matches GHL app settings
```

---

**Need more help? See full documentation or create an issue.**
