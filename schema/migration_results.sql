-- Migration to add detailed results to history
-- 1. Add 'results' column if it doesn't exist
ALTER TABLE user_exam_history ADD COLUMN IF NOT EXISTS results JSONB;

-- 2. Drop OLD column that is causing "NOT NULL" errors
ALTER TABLE user_exam_history DROP COLUMN IF EXISTS attempted_question_ids;

-- 3. Set results to NOT NULL with a default if it's currently nullable
ALTER TABLE user_exam_history ALTER COLUMN results SET DEFAULT '[]';
UPDATE user_exam_history SET results = '[]' WHERE results IS NULL;
ALTER TABLE user_exam_history ALTER COLUMN results SET NOT NULL;

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
