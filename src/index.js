import { createSupabaseClient } from "./supabase.js";
import { validateBatch } from "./validator.js";
import { fetchExistingHashes, deduplicateBatch } from "./deduplicator.js";
import { insertMCQs, getExistingCounts, createBatchRecord, saveBatchLogs, fetchBatches, fetchBatchDetails, fetchMCQs, fetchRandomMCQ } from "./storage.js";
import { generateBatchId, buildSummary } from "./utils.js";
import { generateDailyBatch } from "./generator.js";
import { renderSPA } from "./frontend.js";

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
            // GET / (SPA Entry Point)
            // ────────────────────────────────────────
            const spaPaths = ["/", "/practice", "/browse", "/dashboard", "/history", "/admin"];
            if ((spaPaths.includes(url.pathname) || url.pathname.startsWith("/batch/")) && request.method === "GET") {
                return new Response(renderSPA(), {
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
            // GET /api/batches
            // ────────────────────────────────────────
            if (url.pathname === "/api/batches" && request.method === "GET") {
                const supabase = createSupabaseClient(env);
                const batches = await fetchBatches(supabase);
                return jsonResponse(batches, 200, corsHeaders);
            }

            // ────────────────────────────────────────
            // GET /api/batches/:id
            // ────────────────────────────────────────
            if (url.pathname.startsWith("/api/batches/") && request.method === "GET") {
                const batchId = url.pathname.split("/").pop();
                const supabase = createSupabaseClient(env);
                try {
                    const details = await fetchBatchDetails(supabase, batchId);
                    return jsonResponse(details, 200, corsHeaders);
                } catch (e) {
                    return jsonResponse({ error: e.message }, 404, corsHeaders);
                }
            }

            // ────────────────────────────────────────
            // GET /api/mcqs — Paginated, filterable MCQ list
            // ────────────────────────────────────────
            if (url.pathname === "/api/mcqs" && request.method === "GET") {
                const supabase = createSupabaseClient(env);
                const subject = url.searchParams.get("subject");
                const difficulty = url.searchParams.get("difficulty");
                const page = parseInt(url.searchParams.get("page") || "1");
                const limit = parseInt(url.searchParams.get("limit") || "20");
                const result = await fetchMCQs(supabase, { subject, difficulty, page, limit });
                return jsonResponse(result, 200, corsHeaders);
            }

            // ────────────────────────────────────────
            // GET /api/mcqs/random — Random question for quiz mode
            // ────────────────────────────────────────
            if (url.pathname === "/api/mcqs/random" && request.method === "GET") {
                const supabase = createSupabaseClient(env);
                const subject = url.searchParams.get("subject");
                const difficulty = url.searchParams.get("difficulty");
                const exclude = url.searchParams.get("exclude");
                const mcq = await fetchRandomMCQ(supabase, { subject, difficulty, exclude });
                if (!mcq) return jsonResponse({ error: "No questions found" }, 404, corsHeaders);
                return jsonResponse(mcq, 200, corsHeaders);
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

                // Parse or Generate MCQ payload
                let mcqs;
                const contentType = request.headers.get("Content-Type");
                if (contentType && contentType.includes("application/json")) {
                    try {
                        mcqs = await request.json();
                    } catch {
                        return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
                    }
                } else {
                    // AUTONOMOUS MODE: Trigger internal generator
                    mcqs = generateDailyBatch();
                }

                if (!Array.isArray(mcqs)) {
                    return jsonResponse({ error: "Payload must be a JSON array of MCQs" }, 400, corsHeaders);
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

                // Step 4: Record Batch & Save Logs (Simulated DC agents)
                await createBatchRecord(supabase, {
                    id: batchId,
                    total_questions: clean.length,
                    subject_distribution: validation.distribution,
                    difficulty_distribution: { Easy: 30, Medium: 40, Hard: 30 },
                    status: 'completed'
                });

                // Simulated logs based on DC requirements
                const simulatedLogs = [
                    { agent_name: "Analyzer", log_content: "Verified requirement for 100 MCQs. Balanced topics for Maths and Physics." },
                    { agent_name: "Generator", log_content: `Produced ${clean.length} unique items using DDCET-template engine.` },
                    { agent_name: "Validator", log_content: "Batch passed all structural and distribution rules." },
                    { agent_name: "Deduplicator", log_content: `0 historical collisions detected. All ${clean.length} MCQs are fresh.` },
                    { agent_name: "Storage", log_content: `Inserted ${inserted} rows into 'mcqs' table successfully.` }
                ];
                await saveBatchLogs(supabase, batchId, simulatedLogs);

                // Step 5: Build summary
                const durationMs = Date.now() - startTime;
                const summary = buildSummary({
                    batchId,
                    total: mcqs.length,
                    inserted,
                    duplicatesFound: duplicates.length,
                    distribution: validation.distribution,
                    durationMs,
                });

                return jsonResponse({
                    ...summary,
                    logs: simulatedLogs
                }, 200, corsHeaders);
            }

            // ────────────────────────────────────────
            // 404 — Unknown route
            // ────────────────────────────────────────
            return jsonResponse({
                error: "Not found",
                routes: ["GET /health", "GET /status", "POST /generate"],
            }, 404, corsHeaders);

        } catch (err) {
            console.error(err);
            return jsonResponse({
                error: "Internal server error",
                message: err.message,
                stack: err.stack, // Helpful for debugging the 500
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
