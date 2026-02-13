-- ============================================================
-- DDCET MCQ Generation System — Supabase Schema
-- Table: mcqs
-- Version: 1.0.0
-- Date: 2026-02-14
-- ============================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CREATE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS mcqs (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    question        TEXT            NOT NULL,
    option_a        TEXT            NOT NULL,
    option_b        TEXT            NOT NULL,
    option_c        TEXT            NOT NULL,
    option_d        TEXT            NOT NULL,
    correct_answer  TEXT            NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    subject         TEXT            NOT NULL CHECK (subject IN ('Maths', 'Physics')),
    topic           TEXT            NOT NULL,
    difficulty      TEXT            NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    generation_date TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    batch_id        TEXT            NOT NULL,
    embedding_hash  TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. INDEXES (for deduplication + query performance)
-- ============================================================

-- Fast lookups by batch
CREATE INDEX IF NOT EXISTS idx_mcqs_batch_id
    ON mcqs (batch_id);

-- Fast filtering by subject + difficulty (daily dashboard queries)
CREATE INDEX IF NOT EXISTS idx_mcqs_subject_difficulty
    ON mcqs (subject, difficulty);

-- Fast topic-based queries
CREATE INDEX IF NOT EXISTS idx_mcqs_topic
    ON mcqs (topic);

-- Deduplication: hash-based uniqueness check
CREATE UNIQUE INDEX IF NOT EXISTS idx_mcqs_embedding_hash
    ON mcqs (embedding_hash)
    WHERE embedding_hash IS NOT NULL;

-- Date-based queries for history
CREATE INDEX IF NOT EXISTS idx_mcqs_generation_date
    ON mcqs (generation_date DESC);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on the table
ALTER TABLE mcqs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous reads (public quiz access)
CREATE POLICY "Allow public read access"
    ON mcqs
    FOR SELECT
    USING (true);

-- Policy: Allow inserts only with service_role key
-- (anon key CANNOT insert — only your server/worker can)
CREATE POLICY "Allow service role insert"
    ON mcqs
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow service role updates (for corrections)
CREATE POLICY "Allow service role update"
    ON mcqs
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 4. COMMENTS (documentation)
-- ============================================================
COMMENT ON TABLE  mcqs IS 'DDCET daily MCQ generation store';
COMMENT ON COLUMN mcqs.id IS 'Auto-generated UUID primary key';
COMMENT ON COLUMN mcqs.question IS 'Full question text';
COMMENT ON COLUMN mcqs.option_a IS 'Option A text';
COMMENT ON COLUMN mcqs.option_b IS 'Option B text';
COMMENT ON COLUMN mcqs.option_c IS 'Option C text';
COMMENT ON COLUMN mcqs.option_d IS 'Option D text';
COMMENT ON COLUMN mcqs.correct_answer IS 'Correct option: A, B, C, or D';
COMMENT ON COLUMN mcqs.subject IS 'Subject: Maths or Physics';
COMMENT ON COLUMN mcqs.topic IS 'Specific topic within subject';
COMMENT ON COLUMN mcqs.difficulty IS 'Easy, Medium, or Hard';
COMMENT ON COLUMN mcqs.generation_date IS 'Timestamp of batch generation';
COMMENT ON COLUMN mcqs.batch_id IS 'Unique batch identifier (e.g. BATCH-2026-02-14-001)';
COMMENT ON COLUMN mcqs.embedding_hash IS 'SHA-256 hash for deduplication';
COMMENT ON COLUMN mcqs.created_at IS 'Row insertion timestamp';
