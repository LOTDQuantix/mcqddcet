import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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

async function check() {
    console.log("🧐 Final Database Check...");

    // Total count
    const { count: total, error: e1 } = await supabase.from("mcqs").select("*", { count: "exact", head: true });

    // NULL hashes count
    const { count: nulls, error: e2 } = await supabase.from("mcqs").select("*", { count: "exact", head: true }).is("embedding_hash", null);

    if (e1 || e2) {
        console.error("❌ Error fetching counts:", e1 || e2);
    } else {
        console.log(`✅ Total MCQs: ${total}`);
        console.log(`✅ NULL Hashes: ${nulls}`);

        if (nulls === 0) {
            console.log("🎉 All good! Zero NULL hashes found.");
        } else {
            console.log("⚠️ Warning: Some NULL hashes still remain.");
        }
    }
}

check();
