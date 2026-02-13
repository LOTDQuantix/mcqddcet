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
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>DDCET MCQ Generator</title>
          <style>
            :root { --primary: #006064; --bg: #e0f7fa; --text: #333; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 2rem auto; line-height: 1.6; padding: 0 1.5rem; color: var(--text); background: #fdfdfd; }
            h1 { color: var(--primary); border-bottom: 2px solid var(--bg); padding-bottom: 0.5rem; }
            code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: bold; }
            .status { padding: 1.25rem; background: var(--bg); border-radius: 12px; color: var(--primary); margin-bottom: 2rem; display: flex; align-items: center; gap: 10px; font-weight: 600; }
            .card { border: 1px solid #eee; padding: 1.5rem; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            ul { padding-left: 1.2rem; }
            li { margin-bottom: 0.75rem; }
            footer { margin-top: 3rem; font-size: 0.9rem; color: #666; border-top: 1px solid #eee; padding-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="status"><span>✅</span> DDCET MCQ Generator API is Live & Running</div>
          
          <div class="card">
            <h1>API Endpoints</h1>
            <p>Direct integration with Supabase for DDCET MCQ Daily Generation Pipeline.</p>
            <ul>
              <li><code>GET /status</code> - View database statistics & batch history.</li>
              <li><code>GET /health</code> - Simple health check (confirm uptime).</li>
              <li><code>POST /generate</code> - Trigger new batch generation (requires <code>X-Generation-Secret</code>).</li>
            </ul>
          </div>

          <footer>
            Debate Club Engine v1.0.0 • Supabase Integrated • Cloudflare Native
          </footer>
        </body>
        </html>`;

                return new Response(html, {
                    headers: { "Content-Type": "text/html", ...corsHeaders }
                });
            }

            // ────────────────────────────────────────
            // GET /favicon.ico (To resolve 404)
            // ────────────────────────────────────────
            if (url.pathname === "/favicon.ico" && request.method === "GET") {
                return new Response(null, { status: 204, headers: corsHeaders });
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
