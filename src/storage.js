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
