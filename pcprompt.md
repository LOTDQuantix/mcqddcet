
Full Project Deep Audit – DDCET MCQ Platform (Worker-less Architecture)

Perform a complete technical and content audit of the current repository.

Architecture:
- Cloudflare Pages frontend
- Direct Supabase REST (PostgREST)
- No Worker layer
- Local scripts for generation
- RLS enabled (anon = SELECT only)
- KaTeX for math rendering
- DOMPurify integrated

Audit Scope:

----------------------------------------
1. FRONTEND LOGIC AUDIT
----------------------------------------

- Practice mode repetition logic
- Exam mode stability
- Pagination correctness
- Fetch implementation
- Retry logic correctness
- Memory/session state handling
- Duplicate question prevention
- Proper stop condition when exhausted

Detect:
- Infinite loops
- Re-fetch loops
- Incorrect slicing
- Randomization bias
- State reset bugs

----------------------------------------
2. SUPABASE + RLS AUDIT
----------------------------------------

- Verify RLS policies correctness
- Confirm anon cannot INSERT/UPDATE/DELETE
- Check REST queries efficiency
- Verify use of count=exact
- Detect missing indexes
- Check for performance bottlenecks

----------------------------------------
3. DATA QUALITY AUDIT
----------------------------------------

Scan entire mcqs table for:

- Meaningless fragments (e.g., "pm2", "veca", "cdot", "times")
- Broken LaTeX
- Missing braces in LaTeX
- Unbalanced $ delimiters
- Duplicate semantic questions
- Truncated options
- Empty fields
- Invalid difficulty/subject tags

Return:
- Exact count of malformed rows
- IDs of suspicious rows
- Severity classification

----------------------------------------
4. KATEX RENDERING PIPELINE AUDIT
----------------------------------------

- Ensure renderMathInElement is called correctly
- Detect double sanitization
- Detect backslash stripping
- Verify render timing
- Confirm no raw LaTeX leaks
- Ensure no DOMPurify corruption of math

----------------------------------------
5. PERFORMANCE + STRUCTURE
----------------------------------------

- Large dataset behavior
- Fetch batching strategy
- Offset/limit usage
- Random ordering efficiency
- Browser memory growth risks
- SPA route logic stability

----------------------------------------
6. CODE STRUCTURE QUALITY
----------------------------------------

- Redundant functions
- Dead code
- Security regression risks
- Hardcoded values
- Environment variable misuse
- Console.log leftovers

----------------------------------------

Deliverables:

1. Structured report
2. Critical issues (must fix)
3. Moderate issues
4. Minor improvements
5. Suggested refactors
6. Risk score (0–10)
7. Production readiness score

Be strict.
Do not sugarcoat.
Assume real-world scaling to 10,000+ MCQs.

Do not propose reintroducing Worker.
Do not suggest rewriting architecture.
Audit within current Pages → Supabase model.
