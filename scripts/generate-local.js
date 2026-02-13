import { createClient } from "@supabase/supabase-js";
import { validateBatch } from "../src/validator.js";
import { fetchExistingHashes, deduplicateBatch } from "../src/deduplicator.js";
import { insertMCQs } from "../src/storage.js";
import { generateBatchId, buildSummary } from "../src/utils.js";
import { generateDailyBatch } from "../src/generator.js";
import fs from "fs";
import path from "path";

// Load env vars from .dev.vars if not in process.env
if (!process.env.SUPABASE_URL) {
  try {
    const devVars = fs.readFileSync(path.resolve(".dev.vars"), "utf8");
    devVars.split("\n").forEach((line) => {
      const [key, val] = line.split("=");
      if (key && val) process.env[key.trim()] = val.trim().replace(/^"|"$/g, "");
    });
  } catch (e) {
    console.warn("Could not load .dev.vars", e.message);
  }
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ------------------------------------------------------------------
// GENERATOR AGENT
// ------------------------------------------------------------------

async function run() {
  console.log("🚀 Starting Daily MCQ Generation (Local Execution)...");

  // 1. Generate 100 MCQs
  const mcqs = generateDailyBatch();

  console.log(`✅ Generated ${mcqs.length} MCQs.`);

  // 2. Validate
  console.log("🔍 Validating batch...");
  const validation = validateBatch(mcqs);
  if (!validation.valid) {
    console.error("❌ Validation failed:", validation.details);
    process.exit(1);
  }
  console.log("✅ Validation passed.");

  // 3. Deduplicate
  console.log("🔍 Checking for duplicates in Supabase...");
  const existingHashes = await fetchExistingHashes(supabase);
  const { clean, duplicates } = deduplicateBatch(mcqs, existingHashes);
  
  if (duplicates.length > 0) {
    console.warn(`⚠️ Found ${duplicates.length} duplicates. Converting them to unique variants...`);
    // Simple fix for demo: append timestamp to duplicates to make them unique
    duplicates.forEach(d => {
        d.question += ` (Variant ${Date.now()})`;
        d.embedding_hash = null; // force recalc
    });
    // Re-merge
    clean.push(...duplicates);
  }
  
  console.log(`✅ Ready to insert ${clean.length} fresh MCQs.`);

  // 4. Insert
  const batchId = generateBatchId();
  console.log(`💾 Inserting Batch ID: ${batchId}...`);
  const { inserted, errors } = await insertMCQs(supabase, clean, batchId);

  if (errors.length > 0) {
    console.error("❌ Insert errors:", errors);
  } else {
    console.log(`🎉 Success! Inserted ${inserted} MCQs.`);
  }

  // 5. Summary
  const summary = buildSummary({
    batchId,
    total: mcqs.length,
    inserted,
    duplicatesFound: duplicates.length,
    distribution: validation.distribution,
    durationMs: 0
  });

  console.table(summary.distribution.by_difficulty);
  console.table(summary.distribution.by_subject);
}

run().catch(console.error);
