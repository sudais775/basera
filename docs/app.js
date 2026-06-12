const app = document.getElementById('app');

// --- Supabase (read-only, safe to expose) ---
const SUPABASE_URL = 'https://ttuonmnduymoufxvnyhd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fYpIfj-vQQSBKmrqloLCPw_NSb8PFke';
let _citiesCache = null;

async function fetchAllCities() {
  if (_citiesCache) return _citiesCache;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/cities?select=data`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) throw new Error('Supabase fetch failed');
  const rows = await res.json();
  _citiesCache = rows.map(r => r.data).sort((a, b) => a.name.localeCompare(b.name));
  return _citiesCache;
}

const SCORE_LABELS = {
  affordability: 'Affordability',
  safety: 'Safety',
  healthcare: 'Healthcare',
  internet: 'Internet',
  expat_friendliness: 'Expat friendliness'
};

const COST_LABELS = {
  rent_1br_center: '1BR rent (center)',
  rent_1br_outside: '1BR rent (outside center)',
  rent_2br_center: '2BR rent (center)',
  groceries: 'Groceries (monthly)',
  transport_pass: 'Transport pass',
  utilities: 'Utilities',
  internet: 'Internet',
  childcare: 'Childcare (per child)',
  meal_out: 'Meal out (per person)'
};

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function router() {
  const hash = window.location.hash || '#/';
  if (hash.startsWith('#/city/')) {
    const slug = hash.replace('#/city/', '');
    await renderCity(slug);
  } else {
    await renderHome();
    return;
  }
  window.scrollTo(0, 0);
}

const CONTINENTS = ['North America', 'South America', 'Europe', 'Africa', 'Middle East', 'Asia', 'Oceania'];

const filterState = {
  q: '',
  continent: '',
  max_budget: '',
  min_safety: '',
  min_affordability: '',
  digital_nomad: false
};

function pillGroup(options, current) {
  return options.map(([value, label]) => `
    <button type="button" class="pill ${current === value ? 'active' : ''}" data-value="${value}">${label}</button>
  `).join('');
}

function hasActiveFilters() {
  return !!(filterState.q || filterState.continent || filterState.max_budget || filterState.min_safety || filterState.min_affordability || filterState.digital_nomad);
}

async function renderHome() {
  const tabs = CONTINENTS.map(name => `
    <button class="continent-tab ${filterState.continent === name ? 'active' : ''}" data-continent="${name}">${name}</button>
  `).join('');

  app.innerHTML = `
    <section class="hero">
      <h1>Know a place before you move.</h1>
      <p>Search a city to get the full relocation dossier — real costs, visa routes, neighborhoods, and the honest stuff nobody puts in a brochure.</p>
      <div class="search-wrap">
        <input type="text" id="search-input" placeholder="Search by city or country..." value="${escapeHtml(filterState.q)}" autocomplete="off">
      </div>
    </section>

    <section class="map-section">
      <h2>Browse by continent</h2>
      <div class="continent-tabs">${tabs}</div>
      ${filterState.continent ? `<button id="clear-continent" class="chip-clear">Clear continent: ${filterState.continent} &times;</button>` : ''}
    </section>

    <section class="filters">
      <h2>Filters</h2>
      <div class="filters-grid">
        <div class="filter-group">
          <span class="filter-label">Budget (single)</span>
          <div class="pill-row" data-filter="max_budget">
            ${pillGroup([['', 'Any'], ['800', 'Under $800'], ['1200', 'Under $1.2k'], ['2000', 'Under $2k'], ['3000', 'Under $3k']], filterState.max_budget)}
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">Safety</span>
          <div class="pill-row" data-filter="min_safety">
            ${pillGroup([['', 'Any'], ['6', '6+'], ['7', '7+'], ['8', '8+'], ['9', '9+']], filterState.min_safety)}
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">Affordability</span>
          <div class="pill-row" data-filter="min_affordability">
            ${pillGroup([['', 'Any'], ['6', '6+'], ['7', '7+'], ['8', '8+']], filterState.min_affordability)}
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">Visa</span>
          <div class="pill-row" data-filter="digital_nomad">
            ${pillGroup([['false', 'Any'], ['true', 'Nomad visa available']], String(filterState.digital_nomad))}
          </div>
        </div>
        ${hasActiveFilters() ? `<button id="f-clear" class="chip-clear">Clear all filters</button>` : ''}
      </div>
    </section>

    <div id="city-grid" class="city-grid"></div>
  `;

  const input = document.getElementById('search-input');
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  input.addEventListener('input', (e) => { filterState.q = e.target.value; loadCities(); });

  document.querySelectorAll('.continent-tab').forEach(el => {
    el.addEventListener('click', () => {
      const c = el.dataset.continent;
      filterState.continent = filterState.continent === c ? '' : c;
      renderHome();
    });
  });

  const clearContinent = document.getElementById('clear-continent');
  if (clearContinent) clearContinent.addEventListener('click', () => { filterState.continent = ''; renderHome(); });

  document.querySelectorAll('.pill-row').forEach(row => {
    const key = row.dataset.filter;
    row.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const val = pill.dataset.value;
        if (key === 'digital_nomad') {
          filterState.digital_nomad = val === 'true';
        } else {
          filterState[key] = val;
        }
        renderHome();
      });
    });
  });

  const fClear = document.getElementById('f-clear');
  if (fClear) fClear.addEventListener('click', () => {
    filterState.q = ''; filterState.continent = ''; filterState.max_budget = '';
    filterState.min_safety = ''; filterState.min_affordability = ''; filterState.digital_nomad = false;
    renderHome();
  });

  await loadCities();
}

async function loadCities() {
  const grid = document.getElementById('city-grid');
  grid.innerHTML = '<p class="no-results">Loading...</p>';
  try {
    let cities = await fetchAllCities();
    const q = filterState.q.toLowerCase().trim();
    if (q) cities = cities.filter(c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q));
    if (filterState.continent) cities = cities.filter(c => c.continent === filterState.continent);
    if (filterState.max_budget) cities = cities.filter(c => c.monthly_budget_single <= Number(filterState.max_budget));
    if (filterState.min_safety) cities = cities.filter(c => c.scores.safety >= Number(filterState.min_safety));
    if (filterState.min_affordability) cities = cities.filter(c => c.scores.affordability >= Number(filterState.min_affordability));
    if (filterState.digital_nomad) cities = cities.filter(c => {
      const dn = c.visa.digital_nomad.toLowerCase();
      return dn.includes('available') && !dn.startsWith('not');
    });
    if (!cities.length) {
      grid.innerHTML = `<p class="no-results">No cities match these filters. Try loosening them.</p>`;
      return;
    }
    grid.innerHTML = `<p class="result-count">${cities.length} ${cities.length === 1 ? 'city' : 'cities'}</p>` + cities.map(cityCard).join('');
  } catch (err) {
    grid.innerHTML = `<p class="no-results">Something went wrong loading cities.</p>`;
  }
}

const CONTINENT_CLASS = {
  'North America': 'accent-blue',
  'South America': 'accent-green',
  'Europe': 'accent-purple',
  'Africa': 'accent-orange',
  'Middle East': 'accent-pink',
  'Asia': 'accent-teal',
  'Oceania': 'accent-blue'
};

function cityCard(city) {
  const accent = CONTINENT_CLASS[city.continent] || 'accent-blue';
  return `
    <a class="city-card ${accent}" href="#/city/${city.slug}">
      <span class="flag">${city.flag}</span>
      <h3>${escapeHtml(city.name)}</h3>
      <span class="country">${escapeHtml(city.country)}</span>
      <p class="tagline">${escapeHtml(city.tagline)}</p>
      <span class="stamp">
        Single budget
        <span class="stamp-amount">${fmt(city.monthly_budget_single)}/mo</span>
      </span>
    </a>
  `;
}

async function renderCity(slug) {
  app.innerHTML = `<p class="no-results">Loading dossier...</p>`;
  try {
    const cities = await fetchAllCities();
    const c = cities.find(city => city.slug === slug);
    if (!c) {
      app.innerHTML = `
        <a href="#/" class="back-link">&larr; Back to all cities</a>
        <p class="no-results">City not found.</p>
      `;
      return;
    }
    app.innerHTML = cityProfile(c);
  } catch (err) {
    app.innerHTML = `<p class="no-results">Something went wrong loading this dossier.</p>`;
  }
}

function cityProfile(c) {
  const scoreRows = Object.entries(c.scores).map(([key, val]) => `
    <div class="score-row">
      <span class="label">${SCORE_LABELS[key] || key}</span>
      <div class="score-bar-track"><div class="score-bar-fill" style="width:${val * 10}%"></div></div>
      <span class="val">${val}/10</span>
    </div>
  `).join('');

  const costRows = Object.entries(c.costs).map(([key, val]) => `
    <tr><td>${COST_LABELS[key] || key}</td><td>${fmt(val)}</td></tr>
  `).join('');

  const neighborhoods = c.neighborhoods.map(n => `
    <div class="neigh-card">
      <h4>${escapeHtml(n.name)}</h4>
      <p class="vibe">${escapeHtml(n.vibe)}</p>
      <p class="rent-note">${escapeHtml(n.rent_note)}</p>
    </div>
  `).join('');

  const goodStuff = c.good_stuff.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const watchOut = c.watch_out.map(item => `<li>${escapeHtml(item)}</li>`).join('');

  const dnAvailable = c.visa.digital_nomad.toLowerCase().includes('available') && !c.visa.digital_nomad.toLowerCase().includes('not');
  const dnClass = dnAvailable ? 'available' : 'unavailable';

  const visaOptions = c.visa.options.map(o => `<li>${escapeHtml(o)}</li>`).join('');

  return `
    <a href="#/" class="back-link">&larr; Back to all cities</a>

    <div class="profile-head">
      <div class="title-block">
        <span class="flag-big">${c.flag}</span>
        <h1>${escapeHtml(c.name)}</h1>
        <span class="country">${escapeHtml(c.country)}</span>
        <p class="tagline">${escapeHtml(c.tagline)}</p>
        <p class="last-updated">Last updated: ${escapeHtml(c.last_updated)}</p>
      </div>
      <div class="stamps-row">
        <span class="stamp large">
          Single, monthly
          <span class="stamp-amount">${fmt(c.monthly_budget_single)}</span>
        </span>
        <span class="stamp large">
          Family, monthly
          <span class="stamp-amount">${fmt(c.monthly_budget_family)}</span>
        </span>
      </div>
    </div>

    <div class="dossier-grid">
      <div class="section">
        <h2>Livability scores <span class="tag">0–10</span></h2>
        ${scoreRows}
      </div>

      <div class="section">
        <h2>Cost of living <span class="tag">USD / month</span></h2>
        <table class="cost-table"><tbody>${costRows}</tbody></table>
      </div>

      <div class="section">
        <h2>Income reality <span class="tag">average net salary</span></h2>
        <div class="income-figure">${fmt(c.income.average_net_salary)}/mo</div>
        <p class="income-note">${escapeHtml(c.income.note)}</p>
      </div>

      <div class="visa-box">
        <h2>Visa &amp; digital nomad status <span class="tag">immigration</span></h2>
        <span class="dn-status ${dnClass}">Digital nomad visa: ${escapeHtml(c.visa.digital_nomad)}</span>
        <p class="income-req">Income requirement: ${escapeHtml(c.visa.income_requirement)}</p>
        <p>${escapeHtml(c.visa.summary)}</p>
        <h3 style="margin-top:1rem;font-size:0.95rem;">Routes in</h3>
        <ul>${visaOptions}</ul>
      </div>

      <div class="section">
        <h2>Taxes <span class="tag">what to expect</span></h2>
        <p>${escapeHtml(c.taxes)}</p>
      </div>

      <div class="section span-2">
        <h2>Neighborhoods <span class="tag">where to live</span></h2>
        <div class="neigh-grid">${neighborhoods}</div>
      </div>

      <div class="section span-2">
        <h2>The good &amp; the watch-outs</h2>
        <div class="two-col">
          <div class="col-good">
            <h3>Good stuff</h3>
            <ul>${goodStuff}</ul>
          </div>
          <div class="col-watch">
            <h3>Watch out for</h3>
            <ul>${watchOut}</ul>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Trend &amp; direction <span class="tag">where it's heading</span></h2>
        <p>${escapeHtml(c.trend)}</p>
      </div>

      <div class="section">
        <h2>Community &amp; cultural fit <span class="tag">for Pakistani movers</span></h2>
        <p>${escapeHtml(c.community)}</p>
      </div>

      ${famousAndSocial(c)}
    </div>
  `;
}

function famousAndSocial(c) {
  if (!c.famous_people && !c.social) return '';

  const famous = (c.famous_people || []).map(p => `<li>${escapeHtml(p)}</li>`).join('');

  const socialLinks = c.social ? `
    <div class="social-links">
      <a href="${c.social.instagram}" target="_blank" rel="noopener" class="social-pill">📷 Instagram</a>
      <a href="${c.social.youtube}" target="_blank" rel="noopener" class="social-pill">▶️ YouTube</a>
      <a href="${c.social.tiktok}" target="_blank" rel="noopener" class="social-pill">🎵 TikTok</a>
      <a href="${c.social.reddit}" target="_blank" rel="noopener" class="social-pill">💬 Reddit</a>
    </div>
  ` : '';

  return `
    <div class="section span-2 social-section">
      <h2>See it for yourself <span class="tag">social &amp; famous faces</span></h2>
      <div class="two-col">
        <div>
          <h3>Famous people from ${escapeHtml(c.country)}</h3>
          <ul>${famous}</ul>
        </div>
        <div>
          <h3>What it looks like</h3>
          <p style="color:#5c6962;font-size:0.9rem;margin-bottom:0.7rem;">Browse real photos and videos from ${escapeHtml(c.name)} before you decide.</p>
          ${socialLinks}
        </div>
      </div>
    </div>
  `;
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
