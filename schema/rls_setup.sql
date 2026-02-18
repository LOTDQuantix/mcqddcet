-- 1. Enable RLS on the mcqs and batches tables
ALTER TABLE mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow anyone (anon) to SELECT MCQs
-- This ensures 'Direct Supabase read-only access' requirements are met securely.
DROP POLICY IF EXISTS "Allow anon read access" ON mcqs;
CREATE POLICY "Allow anon read access" ON mcqs
AS PERMISSIVE FOR SELECT
TO anon
USING (true);

-- 3. Create policy to allow anyone (anon) to SELECT Batches
DROP POLICY IF EXISTS "Allow anon read access" ON batches;
CREATE POLICY "Allow anon read access" ON batches
AS PERMISSIVE FOR SELECT
TO anon
USING (true);

-- 4. Verify existing constraints (from Phase 2)
-- Ensure unique_question_hash is still active to prevent duplicates from local scripts.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_question_hash') THEN
        ALTER TABLE mcqs ADD CONSTRAINT unique_question_hash UNIQUE (embedding_hash);
    END IF;
END $$;
