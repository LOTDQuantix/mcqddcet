import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load env vars
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

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function cleanMath(text) {
    if (!text) return text;

    let cleaned = text;

    // 1. Reduce any sequence of 2 or more backslashes to just 1
    // This fixes the over-escaping issue (e.g., \\\\\\\\ -> \)
    cleaned = cleaned.replace(/\\+/g, '\\');

    // 2. Fix cases where $ was escaped or misplaced (e.g. \$ or $ $)
    // For now, let's just make sure common symbols are correctly escaped for KaTeX
    // KaTeX likes \circ, \theta, etc.

    // 3. Special case: If we see something like 0^\circC that lacks dollars, wrap it.
    // This is risky but helpful for corrupted data.
    // Let's focus on fixing the backslashes first as that's the main culprit.

    return cleaned;
}

async function runCleanup() {
    console.log("🧼 Starting Math Cleanup...");

    const { data: mcqs, error } = await supabase.from("mcqs").select("*");
    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    console.log(`🔍 Processing ${mcqs.length} records...`);

    for (const q of mcqs) {
        const newQ = cleanMath(q.question);
        const newA = cleanMath(q.option_a);
        const newB = cleanMath(q.option_b);
        const newC = cleanMath(q.option_c);
        const newD = cleanMath(q.option_d);

        if (newQ !== q.question || newA !== q.option_a || newB !== q.option_b || newC !== q.option_c || newD !== q.option_d) {
            const { error: updateError } = await supabase
                .from("mcqs")
                .update({
                    question: newQ,
                    option_a: newA,
                    option_b: newB,
                    option_c: newC,
                    option_d: newD
                })
                .eq("id", q.id);

            if (updateError) {
                console.error(`❌ Failed to update Q ID ${q.id}:`, updateError);
            } else {
                console.log(`✅ Cleaned Q ID ${q.id}`);
            }
        }
    }

    console.log("✨ Cleanup Finished!");
}

runCleanup().catch(console.error);
