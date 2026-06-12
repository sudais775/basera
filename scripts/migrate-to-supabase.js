require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('your-project-ref')) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY in .env first (copy .env.example).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const cities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cities.json'), 'utf-8'));
  const rows = cities.map(c => ({ slug: c.slug, data: c }));

  const { error } = await supabase.from('cities').upsert(rows, { onConflict: 'slug' });

  if (error) {
    console.error('Upload failed:', error.message);
    process.exit(1);
  }
  console.log(`Uploaded ${rows.length} cities to Supabase.`);
}

main();
