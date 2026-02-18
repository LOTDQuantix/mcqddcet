import { createHash } from "./utils.js";

/**
 * Fetch all existing question hashes from Supabase for deduplication.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<Set<string>>} Set of existing embedding_hash values
 */
export async function fetchExistingHashes(supabase) {
    const hashes = new Set();
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data, error } = await supabase
            .from("mcqs")
            .select("embedding_hash")
            .not("embedding_hash", "is", null)
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            throw new Error(`Failed to fetch hashes: ${error.message}`);
        }

        if (!data || data.length === 0) break;

        for (const row of data) {
            if (row.embedding_hash) hashes.add(row.embedding_hash);
        }

        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    return hashes;
}

/**
 * Check a batch of MCQs against existing DB hashes.
 * Returns { clean: MCQ[], duplicates: MCQ[] }
 */
export function deduplicateBatch(mcqs, existingHashes) {
    const clean = [];
    const duplicates = [];
    const batchHashes = new Set();

    for (const mcq of mcqs) {
        const hash = createHash(mcq.question);
        mcq.embedding_hash = hash;

        if (existingHashes.has(hash) || batchHashes.has(hash)) {
            duplicates.push(mcq);
        } else {
            clean.push(mcq);
            batchHashes.add(hash);
        }
    }

    return { clean, duplicates };
}
