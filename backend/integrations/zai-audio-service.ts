/**
 * GoHighLevel Snapshot Operations
 * Type-safe methods for snapshot management
 */

import { GHLClient } from '../client/GHLClient'
import {
  Snapshot,
  ApplySnapshotRequest,
  SnapshotStatus,
  GHLAPIResponse,
} from '../types'

export class SnapshotOperations {
  constructor(private client: GHLClient) {}

  /**
   * Get available snapshots for company
   */
  async list(
    companyId?: string
  ): Promise<GHLAPIResponse<{ snapshots: Snapshot[] }>> {
    const targetCompanyId = companyId || this.client.getCompanyId()
    
    if (!targetCompanyId) {
      return {
        error: {
          statusCode: 400,
          message: 'Company ID is required to list snapshots',
          retryable: false,
        },
      }
    }

    return this.client.get<{ snapshots: Snapshot[] }>(
      '/snapshots',
      { companyId: targetCompanyId }
    )
  }

  /**
   * Get snapshot by ID
   */
  async get(
    snapshotId: string
  ): Promise<GHLAPIResponse<{ snapshot: Snapshot }>> {
    return this.client.get<{ snapshot: Snapshot }>(
      `/snapshots/${snapshotId}`
    )
  }

  /**
   * Apply snapshot to location
   */
  async apply(
    snapshotId: string,
    locationId: string
  ): Promise<GHLAPIResponse<{ jobId: string; status: string }>> {
    return this.client.post<{ jobId: string; status: string }>(
      `/snapshots/${snapshotId}/push`,
      { locationId },
      locationId
    )
  }

  /**
   * Get snapshot status for a location
   */
  async getStatus(
    jobId: string,
    locationId: string
  ): Promise<GHLAPIResponse<SnapshotStatus>> {
    return this.client.get<SnapshotStatus>(
      `/snapshots/status/${jobId}`,
      undefined,
      locationId
    )
  }

  /**
   * Poll snapshot status until complete or failed
   */
  async pollStatus(
    jobId: string,
    locationId: string,
    options?: {
      maxAttempts?: number
      intervalMs?: number
      onProgress?: (status: SnapshotStatus) => void
    }
  ): Promise<GHLAPIResponse<SnapshotStatus>> {
    const maxAttempts = options?.maxAttempts || 60 // 5 minutes max
    const intervalMs = options?.intervalMs || 5000 // 5 seconds
    const onProgress = options?.onProgress

    let attempts = 0

    while (attempts < maxAttempts) {
      const response = await this.getStatus(jobId, locationId)

      if (response.error) {
        return response
      }

      const status = response.data!

      if (onProgress) {
        onProgress(status)
      }

      // Check if complete or failed
      if (status.status === 'completed') {
        return response
      }

      if (status.status === 'failed') {
        return {
          error: {
            statusCode: 500,
            message: status.error || 'Snapshot application failed',
            retryable: false,
          },
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs))
      attempts++
    }

    // Timeout
    return {
      error: {
        statusCode: 408,
        message: 'Snapshot application timeout - status polling exceeded max attempts',
        retryable: true,
      },
    }
  }

  /**
   * Create snapshot from location
   */
  async create(
    locationId: string,
    data: {
      name: string
      type?: 'location' | 'agency'
    }
  ): Promise<GHLAPIResponse<{ snapshot: Snapshot; jobId: string }>> {
    return this.client.post<{ snapshot: Snapshot; jobId: string }>(
      '/snapshots',
      {
        ...data,
        locationId,
      },
      locationId
    )
  }

  /**
   * Delete snapshot
   */
  async delete(
    snapshotId: string
  ): Promise<GHLAPIResponse<{ success: boolean }>> {
    return this.client.delete<{ success: boolean }>(
      `/snapshots/${snapshotId}`
    )
  }

  /**
   * Update snapshot metadata
   */
  async update(
    snapshotId: string,
    data: {
      name?: string
    }
  ): Promise<GHLAPIResponse<{ snapshot: Snapshot }>> {
    return this.client.put<{ snapshot: Snapshot }>(
      `/snapshots/${snapshotId}`,
      data
    )
  }

  /**
   * Share snapshot with another company
   */
  async share(
    snapshotId: string,
    targetCompanyId: string
  ): Promise<GHLAPIResponse<{ success: boolean }>> {
    return this.client.post<{ success: boolean }>(
      `/snapshots/${snapshotId}/share`,
      { targetCompanyId }
    )
  }

  /**
   * Unshare snapshot
   */
  async unshare(
    snapshotId: string,
    targetCompanyId: string
  ): Promise<GHLAPIResponse<{ success: boolean }>> {
    return this.client.delete<{ success: boolean }>(
      `/snapshots/${snapshotId}/share/${targetCompanyId}`
    )
  }

  /**
   * Get shared snapshots
   */
  async getShared(
    companyId?: string
  ): Promise<GHLAPIResponse<{ snapshots: Snapshot[] }>> {
    const targetCompanyId = companyId || this.client.getCompanyId()
    
    if (!targetCompanyId) {
      return {
        error: {
          statusCode: 400,
          message: 'Company ID is required',
          retryable: false,
        },
      }
    }

    return this.client.get<{ snapshots: Snapshot[] }>(
      '/snapshots/shared',
      { companyId: targetCompanyId }
    )
  }

  /**
   * Apply snapshot with customizations
   */
  async applyWithCustomizations(
    snapshotId: string,
    locationId: string,
    customizations: {
      branding?: {
        name?: string
        logoUrl?: string
        colors?: {
          primary?: string
          secondary?: string
        }
      }
      settings?: {
        timezone?: string
        phone?: string
        email?: string
      }
    }
  ): Promise<GHLAPIResponse<{ jobId: string; status: string }>> {
    return this.client.post<{ jobId: string; status: string }>(
      `/snapshots/${snapshotId}/push`,
      {
        locationId,
        customizations,
      },
      locationId
    )
  }

  /**
   * Get snapshot details including resources
   */
  async getDetails(
    snapshotId: string
  ): Promise<GHLAPIResponse<{
    snapshot: Snapshot
    resources: {
      workflows: number
      calendars: number
      forms: number
      pipelines: number
      campaigns: number
    }
  }>> {
    return this.client.get<{
      snapshot: Snapshot
      resources: {
        workflows: number
        calendars: number
        forms: number
        pipelines: number
        campaigns: number
      }
    }>(
      `/snapshots/${snapshotId}/details`
    )
  }
}
