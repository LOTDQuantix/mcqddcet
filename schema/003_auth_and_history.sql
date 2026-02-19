-- Phase 9: Authentication & Exam Tracking System (Updated for Stability)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_exam_history table
CREATE TABLE IF NOT EXISTS user_exam_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken_seconds INTEGER NOT NULL,
    results JSONB NOT NULL DEFAULT '[]', -- [{ qid: UUID, user_ans: TEXT, correct_ans: TEXT, is_correct: BOOLEAN }]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Idempotent)
DO $$ 
BEGIN
    -- Users Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon can insert users') THEN
        CREATE POLICY "Anon can insert users" ON users FOR INSERT TO anon WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon can select users by username') THEN
        CREATE POLICY "Anon can select users by username" ON users FOR SELECT TO anon USING (true);
    END IF;

    -- History Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon can insert exam history') THEN
        CREATE POLICY "Anon can insert exam history" ON user_exam_history FOR INSERT TO anon WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon can select own exam history') THEN
        CREATE POLICY "Anon can select own exam history" ON user_exam_history FOR SELECT TO anon USING (true);
    END IF;
END $$;
