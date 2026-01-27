/**
 * GoHighLevel Contact Operations
 * Type-safe methods for contact management
 */

import { GHLClient } from '../client/GHLClient'
import {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  UpsertContactRequest,
  GHLAPIResponse,
} from '../types'

export class ContactOperations {
  constructor(private client: GHLClient) {}

  /**
   * Create a new contact
   */
  async create(
    data: CreateContactRequest,
    locationId?: string
  ): Promise<GHLAPIResponse<{ contact: Contact }>> {
    return this.client.post<{ contact: Contact }>(
      '/contacts',
      data,
      locationId
    )
  }

  /**
   * Get contact by ID
   */
  async get(
    contactId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ contact: Contact }>> {
    return this.client.get<{ contact: Contact }>(
      `/contacts/${contactId}`,
      undefined,
      locationId
    )
  }

  /**
   * Update contact
   */
  async update(
    contactId: string,
    data: Partial<UpdateContactRequest>,
    locationId?: string
  ): Promise<GHLAPIResponse<{ contact: Contact }>> {
    return this.client.put<{ contact: Contact }>(
      `/contacts/${contactId}`,
      data,
      locationId
    )
  }

  /**
   * Delete contact
   */
  async delete(
    contactId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ success: boolean }>> {
    return this.client.delete<{ success: boolean }>(
      `/contacts/${contactId}`,
      locationId
    )
  }

  /**
   * List contacts with pagination
   */
  async list(
    options?: {
      limit?: number
      skip?: number
      query?: string
      startAfter?: number
      startAfterId?: string
    },
    locationId?: string
  ): Promise<GHLAPIResponse<{ contacts: Contact[]; total: number }>> {
    return this.client.get<{ contacts: Contact[]; total: number }>(
      '/contacts',
      options,
      locationId
    )
  }

  /**
   * Upsert contact (create or update by email)
   */
  async upsert(
    data: UpsertContactRequest,
    locationId?: string
  ): Promise<GHLAPIResponse<{ contact: Contact }>> {
    return this.client.post<{ contact: Contact }>(
      '/contacts/upsert',
      data,
      locationId
    )
  }

  /**
   * Search contacts by email
   */
  async searchByEmail(
    email: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ contacts: Contact[] }>> {
    return this.client.get<{ contacts: Contact[] }>(
      '/contacts',
      { query: email },
      locationId
    )
  }

  /**
   * Get contact by email (single result)
   */
  async getByEmail(
    email: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ contact: Contact | null }>> {
    const response = await this.searchByEmail(email, locationId)
    
    if (response.error) {
      return response as any
    }

    const contact = response.data?.contacts?.[0] || null
    return { data: { contact } }
  }

  /**
   * Add tags to contact
   */
  async addTags(
    contactId: string,
    tags: string[],
    locationId?: string
  ): Promise<GHLAPIResponse<{ contact: Contact }>> {
    return this.client.post<{ contact: Contact }>(
      `/contacts/${contactId}/tags`,
      { tags },
      locationId
    )
  }

  /**
   * Remove tags from contact
   */
  async removeTags(
    contactId: string,
    tags: string[],
    locationId?: string
  ): Promise<GHLAPIResponse<{ contact: Contact }>> {
    return this.client.delete<{ contact: Contact }>(
      `/contacts/${contactId}/tags`,
      locationId
    )
  }

  /**
   * Get contact tasks
   */
  async getTasks(
    contactId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ tasks: any[] }>> {
    return this.client.get<{ tasks: any[] }>(
      `/contacts/${contactId}/tasks`,
      undefined,
      locationId
    )
  }

  /**
   * Get contact notes
   */
  async getNotes(
    contactId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ notes: any[] }>> {
    return this.client.get<{ notes: any[] }>(
      `/contacts/${contactId}/notes`,
      undefined,
      locationId
    )
  }

  /**
   * Get contact appointments
   */
  async getAppointments(
    contactId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ appointments: any[] }>> {
    return this.client.get<{ appointments: any[] }>(
      `/contacts/${contactId}/appointments`,
      undefined,
      locationId
    )
  }

  /**
   * Get contact campaigns
   */
  async getCampaigns(
    contactId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ campaigns: any[] }>> {
    return this.client.get<{ campaigns: any[] }>(
      `/contacts/${contactId}/campaigns`,
      undefined,
      locationId
    )
  }

  /**
   * Add contact to campaign
   */
  async addToCampaign(
    contactId: string,
    campaignId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ success: boolean }>> {
    return this.client.post<{ success: boolean }>(
      `/contacts/${contactId}/campaigns/${campaignId}`,
      {},
      locationId
    )
  }

  /**
   * Remove contact from campaign
   */
  async removeFromCampaign(
    contactId: string,
    campaignId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ success: boolean }>> {
    return this.client.delete<{ success: boolean }>(
      `/contacts/${contactId}/campaigns/${campaignId}`,
      locationId
    )
  }

  /**
   * Bulk create contacts
   */
  async bulkCreate(
    contacts: CreateContactRequest[],
    locationId?: string
  ): Promise<GHLAPIResponse<{ contacts: Contact[]; errors: any[] }>> {
    return this.client.post<{ contacts: Contact[]; errors: any[] }>(
      '/contacts/bulk',
      { contacts },
      locationId
    )
  }

  /**
   * Get contact followers
   */
  async getFollowers(
    contactId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ followers: any[] }>> {
    return this.client.get<{ followers: any[] }>(
      `/contacts/${contactId}/followers`,
      undefined,
      locationId
    )
  }

  /**
   * Add follower to contact
   */
  async addFollower(
    contactId: string,
    userId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ success: boolean }>> {
    return this.client.post<{ success: boolean }>(
      `/contacts/${contactId}/followers`,
      { userId },
      locationId
    )
  }

  /**
   * Remove follower from contact
   */
  async removeFollower(
    contactId: string,
    userId: string,
    locationId?: string
  ): Promise<GHLAPIResponse<{ success: boolean }>> {
    return this.client.delete<{ success: boolean }>(
      `/contacts/${contactId}/followers/${userId}`,
      locationId
    )
  }
}
