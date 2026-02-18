import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { createHash } from "../src/utils.js";

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

async function backfill() {
    console.log("🛠️ Starting Hash Backfill...");

    // 1. Fetch all rows where embedding_hash is null
    const { data: mcqs, error: fetchError } = await supabase
        .from("mcqs")
        .select("id, question")
        .is("embedding_hash", null);

    if (fetchError) {
        console.error("❌ Error fetching MCQs:", fetchError.message);
        process.exit(1);
    }

    console.log(`Found ${mcqs.length} rows with NULL hashes.`);

    if (mcqs.length === 0) {
        console.log("✅ No rows to backfill.");
        return;
    }

    // 2. Update each row with a new SHA-256 hash
    let updated = 0;
    for (const mcq of mcqs) {
        const hash = createHash(mcq.question);
        const { error: updateError } = await supabase
            .from("mcqs")
            .update({ embedding_hash: hash })
            .eq("id", mcq.id);

        if (updateError) {
            console.error(`❌ Failed to update ID ${mcq.id}:`, updateError.message);
        } else {
            updated++;
        }

        if (updated % 50 === 0) console.log(`Progress: ${updated}/${mcqs.length}...`);
    }

    console.log(`🚀 Backfill complete. Updated ${updated} rows.`);
}

backfill().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
