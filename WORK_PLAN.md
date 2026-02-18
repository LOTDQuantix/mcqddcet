We are executing Phase 1 — Critical Security Hardening.

Tasks:

1. Remove hardcoded Supabase URLs from wrangler.toml and code.
2. Use environment variables and Wrangler secrets.
3. Implement DOMPurify sanitization in frontend.
4. Replace custom hash function with Web Crypto API SHA-256.
5. Standardize all API error responses to JSON format.
6. Ensure no secret appears in frontend bundle.

Return:
- Updated code snippets
- Confirmation of secret usage
- Confirmation XSS protection active
- Confirmation SHA-256 used for embedding_hash

We are executing Phase 2 — Data Integrity & Deduplication.

Tasks:

1. Normalize question text before hashing.
2. Generate SHA-256 hash per question.
3. Store hash in embedding_hash column.
4. Add UNIQUE constraint on embedding_hash.
5. Implement regeneration logic if duplicate conflict occurs.
6. Add transaction-safe batch insertion.
7. Backfill hashes for existing MCQs.

Return:
- Confirmation no NULL hashes
- Confirmation no duplicate hashes
- SQL for UNIQUE constraint
- Sample hash values

We are executing Phase 3 — Math Formatting & Content Quality Upgrade.

Tasks:

1. Update generator templates to use LaTeX properly.
2. Ensure inline math uses $...$
3. Ensure display math uses $$...$$
4. Remove placeholder stems and debug patterns.
5. Increase conceptual depth.
6. Validate math formatting before insertion.
7. Confirm KaTeX rendering compatibility.

Return:
- 5 sample high-quality MCQs
- Confirmation no placeholder patterns
- Confirmation LaTeX validated

We are executing Phase 4 — Code Quality & Testing Infrastructure.

Tasks:

1. Create test suite for:
   - Hash generation
   - Dedup logic
   - Batch insertion
   - Math formatting
2. Add JSDoc or TypeScript types.
3. Standardize API response schema.
4. Add npm audit integration.
5. Ensure test coverage for generation logic.

Return:
- Test file structure
- Example test cases
- Coverage summary

We are executing Phase 5 — Performance & Optimization.

Tasks:

1. Optimize dedup query logic.
2. Add DB index checks.
3. Add caching headers to frontend assets.
4. Implement pagination for batch history.
5. Add performance logging metrics.

Return:
- Query optimization explanation
- Index summary
- Performance benchmark comparison

We are executing Phase 6 — Advanced Platform Enhancements.

Choose enhancements:

- Exam mode with timer
- Score tracking
- Daily streak logic
- Semantic duplicate detection
- Difficulty adaptive generation

Implement selected features without breaking existing integrity.

We are performing a full rendering and API stability fix.

The platform currently has:

1. Broken LaTeX rendering (e.g. "\vec{a}" becomes "veca")
2. Stripped backslashes in equations
3. Malformed vector and operator notation
4. Occasional "Failed to fetch" API errors

We need a clean and definitive fix.

----------------------------------------
PART 1 — LaTeX Integrity Fix
----------------------------------------

1. Ensure generator always produces valid LaTeX:
   - Use proper syntax: \vec{a}, \times, \cdot, \sqrt{...}
   - Never produce malformed forms like veca, sqrt2, logx
   - Always wrap inline math with $...$
   - Wrap complex expressions with $$...$$

2. Ensure backslashes are preserved:
   - Double escape backslashes when storing in JSON (\\vec{a})
   - Confirm Supabase stores raw backslashes correctly
   - Do not strip "\" during sanitization

3. Ensure sanitization does NOT remove LaTeX:
   - DOMPurify must allow backslash sequences
   - Only sanitize HTML tags, not math expressions

4. Add validation rule:
   - If math expression loses "\" characters, reject and regenerate

----------------------------------------
PART 2 — Rendering Stability
----------------------------------------

1. Ensure KaTeX render is triggered AFTER DOM insertion.
2. Render only inside specific container, not entire document.
3. Add try-catch around renderMathInElement.
4. Log math rendering errors without breaking page.

----------------------------------------
PART 3 — Fetch Stability Fix
----------------------------------------

1. Fix "Failed to fetch":
   - Ensure Worker returns proper JSON with correct CORS headers.
   - Add Access-Control-Allow-Origin: *
   - Ensure all endpoints return JSON.
   - Add proper error handling in fetch().

2. Add frontend retry logic:
   - If fetch fails, retry once.
   - Show user-friendly error message.
   - Do not crash UI.

----------------------------------------
PART 4 — Defensive Safeguards
----------------------------------------

1. Add regex validation:
   - Reject strings containing:
     "veca"
     "times"
     "cdot"
     "sqrt2"
   unless properly formatted with "\"

2. Add post-insert validation query:
   - Check for malformed LaTeX patterns in DB.
   - Log errors if detected.

----------------------------------------
OUTPUT REQUIRED
----------------------------------------

Return:

1. Updated generator code snippet.
2. Updated frontend render snippet.
3. Updated fetch error handling snippet.
4. Confirmation LaTeX escaping preserved.
5. Confirmation CORS headers fixed.
6. Confirmation malformed vector expressions eliminated.

We are migrating the DDCET MCQ platform from a Worker-served SPA to a proper split architecture:

Worker = API only
Pages.dev = Frontend only

The current mixed setup causes:
- Intermittent "Failed to fetch"
- Rendering race conditions
- LaTeX escaping inconsistencies
- Backslash stripping issues

We need a clean architectural separation.

-----------------------------------------
PART 1 — WORKER RESTRUCTURE (API ONLY)
-----------------------------------------

1. Remove any SPA / HTML serving from Worker.
2. Worker must return JSON only.
3. All endpoints must respond with:
   - Proper JSON
   - Correct CORS headers:
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: GET, POST, OPTIONS
     Access-Control-Allow-Headers: Content-Type, X-Generation-Secret

4. Add OPTIONS handler for preflight requests.
5. Ensure all responses include:
   Content-Type: application/json

6. Confirm:
   - No service keys exposed.
   - No frontend bundle served from Worker.

Return updated Worker structure.

-----------------------------------------
PART 2 — CLOUDFLARE PAGES FRONTEND
-----------------------------------------

Create a new /pages folder with:

/pages/public/index.html
/pages/public/app.js
/pages/public/styles.css

Frontend requirements:

1. Fetch MCQs from Worker API using safeFetch wrapper.
2. Implement retry-once logic for failed fetch.
3. Gracefully handle API errors.
4. Render MCQs cleanly.
5. After DOM insertion, trigger KaTeX rendering only inside container.
6. Ensure LaTeX backslashes are preserved.
7. No stripping of "\" characters.
8. No malformed expressions like:
   veca
   times
   cdot
   sqrt2

9. Add proper math validation fallback:
   - If KaTeX fails, log error but do not crash UI.

-----------------------------------------
PART 3 — ENVIRONMENT CONFIG
-----------------------------------------

Provide exact Cloudflare Pages configuration:

- Framework preset
- Build command
- Build output directory
- Required environment variables:
  PUBLIC_API_URL

Ensure Worker URL is injected via env var, not hardcoded.

-----------------------------------------
PART 4 — FINAL VERIFICATION CHECKLIST
-----------------------------------------

Return:

1. Worker API structure.
2. Pages folder structure.
3. Updated fetch code snippet.
4. Updated KaTeX render snippet.
5. CORS headers implementation.
6. Confirmation that:
   - Backslashes are preserved.
   - No LaTeX corruption.
   - Failed fetch handled gracefully.
   - Rendering stable.

-----------------------------------------

Do NOT remove any existing security hardening.
Do NOT weaken hashing or deduplication logic.
Preserve all Phase 1–5 improvements.

This is an architectural separation task, not a rewrite.
