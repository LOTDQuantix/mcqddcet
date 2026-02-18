import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { generateDailyBatch } from "../src/generator.js";
import { validateBatch } from "../src/validator.js";
import { insertMCQs, createBatchRecord, saveBatchLogs } from "../src/storage.js";
import { createHash } from "../src/utils.js";
import { fetchExistingHashes, deduplicateBatch } from "../src/deduplicator.js";

// Load from .dev.vars
const devVarsPath = path.join(process.cwd(), ".dev.vars");
if (fs.existsSync(devVarsPath)) {
    const content = fs.readFileSync(devVarsPath, "utf-8");
    content.split("\n").forEach(line => {
        const [key, ...val] = line.split("=");
        if (key && val) {
            process.env[key.trim()] = val.join("=").trim().replace(/^"(.*)"$/, "$1");
        }
    });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🌟 Starting Batch 2 Generation (DDCET_DAY2_BATCH2)...");

    // 1. Fetch Existing Hashes for Deduplication
    console.log("Fetching existing hashes from database...");
    const existingHashes = await fetchExistingHashes(supabase);
    console.log(`Found ${existingHashes.size} existing questions.`);

    // 2. Generate and Deduplicate until we have 100
    console.log("Generating and deduplicating 100 fresh MCQs...");
    let finalBatch = [];
    const MAX_ATTEMPTS = 5;
    let attempts = 0;

    while (finalBatch.length < 100 && attempts < MAX_ATTEMPTS) {
        let rawMcqs = generateDailyBatch();
        const { clean } = deduplicateBatch(rawMcqs, existingHashes);

        for (const q of clean) {
            if (finalBatch.length < 100 && !finalBatch.find(f => f.embedding_hash === q.embedding_hash)) {
                finalBatch.push(q);
            }
        }
        attempts++;
        if (finalBatch.length < 100) {
            console.log(`[!] Still need ${100 - finalBatch.length} more. Attempt ${attempts} complete.`);
        }
    }

    if (finalBatch.length < 100) {
        console.error(`❌ Failed to reach 100 unique MCQs after ${MAX_ATTEMPTS} attempts. Got ${finalBatch.length}.`);
        process.exit(1);
    }

    // 4. Validate
    console.log("Validating hygiene and distribution...");
    const validation = validateBatch(finalBatch);
    if (!validation.valid) {
        console.error("❌ Validation Failed!");
        console.error(JSON.stringify(validation.details, null, 2));
        process.exit(1);
    }
    console.log("✅ Validation Passed (Hygiene & Distribution).");

    // 5. Insert
    const batchId = "DDCET_DAY2_BATCH2";
    console.log(`Inserting Batch ${batchId}...`);

    const { inserted, errors } = await insertMCQs(supabase, finalBatch, batchId);
    if (errors.length > 0) {
        console.error("❌ Insertion errors:", errors);
        process.exit(1);
    }

    // 6. Batch Record & Logs
    await createBatchRecord(supabase, {
        id: batchId,
        total_questions: inserted,
        subject_distribution: validation.distribution,
        difficulty_distribution: { Easy: 30, Medium: 40, Hard: 30 },
        status: 'completed'
    });

    const logs = [
        { agent_name: "Deduplicator", log_content: `Verified uniqueness against ${existingHashes.size} existing items.` },
        { agent_name: "Generator", log_content: "Produced 100 conceptual MCQs using Batch 2 Premium Bank. 10% Depth increase." },
        { agent_name: "Validator", log_content: "Applied strict LaTeX and hygiene rules." },
        { agent_name: "Storage", log_content: `Successfully inserted ${inserted} records into 'mcqs' for Batch 2.` }
    ];
    await saveBatchLogs(supabase, batchId, logs);

    console.log(`🚀 SUCCESS: Batch 2 is LIVE with ${inserted} items.`);

    // Sample Output
    console.log("\n--- SAMPLE MCQS (BATCH 2) ---");
    finalBatch.slice(0, 3).forEach((q, i) => {
        console.log(`\n[#${i + 1}] ${q.question}`);
        console.log(`Options: A: ${q.option_a} | B: ${q.option_b} | C: ${q.option_c} | D: ${q.option_d}`);
        console.log(`Correct: ${q.correct_answer}`);
    });
}

run().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
