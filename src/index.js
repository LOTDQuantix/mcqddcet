import { createSupabaseClient } from "./supabase.js";
import { validateBatch } from "./validator.js";
import { fetchExistingHashes, deduplicateBatch } from "./deduplicator.js";
import { insertMCQs, getExistingCounts } from "./storage.js";
import { generateBatchId, buildSummary } from "./utils.js";

export default {
    /**
     * Cloudflare Worker fetch handler.
     *
     * Routes:
     *   POST /generate  — Accepts JSON body with 100 MCQs, validates, deduplicates, inserts into Supabase
     *   GET  /status    — Returns DB stats (total MCQs, by subject)
     *   GET  /health    — Simple health check
     */
    async fetch(request, env) {
        const url = new URL(request.url);

        // CORS headers for all responses
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Generation-Secret",
        };

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        try {
            // ────────────────────────────────────────
            // GET / (Landing Page)
            // ────────────────────────────────────────
            if (url.pathname === "/" && request.method === "GET") {
                const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>DDCET MCQ Generator</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; line-height: 1.5; padding: 0 1rem; }
            code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
            .status { padding: 1rem; background: #e0f7fa; border-radius: 8px; color: #006064; margin-bottom: 2rem; }
          </style>
        </head>
        <body>
          <h1>DDCET MCQ Generator API</h1>
          <div class="status">✅ Worker is Running</div>
          
          <h2>Endpoints</h2>
          <ul>
            <li><code>GET /status</code> - View database stats</li>
            <li><code>GET /health</code> - Simple health check</li>
            <li><code>POST /generate</code> - Trigger new batch (requires secret)</li>
          </ul>
        </body>
        </html>`;

                return new Response(html, {
                    headers: { "Content-Type": "text/html", ...corsHeaders }
                });
            }

            // ────────────────────────────────────────
            // GET /health
            // ────────────────────────────────────────
            if (url.pathname === "/health" && request.method === "GET") {
                return jsonResponse({ status: "ok", timestamp: new Date().toISOString() }, 200, corsHeaders);
            }

            // ────────────────────────────────────────
            // GET /status
            // ────────────────────────────────────────
            if (url.pathname === "/status" && request.method === "GET") {
                const supabase = createSupabaseClient(env);
                const counts = await getExistingCounts(supabase);
                return jsonResponse({
                    status: "ok",
                    database: counts,
                    timestamp: new Date().toISOString(),
                }, 200, corsHeaders);
            }

            // ────────────────────────────────────────
            // POST /generate
            // ────────────────────────────────────────
            if (url.pathname === "/generate" && request.method === "POST") {
                // Authenticate
                const secret = request.headers.get("X-Generation-Secret");
                if (!env.GENERATION_SECRET || secret !== env.GENERATION_SECRET) {
                    return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
                }

                const startTime = Date.now();

                // Parse MCQ payload
                let mcqs;
                try {
                    mcqs = await request.json();
                } catch {
                    return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
                }

                if (!Array.isArray(mcqs)) {
                    return jsonResponse({ error: "Body must be a JSON array of MCQs" }, 400, corsHeaders);
                }

                // Step 1: Validate batch
                const validation = validateBatch(mcqs);
                if (!validation.valid) {
                    return jsonResponse({
                        error: "Validation failed",
                        total_errors: validation.totalErrors,
                        details: validation.details.slice(0, 20), // first 20 errors
                    }, 422, corsHeaders);
                }

                // Step 2: Dedup against DB
                const supabase = createSupabaseClient(env);
                const existingHashes = await fetchExistingHashes(supabase);
                const { clean, duplicates } = deduplicateBatch(mcqs, existingHashes);

                if (clean.length < 100) {
                    return jsonResponse({
                        error: "Too many duplicates — cannot insert full batch",
                        clean_count: clean.length,
                        duplicate_count: duplicates.length,
                        message: `${duplicates.length} MCQs matched existing DB entries. Regenerate those and retry.`,
                    }, 409, corsHeaders);
                }

                // Step 3: Insert into Supabase
                const batchId = generateBatchId();
                const { inserted, errors: insertErrors } = await insertMCQs(supabase, clean, batchId);

                if (insertErrors.length > 0) {
                    return jsonResponse({
                        error: "Partial insert failure",
                        inserted,
                        insert_errors: insertErrors,
                    }, 500, corsHeaders);
                }

                // Step 4: Build summary
                const durationMs = Date.now() - startTime;
                const summary = buildSummary({
                    batchId,
                    total: mcqs.length,
                    inserted,
                    duplicatesFound: duplicates.length,
                    distribution: validation.distribution,
                    durationMs,
                });

                return jsonResponse(summary, 200, corsHeaders);
            }

            // ────────────────────────────────────────
            // 404 — Unknown route
            // ────────────────────────────────────────
            return jsonResponse({
                error: "Not found",
                routes: ["GET /health", "GET /status", "POST /generate"],
            }, 404, corsHeaders);

        } catch (err) {
            return jsonResponse({
                error: "Internal server error",
                message: err.message,
            }, 500, corsHeaders);
        }
    },
};

/**
 * Helper to return a JSON response.
 */
function jsonResponse(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...extraHeaders,
        },
    });
}
