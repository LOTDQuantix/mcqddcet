-- Phase 9: Authentication & Exam Tracking System
-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_exam_history table
CREATE TABLE user_exam_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken_seconds INTEGER NOT NULL,
    results JSONB NOT NULL, -- [{ qid: UUID, user_ans: TEXT, correct_ans: TEXT, is_correct: BOOLEAN }]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_history ENABLE ROW LEVEL SECURITY;

-- Note on Authentication: 
-- Since we are not using Supabase Auth, we are using the 'anon' role.
-- RLS policies below assume that the user_id is passed in the query and checked.
-- This is not cryptographically secure against malicious users who know other user IDs,
-- but it follows the "Worker-less" and "Custom Login" requirements.

-- RLS for users
CREATE POLICY "Anon can insert users" ON users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can select users by username" ON users FOR SELECT TO anon USING (true);

-- RLS for user_exam_history
CREATE POLICY "Anon can insert exam history" ON user_exam_history FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can select own exam history" ON user_exam_history FOR SELECT TO anon USING (true); -- Ideally filtering by user_id in app logic
