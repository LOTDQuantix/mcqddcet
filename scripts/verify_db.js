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
    const { count, error } = await supabase.from("mcqs").select("*", { count: "exact", head: true });
    if (error) console.error(error);
    else console.log(`TOTAL MCQS IN DATABASE: ${count}`);

    const { data: batches } = await supabase.from("batches").select("id, total_questions");
    console.log("BATCHES:", batches);
}

check();
