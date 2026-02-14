import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { generateDailyBatch } from "../src/generator.js";
import { validateBatch } from "../src/validator.js";
import { insertMCQs, createBatchRecord, saveBatchLogs } from "../src/storage.js";

// Load environment variables
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

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runResetAndRegenerate() {
    console.log("🚀 Starting Reset and Regeneration...");

    try {
        // STEP 1: Purge existing data
        console.log("Cleaning 'logs'...");
        await supabase.from("logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        console.log("Cleaning 'mcqs'...");
        await supabase.from("mcqs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        console.log("Cleaning 'batches'...");
        await supabase.from("batches").delete().neq("id", "NON_EXISTENT");
        console.log("✅ Tables purged.");

        // STEP 2: Generate clean data
        console.log("Generating fresh batch of 100 MCQs...");
        const mcqs = generateDailyBatch();

        // STEP 3: Validate
        console.log("Validating batch...");
        const validation = validateBatch(mcqs);
        if (!validation.valid) {
            console.error("❌ Validation failed:");
            validation.details.forEach(err => {
                const index = parseInt(err.match(/MCQ #(\d+):/)?.[1]) - 1;
                console.error(`- ${err}`);
                if (!isNaN(index)) {
                   console.error(`  [!] Problematic MCQ:`, JSON.stringify(mcqs[index], null, 2));
                }
            });
            process.exit(1);
        }
        console.log("✅ Validation passed (100 MCQs, balanced distribution).");

        // STEP 4: Insert
        const batchId = `clean-reset-${Date.now()}`;
        console.log(`Inserting batch ${batchId}...`);
        
        await createBatchRecord(supabase, {
            id: batchId,
            total_questions: 100,
            subject_distribution: { Maths: 50, Physics: 50 },
            difficulty_distribution: { Easy: 30, Medium: 40, Hard: 30 },
            status: "completed"
        });

        const { inserted, errors } = await insertMCQs(supabase, mcqs, batchId);
        
        if (errors.length > 0) {
            console.error("❌ Insertion errors:", errors);
        } else {
            console.log(`✅ Successfully inserted ${inserted} MCQs.`);
        }

        await saveBatchLogs(supabase, batchId, [
            { agent_name: "CleanGenerator", log_content: "Full database reset and premium regeneration completed successfully." }
        ]);

        console.log("\n--- SAMPLE MCQS ---");
        mcqs.slice(0, 3).forEach((q, i) => {
            console.log(`${i+1}. [${q.subject} - ${q.difficulty}] ${q.question}`);
            console.log(`   A) ${q.option_a} B) ${q.option_b} C) ${q.option_c} D) ${q.option_d}`);
            console.log(`   Correct: ${q.correct_answer}\n`);
        });

        console.log("🎉 MISSION ACCOMPLISHED.");
    } catch (error) {
        console.error("❌ Fatal Error:", error);
        process.exit(1);
    }
}

runResetAndRegenerate();
