document.addEventListener('DOMContentLoaded', () => {

    const prView = document.getElementById('pr-view');
    if (!prView) return; // Only runs on pr.html

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    /**
     * Rank-to-traffic curves:  log10(monthly_visits) = a - b * log10(rank)
     * Fitted by tools/calibrate-reach.js on 2026-07-29 against 5 verified
     * Indonesian outlets. hostio was the best usable signal (R^2 0.80, median
     * error 10%); webrank is the fallback when a domain has no hostio rank.
     * Re-run the tool after adding anchors and paste the new params here.
     */
    const REACH_CURVES = {
        fitDate: '2026-07-29',
        anchors: 5,
        hostio: { a: 12.4202, b: 1.1692 },
        webrank: { a: 9.4697, b: 0.4574 },
    };

    // Tier by webrank position; tier drives the per-article share of site
    // traffic (big portals publish hundreds of articles a day, so each one
    // captures a smaller slice than a post on a niche site does).
    const TIER_THRESHOLDS = [[5000, 1], [30000, 2], [150000, 3], [Infinity, 4]];
    const TIER_SHARE_FACTOR = { 1: 1, 2: 2, 3: 4, 4: 8 };

    const PLACEMENTS = {
        homepage: { label: 'Homepage', mult: 3 },
        section: { label: 'Section page', mult: 1.5 },
        standard: { label: 'Standard', mult: 1 },
        buried: { label: 'Buried', mult: 0.5 },
    };

    const DEFAULT_CONFIG = {
        cpm: 50000,      // Rp per 1,000 views — Indonesian display CPM ballpark
        baseShare: 0.05, // Tier-1 article share, % of outlet monthly visits
        syncUrl: '',
    };

    /**
     * Curated Indonesian outlets. Verified visit figures beat any curve
     * estimate, so they take precedence; the rest resolve via the rank API on
     * first use and are cached. Names are used to auto-fill the Outlet field.
     */
    const SEED_OUTLETS = {
        'detik.com': { name: 'Detik' },
        'kompas.com': { name: 'Kompas', verifiedVisits: 90500000, verifiedSource: 'Similarweb, Nov 2024' },
        'tribunnews.com': { name: 'Tribun News', verifiedVisits: 117100000, verifiedSource: 'Similarweb, Nov 2024' },
        'liputan6.com': { name: 'Liputan6', verifiedVisits: 59100000, verifiedSource: 'Similarweb, Nov 2024' },
        'cnnindonesia.com': { name: 'CNN Indonesia', verifiedVisits: 53300000, verifiedSource: 'Similarweb, Nov 2024' },
        'kumparan.com': { name: 'Kumparan', verifiedVisits: 48000000, verifiedSource: 'Similarweb, Nov 2024' },
        'tempo.co': { name: 'Tempo' },
        'suara.com': { name: 'Suara' },
        'katadata.co.id': { name: 'Katadata' },
        'femaledaily.com': { name: 'Female Daily' },
        'idntimes.com': { name: 'IDN Times' },
        'okezone.com': { name: 'Okezone' },
        'sindonews.com': { name: 'Sindonews' },
        'merdeka.com': { name: 'Merdeka' },
        'viva.co.id': { name: 'VIVA' },
        'tirto.id': { name: 'Tirto' },
        'grid.id': { name: 'Grid' },
        'fimela.com': { name: 'Fimela' },
        'beautynesia.id': { name: 'Beautynesia' },
        'antaranews.com': { name: 'Antara News' },
    };

    /**
     * OIC brand portfolio. Single source of truth: both brand dropdowns are
     * populated from this list at boot, and the importer matches against it.
     * Add or rename brands here only.
     */
    const BRANDS = [
        'Annathaya',
        'Odilia',
        'Nirvaya',
        'Square Gym',
        'Odelique',
        'Odilia Infinity Corporation',
    ];
    const DEFAULT_BRAND = BRANDS[0];

    // Entries saved before the real brand list existed used these placeholder
    // names; migrate them on boot so filters and charts keep working.
    const LEGACY_BRANDS = {
        'OIC Spa': 'Odilia',
        'OIC Gym': 'Square Gym',
        'OIC Corporate': 'Odilia Infinity Corporation',
    };

    /** Table-friendly label — the corporation name is too long for a cell. */
    const displayBrand = brand => brand === 'Odilia Infinity Corporation' ? 'OIC' : (brand || '—');

    const RANK_API = 'https://api.webrank.top/rank/';
    const CACHE_TTL = 7 * 24 * 3600 * 1000; // rank data moves slowly; a week is fine

    // Verify against the current Gemini model list if requests start failing.
    const GEMINI_MODEL = 'gemini-2.0-flash';
    const GEMINI_URL = k => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(k)}`;

    // =========================================================================
    // STORAGE & FORMATTING HELPERS
    // =========================================================================

    const store = {
        get(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                return raw === null ? fallback : JSON.parse(raw);
            } catch (e) {
                console.error(`Corrupt localStorage entry ${key}:`, e);
                return fallback;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                alert('Could not save — browser storage is full or blocked.');
                throw e;
            }
        },
    };

    function fmtNum(num) {
        const n = Number(num);
        if (!isFinite(n) || n === 0) return '0';
        if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
        return String(Math.round(n));
    }

    const fmtRp = n => (n === null || n === undefined) ? '—' : 'Rp ' + fmtNum(n);
    const fmtViews = n => (n === null || n === undefined) ? '—' : fmtNum(n);

    function fmtDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso + 'T00:00:00');
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
    }

    function newId() {
        return (crypto.randomUUID && crypto.randomUUID()) ||
            'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    // =========================================================================
    // DOMAIN PARSING
    // =========================================================================

    // Indonesian second-level TLDs: for these, the registrable domain is three
    // labels (katadata.co.id), not two.
    const ID_SLDS = ['co.id', 'go.id', 'ac.id', 'or.id', 'web.id', 'net.id', 'sch.id', 'my.id', 'biz.id'];

    function domainOf(rawUrl) {
        let u = (rawUrl || '').trim();
        if (!u) return null;
        if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
        let host;
        try {
            const parsed = new URL(u);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
            host = parsed.hostname.toLowerCase();
        } catch (e) {
            return null;
        }
        host = host.replace(/^(www|m|amp|mobile|news|wap)\./, '');
        const parts = host.split('.');
        if (parts.length <= 2) return host;
        const lastTwo = parts.slice(-2).join('.');
        const take = ID_SLDS.includes(lastTwo) ? 3 : 2;
        return parts.slice(-take).join('.');
    }

    function normalizeUrl(rawUrl) {
        let u = (rawUrl || '').trim();
        if (!u) return null;
        if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
        try {
            const parsed = new URL(u);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
            return parsed.href;
        } catch (e) {
            return null;
        }
    }

    // =========================================================================
    // RANK LOOKUP & ESTIMATION
    // =========================================================================

    async function lookupRank(domain, force = false) {
        const cache = store.get('pr_domain_cache', {});
        const hit = cache[domain];
        if (!force && hit && (Date.now() - hit.at) < CACHE_TTL) return hit.rec;

        const res = await fetch(RANK_API + encodeURIComponent(domain));
        if (!res.ok) throw new Error(`Rank lookup failed (HTTP ${res.status}) for ${domain}`);
        const rec = await res.json();

        cache[domain] = { rec, at: Date.now() };
        store.set('pr_domain_cache', cache);
        return rec;
    }

    function tierOf(webrank, visits) {
        if (webrank) {
            for (const [limit, tier] of TIER_THRESHOLDS) {
                if (webrank <= limit) return tier;
            }
        }
        if (visits) {
            if (visits >= 40000000) return 1;
            if (visits >= 10000000) return 2;
            if (visits >= 1000000) return 3;
        }
        return 4;
    }

    /**
     * Site-level monthly visits. Priority: a verified published figure, then
     * the hostio curve, then the webrank curve. `basis` records which one won
     * so every number in the UI can say where it came from.
     */
    function estimateSite(domain, rec) {
        const seed = SEED_OUTLETS[domain];
        const webrank = rec?.webrank || null;
        const hostio = rec?.ranks?.hostio || null;

        let visits = null, basis = 'unknown', detail = 'no rank data available';

        if (seed?.verifiedVisits) {
            visits = seed.verifiedVisits;
            basis = 'verified';
            detail = seed.verifiedSource;
        } else if (hostio) {
            const c = REACH_CURVES.hostio;
            visits = Math.round(Math.pow(10, c.a - c.b * Math.log10(hostio)));
            basis = 'hostio';
            detail = `hostio rank ${hostio.toLocaleString('en-US')}`;
        } else if (webrank) {
            const c = REACH_CURVES.webrank;
            visits = Math.round(Math.pow(10, c.a - c.b * Math.log10(webrank)));
            basis = 'webrank';
            detail = `webrank ${webrank.toLocaleString('en-US')}`;
        }

        return { visits, basis, detail, tier: tierOf(webrank, visits), webrank, hostio, fetchedAt: new Date().toISOString() };
    }

    /**
     * Article-level views and EMV from the site estimate:
     *   views = site_visits × (base_share% × tier_factor) × placement_mult
     *   EMV   = views / 1000 × CPM
     * An outlet-reported actual view count overrides the whole chain.
     */
    function computeArticle(article, site, cfg) {
        const mult = PLACEMENTS[article.placement]?.mult ?? 1;
        let estViews = null;
        let viewsBasis = site.basis;

        if (article.actualViews > 0) {
            estViews = article.actualViews;
            viewsBasis = 'reported';
        } else if (site.visits) {
            const share = (cfg.baseShare / 100) * (TIER_SHARE_FACTOR[site.tier] || 8);
            estViews = Math.round(site.visits * share * mult);
        }

        const emv = estViews !== null ? Math.round(estViews / 1000 * cfg.cpm) : null;
        return { estViews, emv, viewsBasis };
    }

    // =========================================================================
    // STATE
    // =========================================================================

    let articles = store.get('pr_articles', []);
    let config = Object.assign({}, DEFAULT_CONFIG, store.get('pr_config', {}));
    let activeRange = null;   // {start: Date, end: Date} | null
    let editingId = null;
    let previewSite = null;   // last URL-preview estimate, reused on save

    function saveArticles() { store.set('pr_articles', articles); }

    // =========================================================================
    // DOM REFERENCES
    // =========================================================================

    const el = id => document.getElementById(id);

    const form = {
        url: el('pr-url'), outlet: el('pr-outlet'), title: el('pr-title'),
        date: el('pr-date'), brand: el('pr-brand'), placement: el('pr-placement'),
        sentiment: el('pr-sentiment'), cost: el('pr-cost'),
        actualViews: el('pr-actual-views'), notes: el('pr-notes'),
        save: el('pr-save'), cancel: el('pr-cancel'), mode: el('pr-form-mode'),
        preview: el('pr-estimate-preview'), aiBtn: el('pr-ai-sentiment'),
    };

    const dir = {
        search: el('pr-search'), brand: el('pr-filter-brand'), sentiment: el('pr-filter-sentiment'),
        count: el('pr-directory-count'), body: el('pr-directory-body'), status: el('pr-sync-status'),
        importFile: el('pr-import-file'), exportBtn: el('pr-export'),
        pushBtn: el('pr-push'), pullBtn: el('pr-pull'),
    };

    function setPreview(text, isError) {
        if (!form.preview) return;
        form.preview.textContent = text || '';
        form.preview.style.color = isError ? '#b91c1c' : '';
    }

    function setSyncStatus(text, isError) {
        if (!dir.status) return;
        dir.status.textContent = text || '';
        dir.status.style.color = isError ? '#b91c1c' : '';
    }

    function resetBtn(btn, html) {
        if (!btn) return;
        btn.innerHTML = html;
        btn.disabled = false;
        btn.style.background = '';
    }

    // =========================================================================
    // FILTERING & RENDERING
    // =========================================================================

    function inRange(article) {
        if (!activeRange) return true;
        if (!article.date) return true; // keep undated rows, same policy as ads
        const d = new Date(article.date + 'T00:00:00');
        if (isNaN(d.getTime())) return true;
        return d >= activeRange.start && d <= activeRange.end;
    }

    function dashboardRows() {
        return articles.filter(inRange);
    }

    function directoryRows() {
        const q = (dir.search?.value || '').trim().toLowerCase();
        const brand = dir.brand?.value || 'all';
        const sentiment = dir.sentiment?.value ?? 'all';

        return dashboardRows().filter(a => {
            if (brand !== 'all' && a.brand !== brand) return false;
            if (sentiment !== 'all' && (a.sentiment || '') !== sentiment) return false;
            if (q) {
                const hay = `${a.title} ${a.outlet} ${a.domain}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }

    const byDateDesc = (a, b) => (b.date || '').localeCompare(a.date || '');

    // ---- charts ----

    const charts = {};

    function makeChart(id, cfg) {
        const ctx = el(id);
        if (!ctx || typeof Chart === 'undefined') return null;
        if (charts[id]) charts[id].destroy();
        charts[id] = new Chart(ctx, cfg);
        return charts[id];
    }

    function setChartEmpty(canvasId, isEmpty, message) {
        const canvas = el(canvasId);
        if (!canvas || !canvas.parentElement) return;
        const wrapper = canvas.parentElement;
        let note = wrapper.querySelector('.chart-empty-note');
        if (isEmpty) {
            if (!note) {
                note = document.createElement('div');
                note.className = 'chart-empty-note';
                wrapper.appendChild(note);
            }
            note.textContent = message || 'No data yet';
            canvas.style.opacity = '0.15';
        } else {
            if (note) note.remove();
            canvas.style.opacity = '1';
        }
    }

    // Light-theme chart palette. Key names are legacy (white/white70/...) from
    // the glass skin; values now map primary -> muted series depth.
    const W = {
        white: '#7d5632',    // primary series (brand brown)
        white70: '#b08968',  // secondary series
        white30: '#d9cbb8',  // muted bars
        white10: '#eceae6',  // grid lines / unrated slice
        purple: '#7c3aed', green: '#16a34a', red: '#dc2626',
    };

    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#78716c';
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.boxWidth = 8;
    }

    function renderTrendChart(rows) {
        const buckets = new Map(); // 'YYYY-MM' -> {count, emv}
        rows.forEach(a => {
            if (!a.date) return;
            const key = a.date.slice(0, 7);
            if (!buckets.has(key)) buckets.set(key, { count: 0, emv: 0 });
            const b = buckets.get(key);
            b.count += 1;
            b.emv += a.emv || 0;
        });

        const keys = [...buckets.keys()].sort();
        setChartEmpty('pr-trend-chart', keys.length === 0, 'Log coverage to see the monthly trend');

        const labels = keys.map(k => {
            const [y, m] = k.split('-').map(Number);
            return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        });

        makeChart('pr-trend-chart', {
            data: {
                labels,
                datasets: [
                    {
                        type: 'bar', label: 'Coverage', yAxisID: 'y',
                        data: keys.map(k => buckets.get(k).count),
                        backgroundColor: W.white30, borderRadius: 8, barThickness: 22,
                    },
                    {
                        type: 'line', label: 'EMV (Rp)', yAxisID: 'y1',
                        data: keys.map(k => buckets.get(k).emv),
                        borderColor: W.purple, tension: 0.35,
                    },
                ],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { grid: { display: false }, border: { display: false } },
                    y: { beginAtZero: true, grid: { color: W.white10 }, border: { display: false }, ticks: { precision: 0 } },
                    y1: { beginAtZero: true, position: 'right', grid: { display: false }, border: { display: false } },
                },
            },
        });
    }

    function renderSentimentChart(rows) {
        const counts = { positive: 0, neutral: 0, negative: 0, unrated: 0 };
        rows.forEach(a => { counts[a.sentiment || 'unrated'] += 1; });

        const entries = [
            ['Positive', counts.positive, W.green],
            ['Neutral', counts.neutral, '#a8a29e'],
            ['Negative', counts.negative, W.red],
            ['Unrated', counts.unrated, W.white10],
        ].filter(e => e[1] > 0);

        setChartEmpty('pr-sentiment-chart', entries.length === 0, 'No coverage in this range');

        makeChart('pr-sentiment-chart', {
            type: 'doughnut',
            data: {
                labels: entries.map(e => e[0]),
                datasets: [{ data: entries.map(e => e[1]), backgroundColor: entries.map(e => e[2]), borderWidth: 0, cutout: '75%' }],
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
        });
    }

    function renderOutletChart(rows) {
        const totals = new Map();
        rows.forEach(a => {
            if (a.estViews === null || a.estViews === undefined) return;
            const key = a.outlet || a.domain || 'Unknown';
            totals.set(key, (totals.get(key) || 0) + a.estViews);
        });

        const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
        setChartEmpty('pr-outlet-chart', entries.length === 0, 'No estimated coverage in this range');

        makeChart('pr-outlet-chart', {
            type: 'bar',
            data: {
                labels: entries.map(e => e[0]),
                datasets: [{ label: 'Est. views', data: entries.map(e => e[1]), backgroundColor: W.white, borderRadius: 12, barThickness: 16 }],
            },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { beginAtZero: true, grid: { color: W.white10 }, border: { display: false } },
                    y: { grid: { display: false }, border: { display: false } },
                },
                plugins: { legend: { display: false } },
            },
        });
    }

    // ---- tables ----

    const BASIS_LABEL = {
        verified: 'Verified', reported: 'Reported',
        hostio: 'Est. (hostio)', webrank: 'Est. (webrank)', unknown: 'Unestimated',
    };
    const BASIS_CLASS = {
        verified: 'basis-verified', reported: 'basis-reported',
        hostio: 'basis-est', webrank: 'basis-est', unknown: 'basis-unknown',
    };

    function chip(text, cls, title) {
        const span = document.createElement('span');
        span.className = 'chip ' + cls;
        span.textContent = text;
        if (title) span.title = title;
        return span;
    }

    function td(content, title) {
        const cell = document.createElement('td');
        if (content instanceof Node) cell.appendChild(content);
        else cell.textContent = content;
        if (title) cell.title = title;
        return cell;
    }

    function titleCell(article) {
        const wrap = document.createElement('div');
        wrap.className = 'pr-title-cell';
        if (article.url) {
            const a = document.createElement('a');
            a.href = article.url; // normalizeUrl guarantees http(s) only
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = article.title || article.url;
            wrap.appendChild(a);
        } else {
            wrap.textContent = article.title || '—';
        }
        return wrap;
    }

    function sentimentChip(sentiment) {
        if (sentiment === 'positive') return chip('Positive', 'sent-pos');
        if (sentiment === 'negative') return chip('Negative', 'sent-neg');
        if (sentiment === 'neutral') return chip('Neutral', 'sent-neu');
        return chip('—', 'sent-none');
    }

    function renderRecent(rows) {
        const body = el('pr-recent-body');
        if (!body) return;
        body.innerHTML = '';

        const recent = [...rows].sort(byDateDesc).slice(0, 8);
        if (recent.length === 0) {
            const tr = document.createElement('tr');
            const cell = td('No coverage logged yet — paste a news URL above to start.');
            cell.colSpan = 6;
            cell.style.cssText = 'text-align:center;color:#a8a29e;padding:20px;';
            tr.appendChild(cell);
            body.appendChild(tr);
            return;
        }

        recent.forEach(a => {
            const tr = document.createElement('tr');
            tr.appendChild(td(fmtDate(a.date)));
            tr.appendChild(td(a.outlet || a.domain || '—'));
            tr.appendChild(td(titleCell(a)));
            tr.appendChild(td(sentimentChip(a.sentiment)));
            tr.appendChild(td(fmtViews(a.estViews), a.estViews ? a.estViews.toLocaleString('en-US') : ''));
            tr.appendChild(td(fmtRp(a.emv), a.emv ? a.emv.toLocaleString('en-US') : ''));
            body.appendChild(tr);
        });
    }

    function renderDirectory() {
        const body = dir.body;
        if (!body) return;
        body.innerHTML = '';

        const rows = directoryRows().sort(byDateDesc);
        if (dir.count) dir.count.textContent = `${rows.length} of ${articles.length} shown`;

        if (rows.length === 0) {
            const tr = document.createElement('tr');
            const cell = td(articles.length === 0
                ? 'The directory is empty. Log coverage in the PR Tracker, or use Import to load past news from a spreadsheet.'
                : 'No articles match the current filters.');
            cell.colSpan = 11;
            cell.style.cssText = 'text-align:center;color:#a8a29e;padding:20px;';
            tr.appendChild(cell);
            body.appendChild(tr);
            return;
        }

        rows.forEach(a => {
            const tr = document.createElement('tr');

            tr.appendChild(td(fmtDate(a.date)));

            const outletCell = document.createElement('td');
            outletCell.textContent = (a.outlet || a.domain || '—') + ' ';
            if (a.site?.tier) outletCell.appendChild(chip('T' + a.site.tier, 'tier-' + a.site.tier, a.site.detail || ''));
            tr.appendChild(outletCell);

            tr.appendChild(td(titleCell(a)));
            tr.appendChild(td(displayBrand(a.brand), a.brand || ''));
            tr.appendChild(td(PLACEMENTS[a.placement]?.label || '—'));
            tr.appendChild(td(sentimentChip(a.sentiment)));
            tr.appendChild(td(fmtViews(a.estViews), a.estViews ? a.estViews.toLocaleString('en-US') : ''));
            tr.appendChild(td(fmtRp(a.emv), a.emv ? a.emv.toLocaleString('en-US') : ''));
            tr.appendChild(td(a.prCost ? fmtRp(a.prCost) : 'Organic'));
            tr.appendChild(td(chip(BASIS_LABEL[a.viewsBasis] || '—', BASIS_CLASS[a.viewsBasis] || 'basis-unknown', a.site?.detail || '')));

            const actions = document.createElement('td');
            actions.style.whiteSpace = 'nowrap';
            [['edit', 'fa-pen', 'Edit'], ['reestimate', 'fa-rotate', 'Re-estimate reach'], ['delete', 'fa-trash', 'Delete']]
                .forEach(([action, icon, label]) => {
                    const btn = document.createElement('button');
                    btn.className = 'icon-btn';
                    btn.dataset.action = action;
                    btn.dataset.id = a.id;
                    btn.title = label;
                    btn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
                    actions.appendChild(btn);
                });
            tr.appendChild(actions);

            body.appendChild(tr);
        });
    }

    function renderKpis(rows) {
        const estimated = rows.filter(a => a.estViews !== null && a.estViews !== undefined);
        const reach = estimated.reduce((s, a) => s + a.estViews, 0);
        const emv = estimated.reduce((s, a) => s + (a.emv || 0), 0);
        const cost = rows.reduce((s, a) => s + (a.prCost || 0), 0);

        el('pr-kpi-coverage').textContent = String(rows.length);
        el('pr-kpi-coverage-sub').textContent = activeRange ? 'in selected range' : 'all time';

        el('pr-kpi-reach').textContent = fmtNum(reach);
        el('pr-kpi-reach-sub').textContent = estimated.length < rows.length
            ? `${rows.length - estimated.length} of ${rows.length} unestimated`
            : 'estimated article views';

        el('pr-kpi-emv').textContent = fmtRp(emv);
        el('pr-kpi-emv-sub').textContent = `at CPM Rp ${fmtNum(config.cpm)}`;

        el('pr-kpi-roi').textContent = cost > 0 ? (emv / cost).toFixed(1) + '×' : '—';
        el('pr-kpi-roi-sub').textContent = cost > 0 ? `Rp ${fmtNum(cost)} PR spend` : 'no paid placements in range';
    }

    function renderAll() {
        const rows = dashboardRows();
        renderKpis(rows);
        renderTrendChart(rows);
        renderSentimentChart(rows);
        renderOutletChart(rows);
        renderRecent(rows);
        renderDirectory();
    }

    // =========================================================================
    // FORM: URL PREVIEW, SAVE, EDIT
    // =========================================================================

    let previewTimer = null;

    async function previewUrl() {
        const domain = domainOf(form.url.value);
        previewSite = null;
        if (!domain) { setPreview(''); return; }

        // Autofill outlet name from the seed list when the field is empty.
        const seed = SEED_OUTLETS[domain];
        if (seed && form.outlet && !form.outlet.value.trim()) form.outlet.value = seed.name;

        setPreview(`Looking up ${domain}...`);
        try {
            const rec = await lookupRank(domain);
            const site = estimateSite(domain, rec);
            previewSite = { domain, site };
            if (site.visits) {
                setPreview(`${domain} · Tier ${site.tier} · ~${fmtNum(site.visits)} monthly visits (${BASIS_LABEL[site.basis]}: ${site.detail})`);
            } else {
                setPreview(`${domain}: no rank data — the article will be saved without a reach estimate.`, true);
            }
        } catch (err) {
            setPreview(`${domain}: lookup failed (${err.message}). You can still save; use Re-estimate later.`, true);
        }
    }

    if (form.url) {
        form.url.addEventListener('input', () => {
            clearTimeout(previewTimer);
            previewTimer = setTimeout(previewUrl, 600);
        });
        form.url.addEventListener('change', previewUrl);
    }

    function clearForm() {
        editingId = null;
        previewSite = null;
        ['url', 'outlet', 'title', 'cost', 'actualViews', 'notes'].forEach(k => { if (form[k]) form[k].value = ''; });
        if (form.sentiment) form.sentiment.value = '';
        if (form.placement) form.placement.value = 'standard';
        if (form.brand) form.brand.value = DEFAULT_BRAND;
        if (form.date) form.date.value = new Date().toISOString().slice(0, 10);
        if (form.mode) form.mode.textContent = 'New Entry';
        if (form.save) form.save.innerHTML = '<i class="fa-solid fa-calculator"></i> Estimate & Save';
        if (form.cancel) form.cancel.style.display = 'none';
        setPreview('');
    }

    function loadIntoForm(article) {
        editingId = article.id;
        form.url.value = article.url || '';
        form.outlet.value = article.outlet || '';
        form.title.value = article.title || '';
        form.date.value = article.date || '';
        form.brand.value = article.brand || DEFAULT_BRAND;
        form.placement.value = article.placement || 'standard';
        form.sentiment.value = article.sentiment || '';
        form.cost.value = article.prCost || '';
        form.actualViews.value = article.actualViews || '';
        form.notes.value = article.notes || '';
        if (form.mode) form.mode.textContent = 'Editing';
        if (form.save) form.save.innerHTML = '<i class="fa-solid fa-check"></i> Update Entry';
        if (form.cancel) form.cancel.style.display = 'flex';
        setPreview(article.site?.detail ? `Stored estimate basis — ${BASIS_LABEL[article.viewsBasis]}: ${article.site.detail}` : '');
        showModule('tracker');
        if (form.url.scrollIntoView) form.url.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (form.cancel) form.cancel.addEventListener('click', clearForm);

    async function saveArticle() {
        const url = normalizeUrl(form.url.value);
        const domain = domainOf(form.url.value);
        if (!url || !domain) {
            setPreview('Enter a valid article URL first.', true);
            return;
        }

        // Dedupe by URL (ignoring the one being edited).
        const existing = articles.find(a => a.url === url && a.id !== editingId);
        if (existing) {
            if (!confirm('This URL is already in the directory. Update the existing entry instead of adding a duplicate?')) return;
            editingId = existing.id;
        }

        form.save.disabled = true;
        form.save.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Estimating...';

        // Reuse the preview lookup when it matches; otherwise fetch now.
        let site = (previewSite && previewSite.domain === domain) ? previewSite.site : null;
        if (!site) {
            try {
                site = estimateSite(domain, await lookupRank(domain));
            } catch (err) {
                site = estimateSite(domain, null); // basis 'unknown'
            }
        }

        const prior = editingId ? articles.find(a => a.id === editingId) : null;

        // When editing without a domain change, keep the stored snapshot unless
        // the fresh lookup actually produced data (never downgrade to unknown).
        if (prior && prior.domain === domain && site.basis === 'unknown' && prior.site?.visits) {
            site = prior.site;
        }

        const article = {
            id: editingId || newId(),
            url, domain,
            title: form.title.value.trim(),
            outlet: form.outlet.value.trim() || SEED_OUTLETS[domain]?.name || domain,
            date: form.date.value || '',
            brand: form.brand.value,
            placement: form.placement.value,
            sentiment: form.sentiment.value,
            prCost: Math.max(0, parseFloat(form.cost.value) || 0),
            actualViews: Math.max(0, parseFloat(form.actualViews.value) || 0),
            notes: form.notes.value.trim(),
            site,
            createdAt: prior?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        Object.assign(article, computeArticle(article, site, config));

        if (editingId) {
            const idx = articles.findIndex(a => a.id === editingId);
            if (idx >= 0) articles[idx] = article; else articles.push(article);
        } else {
            articles.push(article);
        }
        saveArticles();

        const savedMsg = article.estViews !== null
            ? `Saved — est. ${fmtNum(article.estViews)} views, EMV ${fmtRp(article.emv)} (${BASIS_LABEL[article.viewsBasis]}).`
            : 'Saved without a reach estimate — use Re-estimate in the directory once the outlet resolves.';

        clearForm();
        setPreview(savedMsg);
        renderAll();
        resetBtn(form.save, '<i class="fa-solid fa-calculator"></i> Estimate & Save');
    }

    if (form.save) form.save.addEventListener('click', saveArticle);

    // ---- Gemini sentiment ----

    if (form.aiBtn) {
        form.aiBtn.addEventListener('click', async () => {
            const title = form.title.value.trim();
            const key = localStorage.getItem('gemini_api_key') || '';
            if (!title) { setPreview('Enter the headline first, then let AI rate it.', true); return; }
            if (!key) { setPreview('No Gemini key saved — add one on the Meta Ads page configuration.', true); return; }

            form.aiBtn.disabled = true;
            form.aiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            try {
                const res = await fetch(GEMINI_URL(key), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `Classify the sentiment of this Indonesian news headline toward the brand it covers. Reply with exactly one word: positive, neutral, or negative.\n\nHeadline: ${title}`
                            }]
                        }]
                    }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const word = text.toLowerCase().match(/positive|neutral|negative/)?.[0];
                if (!word) throw new Error('unclear response');
                form.sentiment.value = word;
                setPreview(`AI rated the headline: ${word}.`);
            } catch (err) {
                setPreview(`Sentiment classification failed: ${err.message}`, true);
            }
            resetBtn(form.aiBtn, '<i class="fa-solid fa-wand-magic-sparkles"></i>');
        });
    }

    // =========================================================================
    // DIRECTORY ACTIONS (edit / re-estimate / delete)
    // =========================================================================

    if (dir.body) {
        dir.body.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const article = articles.find(a => a.id === btn.dataset.id);
            if (!article) return;

            if (btn.dataset.action === 'edit') {
                loadIntoForm(article);

            } else if (btn.dataset.action === 'delete') {
                if (!confirm(`Delete "${article.title || article.url}" from the directory?`)) return;
                articles = articles.filter(a => a.id !== article.id);
                saveArticles();
                renderAll();

            } else if (btn.dataset.action === 'reestimate') {
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                try {
                    const site = estimateSite(article.domain, await lookupRank(article.domain, true));
                    article.site = site;
                    Object.assign(article, computeArticle(article, site, config));
                    article.updatedAt = new Date().toISOString();
                    saveArticles();
                    setSyncStatus(`Re-estimated ${article.domain}: ${site.visits ? '~' + fmtNum(site.visits) + ' monthly visits (' + site.detail + ')' : 'still no rank data'}.`);
                } catch (err) {
                    setSyncStatus(`Re-estimate failed for ${article.domain}: ${err.message}`, true);
                }
                renderAll();
            }
        });
    }

    // =========================================================================
    // IMPORT / EXPORT / SYNC
    // =========================================================================

    function flattenArticle(a) {
        return {
            'Date': a.date || '',
            'Outlet': a.outlet || '',
            'Title': a.title || '',
            'URL': a.url || '',
            'Brand': a.brand || '',
            'Placement': a.placement || '',
            'Sentiment': a.sentiment || '',
            'Est Views': a.estViews ?? '',
            'EMV (Rp)': a.emv ?? '',
            'PR Cost (Rp)': a.prCost || 0,
            'Actual Views': a.actualViews || '',
            'Basis': BASIS_LABEL[a.viewsBasis] || '',
            'Domain': a.domain || '',
            'Notes': a.notes || '',
        };
    }

    if (dir.exportBtn) {
        dir.exportBtn.addEventListener('click', () => {
            const rows = directoryRows().sort(byDateDesc);
            if (rows.length === 0) { setSyncStatus('Nothing to export with the current filters.', true); return; }
            const ws = XLSX.utils.json_to_sheet(rows.map(flattenArticle));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'PR Coverage');
            XLSX.writeFile(wb, `OIC_PR_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
            setSyncStatus(`Exported ${rows.length} article(s) — the currently filtered view.`);
        });
    }

    // ---- import (bulk-load past news from a spreadsheet) ----

    const HEADER_CANDIDATES = {
        url: ['url', 'link', 'tautan'],
        title: ['title', 'judul', 'headline'],
        outlet: ['outlet', 'media', 'publisher'],
        date: ['date', 'tanggal', 'publish date', 'published'],
        brand: ['brand', 'unit'],
        cost: ['pr cost (rp)', 'pr cost', 'cost', 'biaya', 'budget'],
        sentiment: ['sentiment', 'sentimen'],
        placement: ['placement', 'penempatan'],
        actualViews: ['actual views', 'views', 'pageviews'],
        notes: ['notes', 'catatan'],
    };

    function mapRow(raw) {
        const norm = {};
        Object.keys(raw).forEach(k => { norm[k.trim().toLowerCase()] = raw[k]; });
        const pick = field => {
            for (const cand of HEADER_CANDIDATES[field]) {
                if (norm[cand] !== undefined && norm[cand] !== '') return norm[cand];
            }
            return '';
        };
        return {
            url: String(pick('url')).trim(),
            title: String(pick('title')).trim(),
            outlet: String(pick('outlet')).trim(),
            date: importDate(pick('date')),
            brand: importBrand(pick('brand')),
            placement: importPlacement(pick('placement')),
            sentiment: importSentiment(pick('sentiment')),
            prCost: Math.max(0, parseFloat(String(pick('cost')).replace(/[^0-9.]/g, '')) || 0),
            actualViews: Math.max(0, parseFloat(String(pick('actualViews')).replace(/[^0-9.]/g, '')) || 0),
            notes: String(pick('notes')).trim(),
        };
    }

    function importDate(raw) {
        if (raw === '' || raw === null || raw === undefined) return '';
        if (typeof raw === 'number' || (!isNaN(raw) && String(raw).trim() !== '')) {
            const serial = Number(raw);
            if (serial > 20000 && serial < 60000) {
                return new Date(Math.round((serial - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
            }
        }
        const d = new Date(raw);
        return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    }

    function importBrand(raw) {
        const trimmed = String(raw).trim();
        if (LEGACY_BRANDS[trimmed]) return LEGACY_BRANDS[trimmed];

        const s = trimmed.toLowerCase();
        if (s.includes('annathaya')) return 'Annathaya';
        if (s.includes('nirvaya')) return 'Nirvaya';
        if (s.includes('odelique')) return 'Odelique';
        if (s.includes('square') || s.includes('gym')) return 'Square Gym';
        // Corporation checks must run before the plain-Odilia check, because
        // "Odilia Infinity Corporation" contains "odilia".
        if (s.includes('infinity') || s.includes('corp') || s === 'oic') return 'Odilia Infinity Corporation';
        if (s.includes('odilia')) return 'Odilia';
        return 'Odilia Infinity Corporation'; // corporate catch-all for unknowns
    }

    function importPlacement(raw) {
        const s = String(raw).toLowerCase();
        if (s.includes('home')) return 'homepage';
        if (s.includes('section') || s.includes('kategori')) return 'section';
        if (s.includes('buried') || s.includes('archive') || s.includes('arsip')) return 'buried';
        return 'standard';
    }

    function importSentiment(raw) {
        const s = String(raw).toLowerCase();
        if (s.startsWith('pos')) return 'positive';
        if (s.startsWith('neg')) return 'negative';
        if (s.startsWith('neu') || s.startsWith('net')) return 'neutral';
        return '';
    }

    /**
     * Shared ingest path for spreadsheet import and sheet pull. Merges by URL
     * (never destructive), estimates each unique new domain once, sequentially,
     * so a 100-row import does not fire 100 parallel API calls.
     */
    async function ingestRows(rawRows, progress) {
        const summary = { added: 0, updated: 0, skipped: 0, failed: 0 };
        const mapped = rawRows.map(mapRow).filter(r => r.url);
        summary.skipped = rawRows.length - mapped.length;

        const siteCache = {}; // per-run memo on top of the persistent cache
        let done = 0;

        for (const row of mapped) {
            done += 1;
            if (progress) progress(`Processing ${done}/${mapped.length}...`);

            const url = normalizeUrl(row.url);
            const domain = url ? domainOf(url) : null;
            if (!url || !domain) { summary.skipped += 1; continue; }

            if (!(domain in siteCache)) {
                try {
                    siteCache[domain] = estimateSite(domain, await lookupRank(domain));
                    await new Promise(r => setTimeout(r, 250)); // be polite to the API
                } catch (err) {
                    siteCache[domain] = estimateSite(domain, null);
                    summary.failed += 1;
                }
            }
            const site = siteCache[domain];

            const existing = articles.find(a => a.url === url);
            const article = {
                id: existing?.id || newId(),
                url, domain,
                title: row.title,
                outlet: row.outlet || SEED_OUTLETS[domain]?.name || domain,
                date: row.date,
                brand: row.brand,
                placement: row.placement,
                sentiment: row.sentiment,
                prCost: row.prCost,
                actualViews: row.actualViews,
                notes: row.notes,
                site,
                createdAt: existing?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            Object.assign(article, computeArticle(article, site, config));

            if (existing) {
                articles[articles.indexOf(existing)] = article;
                summary.updated += 1;
            } else {
                articles.push(article);
                summary.added += 1;
            }
        }

        saveArticles();
        return summary;
    }

    if (dir.importFile) {
        dir.importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];

                    // Locate the real header row — sheets often start with titles.
                    const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                    let headerRow = 0;
                    for (let i = 0; i < grid.length; i++) {
                        const cells = grid[i].map(c => String(c).trim().toLowerCase());
                        if (cells.some(c => HEADER_CANDIDATES.url.includes(c))) { headerRow = i; break; }
                    }

                    const rows = XLSX.utils.sheet_to_json(ws, { range: headerRow, defval: '' });
                    if (rows.length === 0) { setSyncStatus('No data rows found in that file.', true); return; }

                    setSyncStatus(`Importing ${rows.length} row(s)...`);
                    const s = await ingestRows(rows, setSyncStatus);
                    setSyncStatus(`Import done — ${s.added} added, ${s.updated} updated, ${s.skipped} skipped (no URL), ${s.failed} domain lookup failure(s).`);
                    renderAll();
                } catch (err) {
                    console.error('Import failed:', err);
                    setSyncStatus(`Import failed: ${err.message}`, true);
                }
                dir.importFile.value = '';
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // ---- Google Sheet sync (same Apps Script pattern as the Ads module) ----

    if (dir.pushBtn) {
        dir.pushBtn.addEventListener('click', async () => {
            if (!config.syncUrl) { setSyncStatus('Set the PR webhook URL in Estimation Configuration first.', true); return; }
            if (articles.length === 0) { setSyncStatus('Nothing to push yet.', true); return; }

            dir.pushBtn.disabled = true;
            dir.pushBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Pushing...';
            try {
                // Apps Script sends no CORS headers on POST, so the response is
                // opaque — we can report rows as SENT, not as saved.
                await fetch(config.syncUrl, {
                    method: 'POST', mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(articles.map(flattenArticle)),
                });
                setSyncStatus(`Sent ${articles.length} article(s) to the webhook. The browser cannot read a no-cors response — confirm the rows landed in the sheet.`);
            } catch (err) {
                setSyncStatus(`Push failed: ${err.message}`, true);
            }
            resetBtn(dir.pushBtn, '<i class="fa-solid fa-cloud-arrow-up"></i> Push All');
        });
    }

    if (dir.pullBtn) {
        dir.pullBtn.addEventListener('click', async () => {
            if (!config.syncUrl) { setSyncStatus('Set the PR webhook URL in Estimation Configuration first.', true); return; }

            dir.pullBtn.disabled = true;
            dir.pullBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Pulling...';
            try {
                const res = await fetch(config.syncUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (!Array.isArray(data)) throw new Error('The webhook did not return a JSON array.');

                setSyncStatus(`Merging ${data.length} row(s) from the sheet...`);
                const s = await ingestRows(data, setSyncStatus);
                setSyncStatus(`Pull done — ${s.added} added, ${s.updated} updated, ${s.skipped} skipped. Local entries are never deleted by a pull.`);
                renderAll();
            } catch (err) {
                let msg = err.message || 'Unknown error';
                if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                    msg = "CORS or network error — deploy the Apps Script Web App with access set to 'Anyone'.";
                }
                setSyncStatus(`Pull failed: ${msg}`, true);
            }
            resetBtn(dir.pullBtn, '<i class="fa-solid fa-cloud-arrow-down"></i> Pull');
        });
    }

    [dir.search, dir.brand, dir.sentiment].forEach(control => {
        if (control) control.addEventListener('input', renderDirectory);
    });

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    function loadConfigIntoInputs() {
        el('pr-cfg-cpm').value = config.cpm;
        el('pr-cfg-share').value = config.baseShare;
        el('pr-cfg-sync').value = config.syncUrl;

        const gemini = el('pr-gemini-status');
        if (gemini) {
            const hasKey = !!localStorage.getItem('gemini_api_key');
            gemini.className = 'sheets-status ' + (hasKey ? 'connected' : 'disconnected');
            gemini.textContent = hasKey ? 'Gemini: connected' : 'Gemini: set key on Meta Ads page';
        }
    }

    const cfgSaveBtn = el('pr-cfg-save');
    if (cfgSaveBtn) {
        cfgSaveBtn.addEventListener('click', () => {
            config.cpm = Math.max(0, parseFloat(el('pr-cfg-cpm').value) || DEFAULT_CONFIG.cpm);
            config.baseShare = Math.max(0, parseFloat(el('pr-cfg-share').value) || DEFAULT_CONFIG.baseShare);
            config.syncUrl = el('pr-cfg-sync').value.trim();
            store.set('pr_config', config);

            // New economics apply to every stored estimate (reported actuals keep
            // their view counts; only the EMV pricing moves for those).
            articles.forEach(a => {
                if (a.site) Object.assign(a, computeArticle(a, a.site, config));
            });
            saveArticles();
            renderAll();

            cfgSaveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved & Recalculated';
            setTimeout(() => resetBtn(cfgSaveBtn, 'Save Configuration'), 2500);
        });
    }

    // =========================================================================
    // TABS & DATE RANGE
    // =========================================================================

    const tabTracker = el('pr-tab-tracker');
    const tabDirectory = el('pr-tab-directory');
    const moduleTracker = el('pr-tracker-module');
    const moduleDirectory = el('pr-directory-module');
    const moduleTitle = el('pr-module-title');

    function showModule(which) {
        const tracker = which === 'tracker';
        if (tabTracker) tabTracker.classList.toggle('active', tracker);
        if (tabDirectory) tabDirectory.classList.toggle('active', !tracker);
        if (moduleTracker) moduleTracker.style.display = tracker ? 'block' : 'none';
        if (moduleDirectory) moduleDirectory.style.display = tracker ? 'none' : 'block';
        if (moduleTitle) moduleTitle.textContent = tracker ? 'PR & Exposure' : 'News Directory';
        if (tracker) Object.values(charts).forEach(c => c && c.resize());
    }

    if (tabTracker) tabTracker.addEventListener('click', () => showModule('tracker'));
    if (tabDirectory) tabDirectory.addEventListener('click', () => showModule('directory'));
    const openDirBtn = el('pr-open-directory');
    if (openDirBtn) openDirBtn.addEventListener('click', () => showModule('directory'));

    // ---- date range (same pattern as the Ads module) ----

    const startOfDay = d => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };
    const endOfDay = d => { const c = new Date(d); c.setHours(23, 59, 59, 999); return c; };

    let fp = null;
    const shortcutsEl = el('pr-date-shortcuts');

    function applyRange(dates) {
        activeRange = (dates && dates.length === 2)
            ? { start: startOfDay(dates[0]), end: endOfDay(dates[1]) }
            : null;
        renderAll();
    }

    if (el('pr-date-range') && typeof flatpickr !== 'undefined') {
        fp = flatpickr('#pr-date-range', {
            mode: 'range',
            dateFormat: 'd M Y',
            position: 'auto right',
            maxDate: 'today',
            onChange: (selectedDates) => {
                if (selectedDates.length === 2) {
                    if (shortcutsEl) shortcutsEl.value = 'custom';
                    applyRange(selectedDates);
                }
            },
        });
    }

    if (shortcutsEl) {
        shortcutsEl.addEventListener('change', (e) => {
            const val = e.target.value;
            const today = new Date();
            let start = new Date();

            if (val === '30') {
                start.setDate(today.getDate() - 30);
                fp ? fp.setDate([start, today], true) : applyRange([start, today]);
            } else if (val === 'thisMonth') {
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                fp ? fp.setDate([start, today], true) : applyRange([start, today]);
            } else if (val === 'lastMonth') {
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const end = new Date(today.getFullYear(), today.getMonth(), 0);
                fp ? fp.setDate([start, end], true) : applyRange([start, end]);
            } else if (val === 'thisYear') {
                start = new Date(today.getFullYear(), 0, 1);
                fp ? fp.setDate([start, today], true) : applyRange([start, today]);
            } else if (val === 'allTime') {
                if (fp) fp.clear();
                applyRange(null);
            } else if (val === 'custom') {
                if (fp) fp.open();
            }
        });
    }

    // =========================================================================
    // BOOT
    // =========================================================================

    /** Fill both brand dropdowns from the BRANDS list (single source of truth). */
    function populateBrandSelects() {
        if (form.brand) {
            form.brand.innerHTML = '';
            BRANDS.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b;
                opt.textContent = b;
                form.brand.appendChild(opt);
            });
            form.brand.value = DEFAULT_BRAND;
        }
        if (dir.brand) {
            // Keep the "All Brands" option from the markup, append the rest.
            BRANDS.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b;
                opt.textContent = b;
                dir.brand.appendChild(opt);
            });
        }
    }

    /** One-time rename of placeholder brands on entries saved before this list existed. */
    function migrateLegacyBrands() {
        let changed = false;
        articles.forEach(a => {
            if (LEGACY_BRANDS[a.brand]) {
                a.brand = LEGACY_BRANDS[a.brand];
                changed = true;
            }
        });
        if (changed) saveArticles();
    }

    populateBrandSelects();
    migrateLegacyBrands();
    if (form.date) form.date.value = new Date().toISOString().slice(0, 10);
    loadConfigIntoInputs();
    renderAll();
});
