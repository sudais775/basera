require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-project-ref'));

const supabase = useSupabase ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const localCities = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cities.json'), 'utf-8'));

async function getCities() {
  if (!useSupabase) return localCities;
  const { data, error } = await supabase.from('cities').select('data');
  if (error) {
    console.error('Supabase error, falling back to local data:', error.message);
    return localCities;
  }
  return data.map(row => row.data);
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/continents', async (req, res) => {
  const cities = await getCities();
  res.json([...new Set(cities.map(c => c.continent))].sort());
});

app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const { continent, max_budget, min_safety, min_affordability, digital_nomad } = req.query;

  let results = await getCities();

  if (q) {
    results = results.filter(c =>
      c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );
  }
  if (continent) {
    results = results.filter(c => c.continent === continent);
  }
  if (max_budget) {
    results = results.filter(c => c.monthly_budget_single <= Number(max_budget));
  }
  if (min_safety) {
    results = results.filter(c => c.scores.safety >= Number(min_safety));
  }
  if (min_affordability) {
    results = results.filter(c => c.scores.affordability >= Number(min_affordability));
  }
  if (digital_nomad === 'true') {
    results = results.filter(c => {
      const dn = c.visa.digital_nomad.toLowerCase();
      return dn.includes('available') && !dn.startsWith('not');
    });
  }

  res.json(results);
});

app.get('/api/city/:slug', async (req, res) => {
  const cities = await getCities();
  const city = cities.find(c => c.slug === req.params.slug);
  if (!city) return res.status(404).json({ error: 'City not found' });
  res.json(city);
});

app.listen(PORT, () => {
  console.log(`Basera running at http://localhost:${PORT} (data source: ${useSupabase ? 'Supabase' : 'local JSON'})`);
});
