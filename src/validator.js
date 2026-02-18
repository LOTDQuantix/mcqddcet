import { createHash } from "./utils.js";

/**
 * Validate a single MCQ object for structural correctness.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateMCQ(mcq, index) {
  const errors = [];

  // --- Content Quality Enforcement (Phase 5) ---

  // 1. Minimum length checks
  if (mcq.question.trim().length < 10) {
    errors.push(`MCQ #${index + 1}: question is too short (< 10 chars)`);
  }

  const options = [mcq.option_a, mcq.option_b, mcq.option_c, mcq.option_d];
  options.forEach((opt, i) => {
    const key = ["A", "B", "C", "D"][i];
    if (!opt || opt.trim().length < 2) {
      errors.push(`MCQ #${index + 1}: Option ${key} is too short or empty`);
    }

    // 2. Reject meaningless or malformed fragments (e.g., "pm2", "veca")
    const meaninglessPatterns = [
      /^pm\d+$/i,             // e.g. pm2
      /^[a-z]\d?$/i,          // e.g. a1, x, y (but allow 2+ char words like "Air")
      /^\\?(cdot|times|sqrt|vec|frac)$/i // LaTeX commands as stand-alone fragments
    ];

    if (meaninglessPatterns.some(p => p.test(opt.trim()))) {
      errors.push(`MCQ #${index + 1}: Option ${key} is a meaningless fragment ("${opt}")`);
    }
  });

  // 3. Mathematical/Conceptual Value Check
  // At least one option must contain a number, a LaTeX symbol ($), or be reasonably long (>= 3 chars)
  const hasValue = options.some(opt =>
    /\d/.test(opt) ||
    opt.includes('$') ||
    opt.trim().length >= 3
  );

  if (!hasValue) {
    errors.push(`MCQ #${index + 1}: no option contains mathematical or conceptual value`);
  }

  // 4. Reject common broken LaTeX patterns
  const brokenPatterns = [
    /\\\%\\\%\\\%/,        // %%%
    /tan\^2(?!\w)/,        // tan^2 without $
    /\b(sqrt|vec|cdot|times)\b(?![\\\$])/i // missing backslashes/delimiters
  ];

  if (brokenPatterns.some(p => p.test(mcq.question))) {
    errors.push(`MCQ #${index + 1}: question contains malformed math notation`);
  }

  // Check for banned patterns (All/None of the above)
  const allOptionsLower = options.map((o) => o?.toLowerCase() || "");
  for (const opt of allOptionsLower) {
    if (opt.includes("all of the above") || opt.includes("none of the above")) {
      errors.push(`MCQ #${index + 1}: contains banned "All/None of the above" option`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate the entire batch of 100 MCQs.
 * Returns { valid, totalErrors, details, distribution }
 */
export function validateBatch(mcqs) {
  const allErrors = [];

  if (!Array.isArray(mcqs) || mcqs.length !== 100) {
    allErrors.push(`Batch must contain exactly 100 MCQs — got ${mcqs?.length ?? 0}`);
  }

  // Per-item validation
  mcqs.forEach((mcq, i) => {
    const { errors } = validateMCQ(mcq, i);
    allErrors.push(...errors);
  });

  // Distribution validation
  const counts = { Easy: 0, Medium: 0, Hard: 0, Maths: 0, Physics: 0 };
  for (const mcq of mcqs) {
    if (counts[mcq.difficulty] !== undefined) counts[mcq.difficulty]++;
    if (counts[mcq.subject] !== undefined) counts[mcq.subject]++;
  }

  if (counts.Easy !== 30) allErrors.push(`Easy count: expected 30, got ${counts.Easy}`);
  if (counts.Medium !== 40) allErrors.push(`Medium count: expected 40, got ${counts.Medium}`);
  if (counts.Hard !== 30) allErrors.push(`Hard count: expected 30, got ${counts.Hard}`);

  // Check for in-batch duplicates by hash
  const hashes = new Set();
  mcqs.forEach((mcq, i) => {
    const hash = createHash(mcq.question);
    if (hashes.has(hash)) {
      allErrors.push(`MCQ #${i + 1}: duplicate question detected within batch`);
    }
    hashes.add(hash);
  });

  return {
    valid: allErrors.length === 0,
    totalErrors: allErrors.length,
    details: allErrors,
    distribution: counts,
  };
}
