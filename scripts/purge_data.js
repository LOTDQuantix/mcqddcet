import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load from .dev.vars if exists (it's formatted like env file)
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

async function purgeAll() {
    console.log("🚀 Starting full data purge...");

    try {
        // Truncate tables with cascade
        // Note: logs references batches. mcqs references batches.
        
        console.log("Cleaning 'logs'...");
        const { error: logErr } = await supabase.from("logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (logErr) throw logErr;

        console.log("Cleaning 'mcqs'...");
        const { error: mcqErr } = await supabase.from("mcqs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (mcqErr) throw mcqErr;

        console.log("Cleaning 'batches'...");
        const { error: batchErr } = await supabase.from("batches").delete().neq("id", "NON_EXISTENT");
        if (batchErr) throw batchErr;

        console.log("✅ All tables purged successfully.");
    } catch (error) {
        console.error("❌ Purge failed:", error.message);
        process.exit(1);
    }
}

purgeAll();
