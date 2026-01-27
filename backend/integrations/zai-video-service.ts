/**
 * GoHighLevel Sub-Account (Location) Operations
 * Type-safe methods for location management
 */

import { GHLClient } from '../client/GHLClient'
import {
  SubAccount,
  CreateSubAccountRequest,
  UpdateSubAccountRequest,
  GHLAPIResponse,
} from '../types'

export class SubAccountOperations {
  constructor(private client: GHLClient) {}

  /**
   * Create a new sub-account (location)
   */
  async create(
    data: CreateSubAccountRequest,
    companyId?: string
  ): Promise<GHLAPIResponse<{ location: SubAccount }>> {
    const targetCompanyId = companyId || this.client.getCompanyId()
    
    if (!targetCompanyId) {
      return {
        error: {
          statusCode: 400,
          message: 'Company ID is required to create a sub-account',
          retryable: false,
        },
      }
    }

    return this.client.post<{ location: SubAccount }>(
      '/locations',
      {
        ...data,
        companyId: targetCompanyId,
      }
    )
  }

  /**
   * Get sub-account by ID
   */
  async get(
    locationId: string
  ): Promise<GHLAPIResponse<{ location: SubAccount }>> {
    return this.client.get<{ location: SubAccount }>(
      `/locations/${locationId}`
    )
  }

  /**
   * Update sub-account
   */
  async update(
    locationId: string,
    data: UpdateSubAccountRequest
  ): Promise<GHLAPIResponse<{ location: SubAccount }>> {
    return this.client.put<{ location: SubAccount }>(
      `/locations/${locationId}`,
      data
    )
  }

  /**
   * Delete sub-account
   */
  async delete(
    locationId: string
  ): Promise<GHLAPIResponse<{ success: boolean }>> {
    return this.client.delete<{ success: boolean }>(
      `/locations/${locationId}`
    )
  }

  /**
   * List all sub-accounts for a company
   */
  async list(
    options?: {
      companyId?: string
      limit?: number
      skip?: number
    }
  ): Promise<GHLAPIResponse<{ locations: SubAccount[]; total: number }>> {
    const companyId = options?.companyId || this.client.getCompanyId()
    
    if (!companyId) {
      return {
        error: {
          statusCode: 400,
          message: 'Company ID is required to list sub-accounts',
          retryable: false,
        },
      }
    }

    return this.client.get<{ locations: SubAccount[]; total: number }>(
      '/locations',
      {
        companyId,
        limit: options?.limit,
        skip: options?.skip,
      }
    )
  }

  /**
   * Search sub-accounts by name
   */
  async search(
    query: string,
    companyId?: string
  ): Promise<GHLAPIResponse<{ locations: SubAccount[] }>> {
    const targetCompanyId = companyId || this.client.getCompanyId()
    
    if (!targetCompanyId) {
      return {
        error: {
          statusCode: 400,
          message: 'Company ID is required to search sub-accounts',
          retryable: false,
        },
      }
    }

    return this.client.get<{ locations: SubAccount[] }>(
      '/locations/search',
      {
        companyId: targetCompanyId,
        query,
      }
    )
  }

  /**
   * Update sub-account branding (logo)
   */
  async updateLogo(
    locationId: string,
    logoUrl: string
  ): Promise<GHLAPIResponse<{ location: SubAccount }>> {
    return this.update(locationId, { logoUrl })
  }

  /**
   * Get sub-account custom values
   */
  async getCustomValues(
    locationId: string
  ): Promise<GHLAPIResponse<{ customValues: Record<string, any> }>> {
    return this.client.get<{ customValues: Record<string, any> }>(
      `/locations/${locationId}/customValues`
    )
  }

  /**
   * Update sub-account custom values
   */
  async updateCustomValues(
    locationId: string,
    customValues: Record<string, any>
  ): Promise<GHLAPIResponse<{ customValues: Record<string, any> }>> {
    return this.client.put<{ customValues: Record<string, any> }>(
      `/locations/${locationId}/customValues`,
      { customValues }
    )
  }

  /**
   * Get sub-account tags
   */
  async getTags(
    locationId: string
  ): Promise<GHLAPIResponse<{ tags: any[] }>> {
    return this.client.get<{ tags: any[] }>(
      `/locations/${locationId}/tags`
    )
  }

  /**
   * Get sub-account custom fields
   */
  async getCustomFields(
    locationId: string
  ): Promise<GHLAPIResponse<{ customFields: any[] }>> {
    return this.client.get<{ customFields: any[] }>(
      `/locations/${locationId}/customFields`
    )
  }

  /**
   * Get sub-account templates
   */
  async getTemplates(
    locationId: string
  ): Promise<GHLAPIResponse<{ templates: any[] }>> {
    return this.client.get<{ templates: any[] }>(
      `/locations/${locationId}/templates`
    )
  }

  /**
   * Get sub-account timezones
   */
  async getTimezones(): Promise<GHLAPIResponse<{ timezones: string[] }>> {
    return this.client.get<{ timezones: string[] }>(
      '/locations/timezones'
    )
  }

  /**
   * Update sub-account settings
   */
  async updateSettings(
    locationId: string,
    settings: {
      allowDuplicateContact?: boolean
      allowDuplicateOpportunity?: boolean
      allowFacebookNameMerge?: boolean
      disableContactTimezone?: boolean
    }
  ): Promise<GHLAPIResponse<{ location: SubAccount }>> {
    return this.update(locationId, { settings })
  }

  /**
   * Enable/disable sub-account
   */
  async setActive(
    locationId: string,
    active: boolean
  ): Promise<GHLAPIResponse<{ location: SubAccount }>> {
    return this.client.patch<{ location: SubAccount }>(
      `/locations/${locationId}`,
      { active }
    )
  }

  /**
   * Get sub-account snapshot status
   */
  async getSnapshotStatus(
    locationId: string
  ): Promise<GHLAPIResponse<{ status: string; progress: number }>> {
    return this.client.get<{ status: string; progress: number }>(
      `/locations/${locationId}/snapshot-status`
    )
  }

  /**
   * Rebuild sub-account
   */
  async rebuild(
    locationId: string,
    options?: {
      rebuildMemberships?: boolean
      rebuildSnapshots?: boolean
    }
  ): Promise<GHLAPIResponse<{ success: boolean; jobId: string }>> {
    return this.client.post<{ success: boolean; jobId: string }>(
      `/locations/${locationId}/rebuild`,
      options
    )
  }

  /**
   * Clone sub-account
   */
  async clone(
    sourceLocationId: string,
    data: {
      name: string
      companyId?: string
    }
  ): Promise<GHLAPIResponse<{ location: SubAccount; jobId: string }>> {
    return this.client.post<{ location: SubAccount; jobId: string }>(
      `/locations/${sourceLocationId}/clone`,
      data
    )
  }

  /**
   * Get sub-account tasks summary
   */
  async getTasksSummary(
    locationId: string
  ): Promise<GHLAPIResponse<{ 
    total: number
    completed: number
    pending: number
    overdue: number
  }>> {
    return this.client.get<{ 
      total: number
      completed: number
      pending: number
      overdue: number
    }>(
      `/locations/${locationId}/tasks/summary`
    )
  }
}
