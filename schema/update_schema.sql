-- 1. Ensure all existing records have a hash
-- (Run the backfill-hashes.js script first)

-- 2. Add the UNIQUE constraint to prevent future duplicates (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_question_hash') THEN
        ALTER TABLE mcqs ADD CONSTRAINT unique_question_hash UNIQUE (embedding_hash);
    END IF;
END $$;

-- 3. Add an index for faster lookup during deduplication
CREATE INDEX IF NOT EXISTS idx_mcqs_embedding_hash ON mcqs (embedding_hash);

-- 4. Create the batches table if not exists (Phase 2 infrastructure)
CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    total_questions INTEGER NOT NULL,
    subject_distribution JSONB,
    difficulty_distribution JSONB,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create the logs table for DC agent auditing
CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    batch_id TEXT REFERENCES batches(id),
    agent_name TEXT NOT NULL,
    log_content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
