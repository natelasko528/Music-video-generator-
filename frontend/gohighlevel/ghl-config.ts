-- ============================================================================
-- GoHighLevel Integration Database Schema
-- Supabase PostgreSQL migration for GHL Onboarding Agent
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- GHL Tokens Table
-- Stores OAuth tokens for GHL locations (encrypted)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ghl_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_in INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL,
  user_type TEXT,
  company_id TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for fast token lookups
CREATE INDEX idx_ghl_tokens_location_id ON ghl_tokens(location_id);
CREATE INDEX idx_ghl_tokens_company_id ON ghl_tokens(company_id);
CREATE INDEX idx_ghl_tokens_expires_at ON ghl_tokens(expires_at);

-- Enable RLS
ALTER TABLE ghl_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role only)
CREATE POLICY "Service role can manage tokens"
ON ghl_tokens FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- GHL Locations Table
-- Stores metadata about connected GHL locations
-- ============================================================================

CREATE TABLE IF NOT EXISTS ghl_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL UNIQUE,
  company_id TEXT,
  user_id TEXT,
  user_type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  timezone TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  sync_error TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_ghl_locations_location_id ON ghl_locations(location_id);
CREATE INDEX idx_ghl_locations_company_id ON ghl_locations(company_id);
CREATE INDEX idx_ghl_locations_connected_at ON ghl_locations(connected_at DESC);

-- Enable RLS
ALTER TABLE ghl_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their locations"
ON ghl_locations FOR SELECT
USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage locations"
ON ghl_locations FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- GHL Webhook Events Table
-- Stores incoming webhook events from GHL
-- ============================================================================

CREATE TABLE IF NOT EXISTS ghl_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  location_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed BOOLEAN DEFAULT FALSE NOT NULL,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_ghl_webhook_events_event_id ON ghl_webhook_events(event_id);
CREATE INDEX idx_ghl_webhook_events_location_id ON ghl_webhook_events(location_id);
CREATE INDEX idx_ghl_webhook_events_event_type ON ghl_webhook_events(event_type);
CREATE INDEX idx_ghl_webhook_events_processed ON ghl_webhook_events(processed);
CREATE INDEX idx_ghl_webhook_events_received_at ON ghl_webhook_events(received_at DESC);

-- Enable RLS
ALTER TABLE ghl_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage webhook events"
ON ghl_webhook_events FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- GHL Webhook Errors Table
-- Stores webhook processing errors for debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS ghl_webhook_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  request_body TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index
CREATE INDEX idx_ghl_webhook_errors_occurred_at ON ghl_webhook_errors(occurred_at DESC);

-- Enable RLS
ALTER TABLE ghl_webhook_errors ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Service role can manage webhook errors"
ON ghl_webhook_errors FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- GHL API Logs Table
-- Stores API request/response logs for debugging and monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS ghl_api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  request_params JSONB,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_ghl_api_logs_location_id ON ghl_api_logs(location_id);
CREATE INDEX idx_ghl_api_logs_endpoint ON ghl_api_logs(endpoint);
CREATE INDEX idx_ghl_api_logs_status_code ON ghl_api_logs(status_code);
CREATE INDEX idx_ghl_api_logs_created_at ON ghl_api_logs(created_at DESC);

-- Enable RLS
ALTER TABLE ghl_api_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Service role can manage API logs"
ON ghl_api_logs FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- GHL Snapshots Table
-- Stores snapshot metadata and status
-- ============================================================================

CREATE TABLE IF NOT EXISTS ghl_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('location', 'agency')),
  company_id TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'processing', 'failed')),
  industry TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_ghl_snapshots_snapshot_id ON ghl_snapshots(snapshot_id);
CREATE INDEX idx_ghl_snapshots_company_id ON ghl_snapshots(company_id);
CREATE INDEX idx_ghl_snapshots_industry ON ghl_snapshots(industry);

-- Enable RLS
ALTER TABLE ghl_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view available snapshots"
ON ghl_snapshots FOR SELECT
USING (status = 'available' OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage snapshots"
ON ghl_snapshots FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- GHL Implementation Jobs Table
-- Tracks snapshot application and configuration jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS ghl_implementation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id TEXT NOT NULL UNIQUE,
  location_id TEXT NOT NULL,
  snapshot_id TEXT,
  job_type TEXT NOT NULL CHECK (job_type IN ('snapshot', 'configuration', 'migration')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_ghl_implementation_jobs_job_id ON ghl_implementation_jobs(job_id);
CREATE INDEX idx_ghl_implementation_jobs_location_id ON ghl_implementation_jobs(location_id);
CREATE INDEX idx_ghl_implementation_jobs_status ON ghl_implementation_jobs(status);
CREATE INDEX idx_ghl_implementation_jobs_created_at ON ghl_implementation_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE ghl_implementation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their implementation jobs"
ON ghl_implementation_jobs FOR SELECT
USING (
  location_id IN (
    SELECT location_id FROM ghl_locations 
    WHERE user_id = auth.uid()::text
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "Service role can manage implementation jobs"
ON ghl_implementation_jobs FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- Auto-update Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_ghl_tokens_updated_at
  BEFORE UPDATE ON ghl_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ghl_locations_updated_at
  BEFORE UPDATE ON ghl_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ghl_snapshots_updated_at
  BEFORE UPDATE ON ghl_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ghl_implementation_jobs_updated_at
  BEFORE UPDATE ON ghl_implementation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Cleanup Functions
-- ============================================================================

-- Function to cleanup old webhook events (>30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ghl_webhook_events
  WHERE received_at < NOW() - INTERVAL '30 days'
    AND processed = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old API logs (>7 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ghl_api_logs
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ghl_tokens
  WHERE expires_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE ghl_tokens IS 'Stores OAuth tokens for GHL locations (encrypted)';
COMMENT ON TABLE ghl_locations IS 'Metadata about connected GHL locations';
COMMENT ON TABLE ghl_webhook_events IS 'Incoming webhook events from GHL';
COMMENT ON TABLE ghl_webhook_errors IS 'Webhook processing errors for debugging';
COMMENT ON TABLE ghl_api_logs IS 'API request/response logs';
COMMENT ON TABLE ghl_snapshots IS 'Snapshot metadata and status';
COMMENT ON TABLE ghl_implementation_jobs IS 'Snapshot application and configuration jobs';
