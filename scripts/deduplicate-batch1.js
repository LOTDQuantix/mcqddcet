import fs from 'fs';
import { createSupabaseClient } from '../src/supabase.js';
import { fetchExistingHashes, deduplicateBatch } from '../src/deduplicator.js';

// Manual env load for local script
const env = Object.fromEntries(
    fs.readFileSync('.dev.vars', 'utf8')
        .split('\n')
        .filter(line => line.includes('='))
        .map(line => line.split('=').map(s => s.trim()))
);
process.env.SUPABASE_URL = env.SUPABASE_URL;
process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

async function run() {
    const data = JSON.parse(fs.readFileSync('data/DDCET_DAY1_BATCH1.json', 'utf8'));
    const supabase = createSupabaseClient(process.env);

    console.log('Fetching hashes...');
    const existingHashes = await fetchExistingHashes(supabase);
    console.log(`Found ${existingHashes.size} historical hashes.`);

    const { clean, duplicates } = deduplicateBatch(data, existingHashes);

    console.log(`Deduplication Result: ${clean.length} clean, ${duplicates.length} duplicates.`);

    if (duplicates.length > 0) {
        console.log('Duplicates found:', duplicates.map(d => d.question));
    }

    process.exit(0);
}

run();
