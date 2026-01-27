// Authentication Utilities
// Functions for authenticating API requests and extracting user information

import { NextRequest } from 'next/server';
import { createServerSupabaseAnonClient } from './supabase';
import type { User } from '@/types/api';

/**
 * Extract and verify authentication token from request headers
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const supabase = createServerSupabaseAnonClient();

    // Verify the token and get user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile as User;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Get user from request (throws if not authenticated)
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await authenticateRequest(request);

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  return user;
}

/**
 * Check if user has valid GHL token
 */
export async function hasValidGHLToken(userId: string): Promise<boolean> {
  const supabase = createServerSupabaseAnonClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('ghl_token_expires_at')
    .eq('id', userId)
    .single();

  if (!profile || !profile.ghl_token_expires_at) {
    return false;
  }

  const expiresAt = new Date(profile.ghl_token_expires_at);
  const now = new Date();

  return expiresAt > now;
}

/**
 * Get GHL access token for user
 */
export async function getGHLAccessToken(userId: string): Promise<string | null> {
  const supabase = createServerSupabaseAnonClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('ghl_access_token')
    .eq('id', userId)
    .single();

  return profile?.ghl_access_token || null;
}

// Custom error classes
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}
