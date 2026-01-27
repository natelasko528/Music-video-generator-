/**
 * GoHighLevel API Client
 * Main client class with type-safe methods for all 77 endpoints
 */

import { RateLimiter } from './RateLimiter'
import { TokenManager } from './TokenManager'
import {
  GHLClientConfig,
  APIRequestConfig,
  GHLAPIResponse,
  GHLAPIError,
  GHLAPIException,
  GHLAuthException,
  GHLRateLimitException,
  LogContext,
} from '../types'

export class GHLClient {
  private tokenManager: TokenManager
  private rateLimiter: RateLimiter
  private config: Required<GHLClientConfig>
  private baseUrl: string

  constructor(
    tokenManager: TokenManager,
    rateLimiter?: RateLimiter,
    config?: GHLClientConfig
  ) {
    this.tokenManager = tokenManager
    this.rateLimiter = rateLimiter || new RateLimiter()
    this.config = {
      locationId: config?.locationId || '',
      companyId: config?.companyId || '',
      version: config?.version || 'v1',
      baseUrl: config?.baseUrl || 'https://services.leadconnectorhq.com',
      timeout: config?.timeout || 30000,
      retryConfig: config?.retryConfig || {
        maxRequestsPerMinute: 100,
        retryDelays: [1000, 2000, 4000, 8000, 16000],
        maxRetries: 5,
      },
    }
    this.baseUrl = `${this.config.baseUrl}`
  }

  /**
   * Make an authenticated API request
   */
  async request<T>(
    requestConfig: APIRequestConfig,
    locationId?: string
  ): Promise<GHLAPIResponse<T>> {
    const targetLocationId = locationId || this.config.locationId

    if (!targetLocationId) {
      throw new Error('Location ID is required for API requests')
    }

    const startTime = Date.now()
    const logContext: LogContext = {
      locationId: targetLocationId,
      endpoint: requestConfig.endpoint,
      method: requestConfig.method,
    }

    try {
      // Get access token
      const accessToken = await this.tokenManager.getAccessToken(targetLocationId)

      // Build URL
      const url = this.buildUrl(requestConfig.endpoint, requestConfig.params)

      // Prepare headers
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Version: '2021-07-28',
        ...requestConfig.headers,
      }

      // Execute request with rate limiting
      const executeRequest = async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        try {
          const response = await fetch(url, {
            method: requestConfig.method,
            headers,
            body: requestConfig.body ? JSON.stringify(requestConfig.body) : undefined,
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          const duration = Date.now() - startTime
          logContext.duration = duration
          logContext.statusCode = response.status

          // Handle different response status codes
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After')
            throw new GHLRateLimitException(
              retryAfter ? parseInt(retryAfter) : undefined,
              'Rate limit exceeded'
            )
          }

          if (response.status === 401) {
            throw new GHLAuthException('Unauthorized - token may be invalid or expired')
          }

          if (!response.ok) {
            const errorText = await response.text()
            let errorData: any
            try {
              errorData = JSON.parse(errorText)
            } catch {
              errorData = { message: errorText }
            }

            const isRetryable = [500, 502, 503, 504, 408].includes(response.status)

            throw new GHLAPIException(
              response.status,
              errorData.message || `API request failed with status ${response.status}`,
              errorData.code,
              isRetryable,
              errorData
            )
          }

          // Parse response
          const responseText = await response.text()
          let data: T
          try {
            data = responseText ? JSON.parse(responseText) : ({} as T)
          } catch {
            data = responseText as any
          }

          this.log('info', 'API request successful', {
            ...logContext,
            statusCode: response.status,
          })

          return { data } as GHLAPIResponse<T>
        } catch (error: any) {
          if (error.name === 'AbortError') {
            throw new GHLAPIException(
              408,
              'Request timeout',
              'TIMEOUT',
              true
            )
          }
          throw error
        } finally {
          clearTimeout(timeoutId)
        }
      }

      // Execute with rate limiting (unless skipped)
      if (requestConfig.skipRateLimit) {
        return await executeRequest()
      } else {
        return await this.rateLimiter.execute(
          targetLocationId,
          executeRequest
        )
      }
    } catch (error: any) {
      logContext.error = error
      logContext.duration = Date.now() - startTime

      this.log('error', 'API request failed', logContext)

      // Return structured error
      return {
        error: {
          statusCode: error.statusCode || 500,
          message: error.message || 'Unknown error',
          code: error.code,
          retryable: error.retryable || false,
          details: error.details,
        },
      } as GHLAPIResponse<T>
    }
  }

  /**
   * GET request helper
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    locationId?: string
  ): Promise<GHLAPIResponse<T>> {
    return this.request<T>(
      {
        method: 'GET',
        endpoint,
        params,
      },
      locationId
    )
  }

  /**
   * POST request helper
   */
  async post<T>(
    endpoint: string,
    body?: any,
    locationId?: string
  ): Promise<GHLAPIResponse<T>> {
    return this.request<T>(
      {
        method: 'POST',
        endpoint,
        body,
      },
      locationId
    )
  }

  /**
   * PUT request helper
   */
  async put<T>(
    endpoint: string,
    body?: any,
    locationId?: string
  ): Promise<GHLAPIResponse<T>> {
    return this.request<T>(
      {
        method: 'PUT',
        endpoint,
        body,
      },
      locationId
    )
  }

  /**
   * PATCH request helper
   */
  async patch<T>(
    endpoint: string,
    body?: any,
    locationId?: string
  ): Promise<GHLAPIResponse<T>> {
    return this.request<T>(
      {
        method: 'PATCH',
        endpoint,
        body,
      },
      locationId
    )
  }

  /**
   * DELETE request helper
   */
  async delete<T>(
    endpoint: string,
    locationId?: string
  ): Promise<GHLAPIResponse<T>> {
    return this.request<T>(
      {
        method: 'DELETE',
        endpoint,
      },
      locationId
    )
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

    const url = new URL(`${this.baseUrl}/${cleanEndpoint}`)

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key]
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => url.searchParams.append(key, String(v)))
          } else {
            url.searchParams.append(key, String(value))
          }
        }
      })
    }

    return url.toString()
  }

  /**
   * Test connection to GHL API
   */
  async testConnection(locationId?: string): Promise<boolean> {
    try {
      const response = await this.get<any>(
        '/locations',
        undefined,
        locationId
      )
      return !response.error
    } catch (error) {
      return false
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(locationId?: string) {
    const targetLocationId = locationId || this.config.locationId
    if (!targetLocationId) {
      throw new Error('Location ID is required')
    }
    return this.rateLimiter.getStatus(targetLocationId)
  }

  /**
   * Set default location ID for requests
   */
  setLocationId(locationId: string): void {
    this.config.locationId = locationId
  }

  /**
   * Get current location ID
   */
  getLocationId(): string {
    return this.config.locationId
  }

  /**
   * Set default company ID
   */
  setCompanyId(companyId: string): void {
    this.config.companyId = companyId
  }

  /**
   * Get current company ID
   */
  getCompanyId(): string {
    return this.config.companyId
  }

  /**
   * Log helper
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [GHLClient] [${level.toUpperCase()}] ${message}`

    if (context) {
      console[level](logMessage, context)
    } else {
      console[level](logMessage)
    }
  }

  /**
   * Execute multiple requests in parallel with rate limiting
   */
  async batch<T>(
    requests: Array<APIRequestConfig>,
    locationId?: string,
    concurrency: number = 5
  ): Promise<Array<GHLAPIResponse<T>>> {
    const targetLocationId = locationId || this.config.locationId

    if (!targetLocationId) {
      throw new Error('Location ID is required for batch requests')
    }

    const requestFunctions = requests.map(
      (config) => () => this.request<T>(config, targetLocationId)
    )

    return this.rateLimiter.executeParallel(
      targetLocationId,
      requestFunctions,
      concurrency
    )
  }

  /**
   * Upload file (multipart/form-data)
   */
  async uploadFile(
    endpoint: string,
    file: File | Buffer,
    fileName: string,
    additionalFields?: Record<string, string>,
    locationId?: string
  ): Promise<GHLAPIResponse<any>> {
    const targetLocationId = locationId || this.config.locationId

    if (!targetLocationId) {
      throw new Error('Location ID is required for file uploads')
    }

    const accessToken = await this.tokenManager.getAccessToken(targetLocationId)

    const formData = new FormData()
    formData.append('file', file, fileName)

    if (additionalFields) {
      Object.keys(additionalFields).forEach((key) => {
        formData.append(key, additionalFields[key])
      })
    }

    const url = this.buildUrl(endpoint)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: '2021-07-28',
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new GHLAPIException(
          response.status,
          `File upload failed: ${errorText}`,
          undefined,
          false
        )
      }

      const data = await response.json()
      return { data }
    } catch (error: any) {
      return {
        error: {
          statusCode: error.statusCode || 500,
          message: error.message || 'File upload failed',
          code: error.code,
          retryable: false,
        },
      }
    }
  }
}
