/**
 * GoHighLevel Client Tests
 * Unit tests for GHL API client and operations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { GHLClient } from '../src/lib/ghl/client/GHLClient'
import { TokenManager } from '../src/lib/ghl/client/TokenManager'
import { RateLimiter } from '../src/lib/ghl/client/RateLimiter'

// Mock TokenManager
const mockTokenManager = {
  getAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
  storeTokens: jest.fn().mockResolvedValue(undefined),
  refreshAccessToken: jest.fn().mockResolvedValue('mock-refreshed-token'),
} as unknown as TokenManager

// Mock RateLimiter
const mockRateLimiter = {
  execute: jest.fn().mockImplementation((key, fn) => fn()),
  getStatus: jest.fn().mockReturnValue({
    requestCount: 0,
    remainingRequests: 100,
    windowResetIn: 60000,
  }),
} as unknown as RateLimiter

describe('GHLClient', () => {
  let client: GHLClient

  beforeEach(() => {
    client = new GHLClient(mockTokenManager, mockRateLimiter, {
      locationId: 'test-location-id',
    })
    jest.clearAllMocks()
  })

  describe('request', () => {
    it('should make successful GET request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: 'test' }),
      }) as any

      const result = await client.get('/test-endpoint')

      expect(result.data).toBeDefined()
      expect(result.error).toBeUndefined()
      expect(mockTokenManager.getAccessToken).toHaveBeenCalled()
    })

    it('should handle 401 errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      }) as any

      const result = await client.get('/test-endpoint')

      expect(result.error).toBeDefined()
      expect(result.error?.statusCode).toBe(401)
    })

    it('should handle rate limit errors with retry', async () => {
      let callCount = 0
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Map([['Retry-After', '1']]),
            text: async () => 'Rate limit exceeded',
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ data: 'success' }),
        })
      }) as any

      const result = await client.get('/test-endpoint')

      expect(result.data).toBeDefined()
      expect(callCount).toBeGreaterThan(1)
    })

    it('should build URL with query parameters', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: 'test' }),
      }) as any

      await client.get('/test-endpoint', {
        page: 1,
        limit: 10,
        tags: ['tag1', 'tag2'],
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0]
      expect(fetchCall).toContain('page=1')
      expect(fetchCall).toContain('limit=10')
      expect(fetchCall).toContain('tags=tag1')
      expect(fetchCall).toContain('tags=tag2')
    })
  })

  describe('POST request', () => {
    it('should send POST request with body', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ data: 'created' }),
      }) as any

      const body = { name: 'Test', email: 'test@example.com' }
      const result = await client.post('/test-endpoint', body)

      expect(result.data).toBeDefined()
      
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const options = fetchCall[1]
      expect(options.method).toBe('POST')
      expect(options.body).toBe(JSON.stringify(body))
    })
  })

  describe('batch', () => {
    it('should execute multiple requests with rate limiting', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: 'test' }),
      }) as any

      const requests = Array.from({ length: 5 }, (_, i) => ({
        method: 'GET' as const,
        endpoint: `/test-${i}`,
      }))

      const results = await client.batch(requests, 'test-location-id', 2)

      expect(results).toHaveLength(5)
      expect(mockRateLimiter.execute).toHaveBeenCalled()
    })
  })

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ locations: [] }),
      }) as any

      const result = await client.testConnection()

      expect(result).toBe(true)
    })

    it('should return false for failed connection', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Error',
      }) as any

      const result = await client.testConnection()

      expect(result).toBe(false)
    })
  })
})

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequestsPerMinute: 5,
      retryDelays: [100, 200],
      maxRetries: 2,
    })
  })

  it('should execute request within rate limit', async () => {
    const mockRequest = jest.fn().mockResolvedValue('success')

    const result = await rateLimiter.execute('test-key', mockRequest)

    expect(result).toBe('success')
    expect(mockRequest).toHaveBeenCalledTimes(1)
  })

  it('should wait when rate limit is reached', async () => {
    const mockRequest = jest.fn().mockResolvedValue('success')

    // Execute 6 requests (limit is 5)
    const promises = Array.from({ length: 6 }, () =>
      rateLimiter.execute('test-key', mockRequest)
    )

    await Promise.all(promises)

    // Should have executed all requests
    expect(mockRequest).toHaveBeenCalledTimes(6)
  })

  it('should retry on transient errors', async () => {
    let callCount = 0
    const mockRequest = jest.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        const error: any = new Error('Server error')
        error.statusCode = 500
        throw error
      }
      return Promise.resolve('success')
    })

    const result = await rateLimiter.execute('test-key', mockRequest)

    expect(result).toBe('success')
    expect(mockRequest).toHaveBeenCalledTimes(2)
  })

  it('should provide accurate rate limit status', () => {
    const mockRequest = jest.fn().mockResolvedValue('success')

    rateLimiter.execute('test-key', mockRequest)
    rateLimiter.execute('test-key', mockRequest)

    const status = rateLimiter.getStatus('test-key')

    expect(status).toBeDefined()
    expect(status!.requestCount).toBe(2)
    expect(status!.remainingRequests).toBe(3)
  })
})

describe('ContactOperations', () => {
  let client: GHLClient

  beforeEach(() => {
    client = new GHLClient(mockTokenManager, mockRateLimiter, {
      locationId: 'test-location-id',
    })
  })

  it('should create contact', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({
        contact: {
          id: 'contact-id',
          email: 'test@example.com',
          firstName: 'Test',
        },
      }),
    }) as any

    const contacts = client.contacts = {
      create: async (data: any) => client.post('/contacts', data),
    } as any

    const result = await contacts.create({
      firstName: 'Test',
      email: 'test@example.com',
    })

    expect(result.data).toBeDefined()
    expect(result.data.contact.email).toBe('test@example.com')
  })
})
