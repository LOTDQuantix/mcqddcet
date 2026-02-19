-- Migration to add detailed results to history
-- 1. Add 'results' column if it doesn't exist
ALTER TABLE user_exam_history ADD COLUMN IF NOT EXISTS results JSONB;

-- 2. Drop old column if it exists (optional, keeping it safe for now)
-- ALTER TABLE user_exam_history DROP COLUMN IF EXISTS attempted_question_ids;

-- 3. Ensure results is NOT NULL (if you have existing data, you might need a default first)
-- ALTER TABLE user_exam_history ALTER COLUMN results SET NOT NULL;

-- 4. Re-apply policies using DO blocks to avoid "already exists" errors
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon can insert exam history') THEN
        CREATE POLICY "Anon can insert exam history" ON user_exam_history FOR INSERT TO anon WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon can select own exam history') THEN
        CREATE POLICY "Anon can select own exam history" ON user_exam_history FOR SELECT TO anon USING (true);
    END IF;
END $$;
