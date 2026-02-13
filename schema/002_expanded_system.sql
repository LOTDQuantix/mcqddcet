-- 002_expanded_system.sql
-- Run this in Supabase SQL Editor

-- 1. Create Batches table
CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY, -- e.g. DDCET_DAY1_BATCH1
    created_at TIMESTAMPTZ DEFAULT NOW(),
    total_questions INTEGER DEFAULT 0,
    subject_distribution JSONB,
    difficulty_distribution JSONB,
    status TEXT DEFAULT 'pending' -- pending, completed, failed
);

-- 2. Create Logs table (Agent logs for DC Simulation)
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT REFERENCES batches(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    log_content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- 3. Update MCQs table to include batch correlation if not present
-- (MCQs table already has batch_id in previous schema)

-- 4. RLS Polices for Batches
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to batches"
    ON batches FOR SELECT
    USING (true);

CREATE POLICY "Allow service role full access to batches"
    ON batches FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. RLS Polices for Logs
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to logs"
    ON logs FOR SELECT
    USING (true);

CREATE POLICY "Allow service role full access to logs"
    ON logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_batch_id ON logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_created_at ON batches(created_at DESC);
