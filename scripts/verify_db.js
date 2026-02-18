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
    const { data: mcqs, error } = await supabase.from("mcqs")
        .select("*")
        .ilike("question", "%becomes double%")
        .limit(1);

    if (error) {
        console.error(error);
    } else if (mcqs.length > 0) {
        const q = mcqs[0];
        console.log("EXACT DB STRINGS (JSON):");
        console.log(`Question: ${JSON.stringify(q.question)}`);
        console.log(`A: ${JSON.stringify(q.option_a)}`);
        console.log(`B: ${JSON.stringify(q.option_b)}`);
        console.log(`C: ${JSON.stringify(q.option_c)}`);
        console.log(`D: ${JSON.stringify(q.option_d)}`);
    } else {
        console.log("MCQ NOT FOUND");
    }
}

check();
