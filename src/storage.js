/**
 * Insert validated MCQs into Supabase in batches.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {object[]} mcqs - Array of validated MCQ objects
 * @param {string} batchId - Batch identifier
 * @returns {Promise<{ inserted: number, errors: string[] }>}
 */
export async function insertMCQs(supabase, mcqs, batchId) {
    const errors = [];
    let inserted = 0;
    const CHUNK_SIZE = 25; // Supabase handles 25 rows per insert comfortably

    // Prepare rows with metadata
    const rows = mcqs.map((mcq) => ({
        question: mcq.question.trim(),
        option_a: mcq.option_a.trim(),
        option_b: mcq.option_b.trim(),
        option_c: mcq.option_c.trim(),
        option_d: mcq.option_d.trim(),
        correct_answer: mcq.correct_answer,
        subject: mcq.subject,
        topic: mcq.topic.trim(),
        difficulty: mcq.difficulty,
        batch_id: batchId,
        embedding_hash: mcq.embedding_hash,
        generation_date: new Date().toISOString(),
    }));

    // Insert in chunks
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);

        const { data, error } = await supabase
            .from("mcqs")
            .insert(chunk)
            .select("id");

        if (error) {
            errors.push(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${error.message}`);
        } else {
            inserted += data?.length ?? chunk.length;
        }
    }

    return { inserted, errors };
}

/**
 * Get count of existing MCQs by subject for balance reporting.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<{ Maths: number, Physics: number, total: number }>}
 */
export async function getExistingCounts(supabase) {
    const { count: mathsCount } = await supabase
        .from("mcqs")
        .select("id", { count: "exact", head: true })
        .eq("subject", "Maths");

    const { count: physicsCount } = await supabase
        .from("mcqs")
        .select("id", { count: "exact", head: true })
        .eq("subject", "Physics");

    return {
        Maths: mathsCount ?? 0,
        Physics: physicsCount ?? 0,
        total: (mathsCount ?? 0) + (physicsCount ?? 0),
    };
}

/**
 * Record a new batch in the system.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {object} batchData
 */
export async function createBatchRecord(supabase, batchData) {
    const { error } = await supabase
        .from("batches")
        .insert([{
            id: batchData.id,
            total_questions: batchData.total_questions,
            subject_distribution: batchData.subject_distribution,
            difficulty_distribution: batchData.difficulty_distribution,
            status: batchData.status || 'completed'
        }]);

    if (error) throw new Error(`Failed to create batch record: ${error.message}`);
}

/**
 * Persist agent logs for a specific batch.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} batchId
 * @param {object[]} logs - { agent_name, log_content }
 */
export async function saveBatchLogs(supabase, batchId, logs) {
    const rows = logs.map(log => ({
        batch_id: batchId,
        agent_name: log.agent_name,
        log_content: log.log_content,
        timestamp: new Date().toISOString()
    }));

    const { error } = await supabase
        .from("logs")
        .insert(rows);

    if (error) throw new Error(`Failed to save batch logs: ${error.message}`);
}

/**
 * Fetch all batches sorted by creation date.
 */
export async function fetchBatches(supabase) {
    const { data, error } = await supabase
        .from("batches")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch batches: ${error.message}`);
    return data;
}

/**
 * Fetch full details for a batch.
 */
export async function fetchBatchDetails(supabase, batchId) {
    const { data: batch, error: batchErr } = await supabase
        .from("batches")
        .select("*")
        .eq("id", batchId)
        .single();

    if (batchErr) throw new Error(`Batch not found: ${batchErr.message}`);

    const { data: mcqs, error: mcqErr } = await supabase
        .from("mcqs")
        .select("*")
        .eq("batch_id", batchId);

    const { data: logs, error: logErr } = await supabase
        .from("logs")
        .select("*")
        .eq("batch_id", batchId)
        .order("timestamp", { ascending: true });

    return {
        ...batch,
        questions: mcqs || [],
        logs: logs || []
    };
}

/**
 * Fetch MCQs with optional filters and pagination.
 */
export async function fetchMCQs(supabase, { subject, difficulty, page = 1, limit = 20 } = {}) {
    let query = supabase
        .from("mcqs")
        .select("id, question, option_a, option_b, option_c, option_d, correct_answer, subject, topic, difficulty", { count: "exact" });

    if (subject) query = query.eq("subject", subject);
    if (difficulty) query = query.eq("difficulty", difficulty);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order("id", { ascending: true });

    const { data, error, count } = await query;
    if (error) throw new Error(`Failed to fetch MCQs: ${error.message}`);
    return { data: data || [], total: count || 0, page, limit };
}

/**
 * Fetch a single random MCQ with optional subject/difficulty filter.
 */
export async function fetchRandomMCQ(supabase, { subject, difficulty, exclude } = {}) {
    let query = supabase
        .from("mcqs")
        .select("id, question, option_a, option_b, option_c, option_d, correct_answer, subject, topic, difficulty");

    if (subject) query = query.eq("subject", subject);
    if (difficulty) query = query.eq("difficulty", difficulty);
    if (exclude) query = query.not("id", "in", `(${exclude})`);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch random MCQ: ${error.message}`);
    if (!data || data.length === 0) return null;

    return data[Math.floor(Math.random() * data.length)];
}
