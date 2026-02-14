import { createHash } from "./utils.js";

/**
 * Validate a single MCQ object for structural correctness.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateMCQ(mcq, index) {
  const errors = [];

  if (!mcq.question || typeof mcq.question !== "string" || mcq.question.trim().length < 10) {
    errors.push(`MCQ #${index + 1}: question is missing or too short`);
  }

  for (const opt of ["option_a", "option_b", "option_c", "option_d"]) {
    if (!mcq[opt] || typeof mcq[opt] !== "string" || mcq[opt].trim().length === 0) {
      errors.push(`MCQ #${index + 1}: ${opt} is missing or empty`);
    }
  }

  if (!["A", "B", "C", "D"].includes(mcq.correct_answer)) {
    errors.push(`MCQ #${index + 1}: correct_answer must be A, B, C, or D — got "${mcq.correct_answer}"`);
  }

  if (!["Maths", "Physics"].includes(mcq.subject)) {
    errors.push(`MCQ #${index + 1}: subject must be Maths or Physics — got "${mcq.subject}"`);
  }

  if (!["Easy", "Medium", "Hard"].includes(mcq.difficulty)) {
    errors.push(`MCQ #${index + 1}: difficulty must be Easy, Medium, or Hard — got "${mcq.difficulty}"`);
  }

  if (!mcq.topic || typeof mcq.topic !== "string" || mcq.topic.trim().length === 0) {
    errors.push(`MCQ #${index + 1}: topic is missing`);
  }

  // Check for banned patterns
  const allOptions = [mcq.option_a, mcq.option_b, mcq.option_c, mcq.option_d]
    .filter(Boolean)
    .map((o) => o.toLowerCase());

  for (const opt of allOptions) {
    if (opt.includes("all of the above") || opt.includes("none of the above")) {
      errors.push(`MCQ #${index + 1}: contains banned "All/None of the above" option`);
    }

    // STRICT HYGIENE: No placeholders
    if (opt.includes("correct") || opt.includes("distractor")) {
      errors.push(`MCQ #${index + 1}: option contains blocked placeholder text ("correct" or "distractor")`);
    }

    // Hash/ID pattern check (e.g., abc123 or #123)
    if (/[a-z0-9]{6}/.test(opt) || /#[0-9]/.test(opt)) {
      // Only trigger if it looks like a debug hash, not a real word
      const words = opt.split(/\s+/);
      for (const w of words) {
        if (/[a-z]{3,}[0-9]{1,}/.test(w) || /[0-9]{1,}[a-z]{3,}/.test(w)) {
          errors.push(`MCQ #${index + 1}: option contains potential debug hash or ID fragment ("${w}")`);
        }
      }
    }
  }

  // LaTeX check for math-heavy subjects
  if (mcq.subject === "Maths" || mcq.topic === "Units & Measurements" || mcq.topic === "Viscosity" || mcq.topic === "Elasticity" || mcq.topic === "Surface Tension") {
    // Check for obvious math symbols or common functions (removed _ to avoid placeholder issues)
    const mathRegex = /\\|\{|\}|\^|∫|∑|π|θ|\b(sin|cos|tan|log|sec|cosec|cot)\b/;
    
    const parts = [
      { text: mcq.question, name: "question" },
      { text: mcq.option_a, name: "option_a" },
      { text: mcq.option_b, name: "option_b" },
      { text: mcq.option_c, name: "option_c" },
      { text: mcq.option_d, name: "option_d" },
    ];

    for (const part of parts) {
      if (mathRegex.test(part.text) && !part.text.includes("$") && !part.text.includes("\\(")) {
        errors.push(`MCQ #${index + 1}: ${part.name} contains math symbols but missing LaTeX delimiters ($ or \\()`);
      }
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

  if (counts.Maths !== 50) allErrors.push(`Maths count: expected 50, got ${counts.Maths}`);
  if (counts.Physics !== 50) allErrors.push(`Physics count: expected 50, got ${counts.Physics}`);
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
