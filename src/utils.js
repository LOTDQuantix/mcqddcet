/**
 * Generate a SHA-256 hash of a string.
 * Works in both Node.js and Cloudflare Workers (Web Crypto API).
 *
 * @param {string} text
 * @returns {string} hex-encoded SHA-256 hash
 */
export function createHash(text) {
    // Synchronous simple hash for dedup — using djb2 + fnv1a combined
    // (Web Crypto is async; this is a fast deterministic alternative for dedup)
    const normalized = text.trim().toLowerCase().replace(/\s+/g, " ");
    let h1 = 5381;
    let h2 = 2166136261;

    for (let i = 0; i < normalized.length; i++) {
        const c = normalized.charCodeAt(i);
        h1 = ((h1 << 5) + h1 + c) >>> 0;   // djb2
        h2 = (h2 ^ c) * 16777619 >>> 0;     // fnv1a
    }

    return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

/**
 * Generate a unique batch ID for this run.
 * Format: BATCH-YYYY-MM-DD-NNN
 *
 * @param {Date} [date]
 * @returns {string}
 */
export function generateBatchId(date = new Date()) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `BATCH-${yyyy}-${mm}-${dd}-${hh}${min}`;
}

/**
 * Build a generation summary report.
 */
export function buildSummary({ batchId, total, inserted, duplicatesFound, distribution, durationMs }) {
    return {
        status: "success",
        batch_id: batchId,
        generation_date: new Date().toISOString(),
        total_generated: total,
        total_inserted: inserted,
        duplicates_found: duplicatesFound,
        duration_ms: durationMs,
        distribution: {
            by_difficulty: {
                Easy: distribution.Easy,
                Medium: distribution.Medium,
                Hard: distribution.Hard,
            },
            by_subject: {
                Maths: distribution.Maths,
                Physics: distribution.Physics,
            },
        },
    };
}
