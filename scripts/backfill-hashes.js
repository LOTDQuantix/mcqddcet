import { createClient } from "@supabase/supabase-js";
import { createHash } from "../src/utils.js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function backfill() {
    console.log("🔍 Starting backfill of embedding_hash...");

    let from = 0;
    const PAGE_SIZE = 500;
    let updatedCount = 0;

    while (true) {
        const { data, error } = await supabase
            .from("mcqs")
            .select("id, question")
            .is("embedding_hash", null)
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            console.error("❌ Error fetching MCQs:", error.message);
            break;
        }

        if (!data || data.length === 0) break;

        console.log(`Processing ${data.length} records...`);

        for (const row of data) {
            const hash = await createHash(row.question);
            const { error: updateErr } = await supabase
                .from("mcqs")
                .update({ embedding_hash: hash })
                .eq("id", row.id);

            if (updateErr) {
                console.warn(`⚠️ Failed to update ID ${row.id}: ${updateErr.message}`);
            } else {
                updatedCount++;
            }
        }

        if (data.length < PAGE_SIZE) break;
        // Since we are filtering by IS NULL, we don't necessarily need to increment 'from' 
        // if we are updating them as we go, but safety first.
        // Actually, if we update them, they won't appear in the next 'IS NULL' fetch.
    }

    console.log(`\n✅ Backfill complete. Updated ${updatedCount} records.`);
}

backfill();
