import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars
const devVars = fs.readFileSync(path.resolve('.dev.vars'), 'utf8');
const env = {};
devVars.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function audit() {
    console.log('--- STARTING QUALITY AUDIT ---');
    const { data, error } = await supabase.from('mcqs').select('*');
    if (error) {
        console.error('Error fetching data:', error.message);
        return;
    }

    const patterns = [
        { name: 'pm2 fragment', regex: /^pm\d+$/i },
        { name: 'meaningless short', regex: /^[a-z]{1,3}\d?$/i },
        { name: 'cdot fragment', regex: /cdot/i },
        { name: 'times fragment', regex: /times/i }
    ];

    let malformedCount = 0;
    data.forEach(row => {
        const options = [row.option_a, row.option_b, row.option_c, row.option_d];
        const isMalformed = options.some(o => patterns.some(p => p.regex.test(o.trim())));

        // At least one option must contain a number, a LaTeX symbol ($), or be reasonably long (> 4 chars)
        const hasValue = options.some(opt =>
            /\d/.test(opt) ||
            opt.includes('$') ||
            opt.trim().length > 5
        );

        if (isMalformed || !hasValue) {
            malformedCount++;
            console.log(`\n[MALFORMED] ID: ${row.id}`);
            console.log(`Question: ${row.question}`);
            console.log(`Options: A: ${row.option_a} | B: ${row.option_b} | C: ${row.option_c} | D: ${row.option_d}`);
        }
    });

    console.log(`\n--- AUDIT COMPLETE ---`);
    console.log(`Total Malformed Entries: ${malformedCount}`);
}

audit().catch(console.error);
