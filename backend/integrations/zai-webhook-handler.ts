// GET /api/metrics
// Application metrics endpoint

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseAnonClient } from '@/lib/supabase';
import {
  handleApiError,
  createSuccessResponse,
  DatabaseError,
  AuthorizationError,
} from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import type { MetricsResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    await checkRateLimit(request, RATE_LIMITS.default);

    // Authenticate user
    const user = await requireAuth(request);

    // For MVP, only show metrics to user's own data
    // In production, add admin role check for global metrics

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d

    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    }[period] || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const supabase = createServerSupabaseAnonClient();

    // Get implementation metrics
    const { data: implementations, error: implError } = await supabase
      .from('implementations')
      .select('status, created_at, started_at, completed_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    if (implError) {
      throw new DatabaseError('Failed to fetch implementation metrics', implError);
    }

    const totalImplementations = implementations?.length || 0;
    const completedImplementations =
      implementations?.filter((i) => i.status === 'completed').length || 0;
    const failedImplementations =
      implementations?.filter((i) => i.status === 'failed').length || 0;
    const inProgressImplementations =
      implementations?.filter((i) => i.status === 'in_progress').length || 0;

    // Calculate average duration for completed implementations
    const completedWithDuration = implementations?.filter(
      (i) => i.status === 'completed' && i.started_at && i.completed_at
    );
    const avgDuration =
      completedWithDuration && completedWithDuration.length > 0
        ? completedWithDuration.reduce((acc, i) => {
            const start = new Date(i.started_at!).getTime();
            const end = new Date(i.completed_at!).getTime();
            return acc + (end - start) / 1000;
          }, 0) / completedWithDuration.length
        : 0;

    const successRate =
      totalImplementations > 0
        ? (completedImplementations / totalImplementations) * 100
        : 0;

    // Get form submission metrics
    const { data: forms, error: formError } = await supabase
      .from('onboarding_submissions')
      .select('status, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    if (formError) {
      throw new DatabaseError('Failed to fetch form metrics', formError);
    }

    const totalForms = forms?.length || 0;
    const draftForms = forms?.filter((f) => f.status === 'draft').length || 0;
    const submittedForms = forms?.filter((f) => f.status === 'submitted').length || 0;
    const completedForms = forms?.filter((f) => f.status === 'completed').length || 0;

    // User stats (simple for MVP)
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('id', user.id);

    const { count: connectedUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('id', user.id)
      .not('ghl_agency_id', 'is', null);

    const response: MetricsResponse = {
      implementations: {
        total: totalImplementations,
        completed: completedImplementations,
        failed: failedImplementations,
        in_progress: inProgressImplementations,
        success_rate: Math.round(successRate * 100) / 100,
        avg_duration_seconds: Math.round(avgDuration),
      },
      forms: {
        total_submissions: totalForms,
        draft: draftForms,
        submitted: submittedForms,
        completed: completedForms,
      },
      users: {
        total: totalUsers || 1,
        with_ghl_connected: connectedUsers || 0,
      },
      performance: {
        avg_api_latency_ms: 0, // TODO: Implement actual tracking
        p95_api_latency_ms: 0, // TODO: Implement actual tracking
      },
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },
    };

    return createSuccessResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
}
