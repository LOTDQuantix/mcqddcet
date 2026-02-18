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
    const queries = [
        { name: 'Short meaningless options', filter: 'option_a.ilike._,option_a.ilike.__,option_a.ilike.___|option_b.ilike._,option_b.ilike.__,option_b.ilike.___|option_c.ilike._,option_c.ilike.__,option_c.ilike.___|option_d.ilike._,option_d.ilike.__,option_d.ilike.___' },
        { name: 'Fragments without backslash', filter: 'question.ilike.%pm%,option_a.ilike.%pm%,option_b.ilike.%pm%,option_c.ilike.%pm%,option_d.ilike.%pm%' },
    ];

    for (const q of queries) {
        console.log(`\n--- Auditing: ${q.name} ---`);
        const { data, error, count } = await supabase
            .from('mcqs')
            .select('id, question, option_a, option_b, option_c, option_d', { count: 'exact' })
            .or(q.filter);

        if (error) {
            console.error('Error:', error.message);
        } else {
            console.log('Count:', count);
            if (data && data.length > 0) {
                console.table(data.slice(0, 10));
            }
        }
    }
}

audit().catch(console.error);
