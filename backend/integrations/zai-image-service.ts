/**
 * GoHighLevel Workflow Operations
 * Type-safe methods for workflow management
 */

import { GHLClient } from '../client/GHLClient'
import {
  Workflow,
  CreateWorkflowRequest,
  GHLAPIResponse,
} from '../types'

export class WorkflowOperations {
  constructor(private client: GHLClient) {}

  /**
   * List all workflows for a location
   */
  async list(
    locationId?: string
  ): Promise<GHLAPIResponse<{ workflows: Workflow[] }>> {
    return this.client.get<{ workflows: Workflow[] }>(
      '/workflows',
      undefined,
      locationId
    )
  }

  /**
   * Get workflow by ID
   */
  async get(
    workflowId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ workflow: Workflow }>> {
    return this.client.get<{ workflow: Workflow }>(
      `/workflows/${workflowId}`,
      undefined,
      locationId
    )
  }

  /**
   * Create a new workflow
   */
  async create(
    data: CreateWorkflowRequest,
    locationId?: string
  ): Promise<GHLAPIResponse<{ workflow: Workflow }>> {
    return this.client.post<{ workflow: Workflow }>(
      '/workflows',
      data,
      locationId
    )
  }

  /**
   * Update workflow
   */
  async update(
    workflowId: string,
    data: Partial<CreateWorkflowRequest>,
    locationId?: string
  ): Promise<GHLAPIResponse<{ workflow: Workflow }>> {
    return this.client.put<{ workflow: Workflow }>(
      `/workflows/${workflowId}`,
      data,
      locationId
    )
  }

  /**
   * Delete workflow
   */
  async delete(
    workflowId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ success: boolean }>> {
    return this.client.delete<{ success: boolean }>(
      `/workflows/${workflowId}`,
      locationId
    )
  }

  /**
   * Publish workflow
   */
  async publish(
    workflowId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ workflow: Workflow }>> {
    return this.client.patch<{ workflow: Workflow }>(
      `/workflows/${workflowId}/publish`,
      {},
      locationId
    )
  }

  /**
   * Unpublish workflow
   */
  async unpublish(
    workflowId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ workflow: Workflow }>> {
    return this.client.patch<{ workflow: Workflow }>(
      `/workflows/${workflowId}/unpublish`,
      {},
      locationId
    )
  }

  /**
   * Clone workflow
   */
  async clone(
    workflowId: string,
    newName: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ workflow: Workflow }>> {
    return this.client.post<{ workflow: Workflow }>(
      `/workflows/${workflowId}/clone`,
      { name: newName },
      locationId
    )
  }
}
