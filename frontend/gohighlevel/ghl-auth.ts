// API Types & Interfaces for GHL Onboarding Agent
// Centralized type definitions for all API routes

import { z } from 'zod';

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// ============================================================================
// USER & PROFILE TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  agency_name: string | null;
  ghl_agency_id: string | null;
  ghl_token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserProfileRequest {
  full_name?: string;
  agency_name?: string;
}

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  settings: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  default_industry?: string;
  branding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  notifications?: {
    email_enabled: boolean;
    webhook_url?: string;
  };
}

export interface UpdateOrganizationRequest {
  name?: string;
  settings?: Partial<OrganizationSettings>;
}

// ============================================================================
// FORM SUBMISSION TYPES
// ============================================================================

export interface FormSubmission {
  id: string;
  user_id: string;
  form_data: FormData;
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'failed';
  step_completed: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface FormData {
  step_1?: Stage1Data;
  step_2?: Stage2Data;
  step_3?: Stage3Data;
  step_4?: Stage4Data;
  step_5?: Stage5Data;
  step_6?: Stage6Data;
}

export interface Stage1Data {
  businessName: string;
  industry: string;
  businessDescription?: string;
  website?: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  logoUrl?: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface Stage2Data {
  services: Array<{
    name: string;
    description: string;
    priceRange?: {
      min: number;
      max: number;
    };
    duration?: number;
  }>;
  leadTypes: string[];
  salesProcess: string[];
}

export interface Stage3Data {
  teamMembers: Array<{
    name: string;
    email: string;
    role: string;
    phone?: string;
  }>;
  operatingHours: {
    timezone: string;
    schedule: Record<string, { open: string; close: string; enabled: boolean }>;
  };
}

export interface Stage4Data {
  emailTemplates: Array<{
    name: string;
    subject: string;
    body: string;
    type: string;
  }>;
  smsTemplates: Array<{
    name: string;
    body: string;
    type: string;
  }>;
}

export interface Stage5Data {
  workflowPreferences: {
    autoAssignLeads: boolean;
    leadRotation: boolean;
    appointmentReminders: boolean;
    followUpSequence: boolean;
  };
  automationRules: Array<{
    trigger: string;
    action: string;
    conditions?: any;
  }>;
}

export interface Stage6Data {
  reviewConfirmed: boolean;
  termsAccepted: boolean;
  additionalNotes?: string;
}

// ============================================================================
// FORM API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateFormRequest {
  initial_data?: Partial<FormData>;
}

export interface UpdateFormStageRequest {
  stage_data: any;
  auto_save?: boolean;
}

export interface SubmitFormRequest {
  form_id: string;
  complete_data: FormData;
}

export interface FormListResponse {
  forms: FormSubmission[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// IMPLEMENTATION TYPES
// ============================================================================

export interface Implementation {
  id: string;
  submission_id: string;
  user_id: string;
  ghl_location_id: string | null;
  ghl_location_name: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  current_step: string | null;
  total_steps: number;
  completed_steps: number;
  progress_percentage: number;
  estimated_duration: number | null;
  elapsed_duration: number | null;
  created_resources: CreatedResources | null;
  completion_report: CompletionReport | null;
  error_message: string | null;
  error_stack: string | null;
  retry_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
}

export interface CreatedResources {
  location_id: string;
  contacts: string[];
  workflows: string[];
  pipelines: string[];
  calendars: string[];
  custom_fields: string[];
  [key: string]: any;
}

export interface CompletionReport {
  summary: string;
  resources_created: number;
  duration_seconds: number;
  steps_completed: string[];
  warnings?: string[];
  next_steps?: string[];
}

export interface ImplementationLog {
  id: string;
  implementation_id: string;
  step_id: string;
  step_name: string;
  step_order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  result_data: any | null;
  message: string | null;
  error_message: string | null;
  error_stack: string | null;
  attempt_number: number;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

// ============================================================================
// IMPLEMENTATION API REQUEST/RESPONSE TYPES
// ============================================================================

export interface StartImplementationRequest {
  submission_id: string;
}

export interface StartImplementationResponse {
  implementation_id: string;
  status: string;
  message: string;
}

export interface ImplementationStatusResponse {
  implementation: Implementation;
  logs: ImplementationLog[];
  real_time_enabled: boolean;
}

export interface ImplementationProgressResponse {
  status: Implementation['status'];
  progress_percentage: number;
  current_step: string | null;
  completed_steps: number;
  total_steps: number;
  elapsed_seconds: number | null;
  estimated_remaining_seconds: number | null;
  recent_logs: ImplementationLog[];
}

export interface CancelImplementationRequest {
  reason?: string;
}

// ============================================================================
// GHL AUTH TYPES
// ============================================================================

export interface GHLAuthStatus {
  connected: boolean;
  agency_id: string | null;
  token_expires_at: string | null;
  token_valid: boolean;
  scopes: string[];
}

export interface GHLDisconnectRequest {
  confirm: boolean;
}

// ============================================================================
// HEALTH & METRICS TYPES
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: ServiceHealth;
    storage: ServiceHealth;
    ghl_api: ServiceHealth;
    inngest: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latency_ms?: number;
  message?: string;
}

export interface MetricsResponse {
  implementations: {
    total: number;
    completed: number;
    failed: number;
    in_progress: number;
    success_rate: number;
    avg_duration_seconds: number;
  };
  forms: {
    total_submissions: number;
    draft: number;
    submitted: number;
    completed: number;
  };
  users: {
    total: number;
    with_ghl_connected: number;
  };
  performance: {
    avg_api_latency_ms: number;
    p95_api_latency_ms: number;
  };
  period: {
    start: string;
    end: string;
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Stage 1 Schema
export const stage1Schema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  industry: z.string().min(1, 'Please select an industry'),
  businessDescription: z.string().max(500).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  businessPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  businessEmail: z.string().email('Invalid email address'),
  businessAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(2, 'State is required'),
    postalCode: z.string().min(5, 'Postal code is required'),
    country: z.string().default('US'),
  }),
  logoUrl: z.string().url().optional(),
  brandColors: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    accent: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  }),
});

// Stage 2 Schema
export const stage2Schema = z.object({
  services: z.array(z.object({
    name: z.string().min(1, 'Service name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    priceRange: z.object({
      min: z.number().min(0),
      max: z.number().min(0),
    }).optional(),
    duration: z.number().positive().optional(),
  })).min(1, 'At least one service is required'),
  leadTypes: z.array(z.string()).min(1, 'Select at least one lead type'),
  salesProcess: z.array(z.string()).min(3, 'Define at least 3 sales process steps'),
});

// Stage 3 Schema
export const stage3Schema = z.object({
  teamMembers: z.array(z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    role: z.string().min(1, 'Role is required'),
    phone: z.string().optional(),
  })).min(1, 'At least one team member is required'),
  operatingHours: z.object({
    timezone: z.string(),
    schedule: z.record(z.object({
      open: z.string(),
      close: z.string(),
      enabled: z.boolean(),
    })),
  }),
});

// Stage 4 Schema
export const stage4Schema = z.object({
  emailTemplates: z.array(z.object({
    name: z.string(),
    subject: z.string(),
    body: z.string().min(10),
    type: z.string(),
  })).optional(),
  smsTemplates: z.array(z.object({
    name: z.string(),
    body: z.string().max(160),
    type: z.string(),
  })).optional(),
});

// Stage 5 Schema
export const stage5Schema = z.object({
  workflowPreferences: z.object({
    autoAssignLeads: z.boolean(),
    leadRotation: z.boolean(),
    appointmentReminders: z.boolean(),
    followUpSequence: z.boolean(),
  }),
  automationRules: z.array(z.object({
    trigger: z.string(),
    action: z.string(),
    conditions: z.any().optional(),
  })).optional(),
});

// Stage 6 Schema
export const stage6Schema = z.object({
  reviewConfirmed: z.boolean().refine((val) => val === true, {
    message: 'You must review and confirm the information',
  }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  additionalNotes: z.string().max(1000).optional(),
});

// Form submission schema
export const submitFormSchema = z.object({
  form_id: z.string().uuid(),
  complete_data: z.object({
    step_1: stage1Schema,
    step_2: stage2Schema,
    step_3: stage3Schema,
    step_4: stage4Schema,
    step_5: stage5Schema,
    step_6: stage6Schema,
  }),
});

// Update profile schema
export const updateUserProfileSchema = z.object({
  full_name: z.string().min(2).optional(),
  agency_name: z.string().min(2).optional(),
});

// Update organization schema
export const updateOrganizationSchema = z.object({
  name: z.string().min(2).optional(),
  settings: z.object({
    default_industry: z.string().optional(),
    branding: z.object({
      logo_url: z.string().url().optional(),
      primary_color: z.string().optional(),
      secondary_color: z.string().optional(),
    }).optional(),
    notifications: z.object({
      email_enabled: z.boolean(),
      webhook_url: z.string().url().optional(),
    }).optional(),
  }).optional(),
});
