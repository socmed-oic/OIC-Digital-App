document.addEventListener('DOMContentLoaded', () => {

    // Determine which page we are on based on the elements present
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');

    // =========================================================================
    // 0. SHARED HELPERS
    // =========================================================================

    /** Escape text before it goes anywhere near innerHTML. */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Meta exports dates as either an Excel serial number or a display string,
     * depending on whether the file is a true XLSX or a CSV. Normalise both to a
     * Date so rows can be compared and sorted, rather than sorted as text.
     */
    function parseRowDate(raw) {
        if (raw === null || raw === undefined || raw === '' || raw === '-') return null;

        if (typeof raw === 'number' || (typeof raw === 'string' && raw.trim() !== '' && !isNaN(raw))) {
            const serial = Number(raw);
            // Excel serials below this are almost certainly not dates.
            if (serial > 20000 && serial < 60000) {
                return new Date(Math.round((serial - 25569) * 86400 * 1000));
            }
        }

        const parsed = new Date(raw);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    const DATE_COLUMNS = ['Ends', 'Reporting Ends', 'Day', 'Date', 'Reporting Starts', 'Starts'];

    function getRowDate(row) {
        for (const col of DATE_COLUMNS) {
            if (row[col] !== undefined) {
                const d = parseRowDate(row[col]);
                if (d) return d;
            }
        }
        return null;
    }

    function startOfDay(d) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; }
    function endOfDay(d) { const c = new Date(d); c.setHours(23, 59, 59, 999); return c; }

    /**
     * YYYY-MM-DD in LOCAL time.
     * Do not use toISOString() for this: it converts to UTC first, so in
     * Jakarta (UTC+7) a local midnight becomes 17:00 the previous day and every
     * stored date lands one day early.
     */
    function localDateKey(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatNumber(num) {
        const n = Number(num);
        if (!isFinite(n)) return '0';
        if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toFixed(1);
    }

    /** Read a numeric cell, tolerating the several header spellings Meta uses. */
    function numFrom(row, names) {
        for (const name of names) {
            if (row[name] !== undefined && row[name] !== '') {
                const v = parseFloat(String(row[name]).replace(/[^0-9.\-]/g, ''));
                if (!isNaN(v)) return v;
            }
        }
        return 0;
    }

    const COL = {
        campaign: ['Nama Campaign', 'Campaign name', 'Campaign Name'],
        adset: ['Nama Ad Set', 'Ad set name', 'Ad Set Name'],
        ad: ['Nama Iklan', 'Ad name', 'Ad Name'],
        spend: ['Amount Spent', 'Amount spent (IDR)', 'Amount spent'],
        impressions: ['Impressions'],
        reach: ['Reach'],
        clicks: ['Clicks All', 'Clicks (all)', 'Click Link', 'Link clicks'],
    };

    function strFrom(row, names) {
        for (const name of names) {
            if (row[name] !== undefined && row[name] !== '') return String(row[name]);
        }
        return '';
    }

    // =========================================================================
    // 1. PIN LOGIN SYSTEM (Only runs on index.html)
    // =========================================================================
    if (loginView) {
        // The PIN is the password of the shared team Firebase account, verified
        // server-side by Firebase Auth. It never appears in this repository —
        // the old hardcoded client-side PIN is gone.
        const PIN_LENGTH = 6;
        let currentPin = '';
        let submitting = false;
        const pinDots = document.querySelectorAll('.pin-dot');
        const numberKeys = document.querySelectorAll('.pin-keypad .key:not(.action-key)');
        const clearBtn = document.getElementById('pin-clear');
        const enterBtn = document.getElementById('pin-enter');
        const errorMsg = document.getElementById('pin-error');

        function updatePinDisplay() {
            pinDots.forEach((dot, index) => {
                if (index < currentPin.length) {
                    dot.classList.add('filled');
                } else {
                    dot.classList.remove('filled');
                }
                dot.classList.remove('error');
            });
            if (errorMsg) errorMsg.textContent = '';
        }

        function showPinError(message) {
            if (errorMsg) errorMsg.textContent = message;
            pinDots.forEach(dot => dot.classList.add('error'));
            setTimeout(() => {
                currentPin = '';
                updatePinDisplay();
            }, 1000);
        }

        function submitPin() {
            if (submitting || currentPin.length !== PIN_LENGTH) return;

            const backend = window.OICBackend;
            if (!backend) {
                showPinError('Sign-in service failed to load — check your connection.');
                return;
            }

            submitting = true;
            if (errorMsg) errorMsg.textContent = 'Checking...';

            backend.signInWithPin(currentPin)
                .then(() => { window.location.href = 'hub.html'; })
                .catch((err) => {
                    submitting = false;
                    const text = String((err && err.message) || '').toLowerCase();
                    const status = err && err.status;

                    let message = 'Incorrect PIN';
                    if (status === 429 || text.includes('rate limit') || text.includes('too many')) {
                        message = 'Too many attempts — wait a few minutes and try again.';
                    } else if (text.includes('failed to fetch') || text.includes('network')) {
                        message = 'Network error — check your connection.';
                    } else if (text.includes('email not confirmed')) {
                        message = 'Team account is not confirmed yet in Supabase.';
                    }
                    showPinError(message);
                });
        }

        numberKeys.forEach(key => {
            key.addEventListener('click', () => {
                if (currentPin.length < PIN_LENGTH) {
                    currentPin += key.textContent;
                    updatePinDisplay();
                    if (currentPin.length === PIN_LENGTH) setTimeout(submitPin, 150);
                }
            });
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (currentPin.length > 0) {
                    currentPin = currentPin.slice(0, -1);
                    updatePinDisplay();
                }
            });
        }

        if (enterBtn) enterBtn.addEventListener('click', submitPin);

        document.addEventListener('keydown', (e) => {
            if (e.key >= '0' && e.key <= '9') {
                if (currentPin.length < PIN_LENGTH) {
                    currentPin += e.key;
                    updatePinDisplay();
                    if (currentPin.length === PIN_LENGTH) setTimeout(submitPin, 150);
                }
            } else if (e.key === 'Backspace') {
                if (currentPin.length > 0) {
                    currentPin = currentPin.slice(0, -1);
                    updatePinDisplay();
                }
            } else if (e.key === 'Enter') {
                submitPin();
            }
        });
    }

    // =========================================================================
    // 1b. HUB (hub.html) — reflect stored PR coverage on its module card
    // =========================================================================
    const hubView = document.getElementById('hub-view');
    if (hubView) {
        const prStatus = document.getElementById('hub-pr-status');
        if (prStatus) {
            // Only trust the count pr.js mirrors from the live cloud snapshot.
            // Never fall back to the pre-cloud localStorage array: that data may
            // not have migrated yet, and showing it here claims articles the
            // shared directory does not have.
            const count = parseInt(localStorage.getItem('pr_articles_count') || '', 10);
            if (!isNaN(count) && count > 0) {
                prStatus.textContent = `${count} Article${count === 1 ? '' : 's'} Tracked`;
            }
        }

        const signOutBtn = document.getElementById('hub-signout');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                if (window.OICBackend) window.OICBackend.signOut();
                else window.location.href = 'index.html';
            });
        }
    }

    // =========================================================================
    // 2. ADS MODULE SPECIFIC LOGIC (Only runs on ads.html)
    // =========================================================================
    if (dashboardView) {

        // ---------------------------------------------------------------------
        // STATE — declared before anything reads it. pullMasterData() used to run
        // above these declarations and threw a temporal-dead-zone ReferenceError
        // on every page load, which silently disabled auto-sync.
        // ---------------------------------------------------------------------

        // Verify this model name against the current Gemini API model list; model
        // ids are retired periodically and a stale id fails every request.
        const GEMINI_MODEL = 'gemini-2.0-flash';
        const GEMINI_URL = m => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(m)}`;

        let geminiApiKey = localStorage.getItem('gemini_api_key') || '';
        // No default webhook: the previous hardcoded Apps Script URL let anyone
        // with the public repo POST arbitrary rows into the master spreadsheet.
        let gsheetSyncUrl = localStorage.getItem('gsheet_sync_url') || '';
        let currentParsedData = null;
        let currentDataProfile = null;
        let activeRange = null; // {start: Date, end: Date} | null

        const apiKeyInput = document.getElementById('gemini-api-key');
        const saveKeyBtn = document.getElementById('save-api-key');
        const keyStatus = document.getElementById('api-key-status');

        const syncUrlInput = document.getElementById('gsheet-sync-url');
        const saveSyncUrlBtn = document.getElementById('save-sync-url');
        const syncUrlStatus = document.getElementById('sync-url-status');

        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        const datasetPanel = document.getElementById('dataset-panel');
        const uploadStatusEl = document.getElementById('upload-status');
        const triggerSyncBtn = document.getElementById('trigger-sync-btn');
        const clearDatasetBtn = document.getElementById('clear-dataset-btn');
        const masterSyncBtn = document.getElementById('pull-master-data-btn');

        /**
         * Accumulated rows keyed by fingerprint. Uploads merge into this map
         * instead of replacing it, so the team can add one export per week and
         * keep the whole history. currentParsedData is the flat view of it.
         */
        const datasetRows = new Map();
        const uploadLog = [];   // {filename, added, updated, at}

        /**
         * Identity of a Meta Ads row: campaign + ad set + ad + day. Re-uploading
         * an overlapping period therefore updates the same rows rather than
         * appending duplicates, which would silently double the reported spend.
         *
         * Fallback: if an export carries none of those columns, hash the whole
         * row instead — otherwise every row would collapse onto one key and the
         * dataset would shrink to a single record.
         */
        function rowFingerprint(row) {
            const d = getRowDate(row);
            const parts = [
                strFrom(row, COL.campaign),
                strFrom(row, COL.adset),
                strFrom(row, COL.ad),
                d ? localDateKey(d) : '',
            ];
            if (parts.every(p => !p)) return 'raw:' + JSON.stringify(row);
            return parts.join('|');
        }

        function setUploadStatus(text, isError) {
            if (!uploadStatusEl) return;
            uploadStatusEl.textContent = text || '';
            uploadStatusEl.style.color = isError ? '#b91c1c' : '';
        }

        const campaignSelect = document.getElementById('filter-campaign');
        const adsetSelect = document.getElementById('filter-adset');
        const adSelect = document.getElementById('filter-ad');

        if (geminiApiKey && apiKeyInput) {
            apiKeyInput.value = geminiApiKey;
            keyStatus.className = 'sheets-status connected';
            keyStatus.textContent = 'Key Saved';
        }
        if (gsheetSyncUrl && syncUrlInput) {
            syncUrlInput.value = gsheetSyncUrl;
            syncUrlStatus.className = 'sheets-status connected';
            syncUrlStatus.textContent = 'Webhook Ready';
        }

        /** Restore a button to its resting label, whatever happened. */
        function resetBtn(btn, html) {
            if (!btn) return;
            btn.innerHTML = html;
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.disabled = false;
        }

        // Success / failure button tints for the light theme.
        const OK_BG = '#dcfce7', OK_BORDER = '#86efac', OK_TEXT = '#166534';
        const FAIL_BG = '#fee2e2', FAIL_TEXT = '#991b1b';

        // ---------------------------------------------------------------------
        // MASTER DATA SYNC (GET)
        // ---------------------------------------------------------------------
        const MASTER_BTN_IDLE = '<i class="fa-solid fa-rotate"></i> Sync with Master Data';

        async function pullMasterData(isManual) {
            if (!gsheetSyncUrl) {
                if (isManual) {
                    alert('No webhook URL set.\n\nPaste your Google Apps Script Web App URL into "Processor Configuration" below and click Save URL first.');
                }
                return;
            }

            if (masterSyncBtn) {
                masterSyncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
                masterSyncBtn.style.background = '#f2f0ec';
                masterSyncBtn.disabled = true;
            }

            try {
                const res = await fetch(gsheetSyncUrl);
                if (!res.ok) throw new Error(`Server responded ${res.status}`);

                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error('The webhook returned no rows. Check the sheet is not empty.');
                }

                handleParsedData(data, Object.keys(data[0]), 'Master_Spreadsheet');

                if (masterSyncBtn) {
                    masterSyncBtn.innerHTML = '<i class="fa-solid fa-check"></i> Synced with Master';
                    masterSyncBtn.style.background = OK_BG;
                    masterSyncBtn.style.borderColor = OK_BORDER;
                    masterSyncBtn.style.color = OK_TEXT;
                    masterSyncBtn.disabled = false;
                    setTimeout(() => resetBtn(masterSyncBtn, MASTER_BTN_IDLE), 3000);
                }
            } catch (err) {
                console.error('Master Sync Error:', err);

                let message = err.message || 'Unknown error';
                if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
                    message = "CORS or Network Error.\n\nFix: deploy your Google Apps Script Web App with 'Who has access' set to 'Anyone' (not 'Anyone with Google account'). If you changed the script, redeploy it as a New Version.";
                }

                // Only interrupt the user when they asked for this. The automatic
                // load-time sync reports failure on the button instead of via alert.
                if (isManual) alert('Master Data Sync Failed:\n\n' + message);

                if (masterSyncBtn) {
                    masterSyncBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sync Failed';
                    masterSyncBtn.style.background = FAIL_BG;
                    masterSyncBtn.style.color = FAIL_TEXT;
                    masterSyncBtn.disabled = false;
                    masterSyncBtn.title = message;
                    setTimeout(() => resetBtn(masterSyncBtn, MASTER_BTN_IDLE), 5000);
                }
            }
        }

        if (masterSyncBtn) masterSyncBtn.addEventListener('click', () => pullMasterData(true));

        // ---------------------------------------------------------------------
        // TEAM CLOUD DATASET (Supabase)
        // One table row per Meta export row, keyed by fingerprint. Uploads
        // accumulate across files and across teammates; re-uploading an
        // overlapping period updates those rows in place rather than appending
        // duplicates, which would double the reported spend.
        // ---------------------------------------------------------------------
        let suppressCloudEcho = false; // ignores realtime events for our own writes

        function sb() {
            const backend = window.OICBackend;
            return backend ? backend.client : null;
        }

        /**
         * Upsert rows by fingerprint. Per-row upsert (rather than rewriting one
         * big blob) means two people uploading at the same time merge instead of
         * clobbering each other, and re-uploading a period updates in place.
         */
        async function saveRowsToCloud(rows, filename, summary) {
            const prefix = summary ? summary + ' ' : '';
            const client = sb();
            if (!client || rows.length === 0) return;

            const payload = rows.map(r => {
                const d = getRowDate(r);
                return {
                    fingerprint: r.__fp,
                    campaign: strFrom(r, COL.campaign) || null,
                    adset: strFrom(r, COL.adset) || null,
                    ad: strFrom(r, COL.ad) || null,
                    date: d ? localDateKey(d) : null,
                    data: r,
                    source_file: filename,
                    uploaded_at: new Date().toISOString(),
                };
            });

            try {
                suppressCloudEcho = true;
                for (let i = 0; i < payload.length; i += 500) {
                    const { error } = await client.from('ads_rows').upsert(payload.slice(i, i + 500));
                    if (error) throw error;
                }
                setUploadStatus(`${prefix}Saved to the team cloud — teammates will see it live.`);
            } catch (err) {
                console.error('Cloud save failed:', err);
                setUploadStatus(`${prefix}WARNING: could NOT save to the team cloud (${err.message || err}). The data is only in this browser tab.`, true);
            } finally {
                suppressCloudEcho = false;
            }
        }

        /** Replace local state with everything currently in the cloud. */
        async function loadRowsFromCloud() {
            const client = sb();
            if (!client) return;

            const { data, error } = await client.from('ads_rows').select('*');
            if (error) {
                const text = String(error.message || error).toLowerCase();
                setUploadStatus(
                    (text.includes('does not exist') || text.includes('schema cache'))
                        ? 'Table ads_rows not found — run supabase/schema.sql in the SQL Editor first.'
                        : `Could not load team data: ${error.message}`, true);
                return;
            }
            if (!data || data.length === 0) return;

            datasetRows.clear();
            data.forEach(rec => {
                const row = Object.assign({}, rec.data, { __src: rec.source_file, __fp: rec.fingerprint });
                datasetRows.set(rec.fingerprint, row);
            });
            currentParsedData = [...datasetRows.values()];

            fillSelect(campaignSelect,
                [...new Set(currentParsedData.map(rawCampaign).filter(Boolean))],
                'All Campaigns', displayCampaign);
            currentDataProfile = {
                filename: 'Team dataset',
                totalRows: currentParsedData.length,
                columns: currentParsedData.length ? Object.keys(currentParsedData[0]) : [],
                blankCellsFound: 0,
                sampleData: currentParsedData.slice(0, 5),
            };

            renderDatasetPanel();
            updateReportDateLabel();
            filterDataAndRender();
        }

        async function subscribeCloudDataset() {
            await loadRowsFromCloud();

            const client = sb();
            if (!client) return;

            client.channel('ads_rows_changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'ads_rows' },
                    () => {
                        if (suppressCloudEcho) return;
                        loadRowsFromCloud().catch(err => console.error('Cloud reload failed:', err));
                    })
                .subscribe();
        }

        async function clearCloudDataset() {
            const client = sb();
            if (!client) return;
            // Supabase requires a filter on delete; every fingerprint is non-null.
            const { error } = await client.from('ads_rows').delete().neq('fingerprint', '');
            if (error) throw error;
        }

        /**
         * Delete every row of one campaign, team-wide.
         * Filters on the campaign column rather than a list of fingerprints so
         * the delete still catches rows this browser has not loaded. Unnamed
         * rows are stored as NULL, which needs .is() — .eq(null) matches nothing
         * in PostgREST and would silently delete zero rows.
         */
        async function deleteCampaignFromCloud(raw) {
            const client = sb();
            if (!client) throw new Error('cloud connection unavailable');
            const query = client.from('ads_rows').delete();
            const { error } = raw ? await query.eq('campaign', raw) : await query.is('campaign', null);
            if (error) throw error;
        }

        // ---------------------------------------------------------------------
        // DATE PICKER & SHORTCUTS
        // ---------------------------------------------------------------------
        const datePickerEl = document.getElementById('date-range-picker');
        const shortcutsEl = document.getElementById('date-shortcuts');
        let fpInstance = null;

        function applyRange(dates) {
            if (dates && dates.length === 2) {
                activeRange = { start: startOfDay(dates[0]), end: endOfDay(dates[1]) };
            } else {
                activeRange = null;
            }
            updateReportDateLabel();
            filterDataAndRender();
        }

        function updateReportDateLabel() {
            const el = document.getElementById('report-date-range');
            if (!el) return;
            if (!activeRange) {
                el.textContent = 'All dates';
            } else {
                const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                el.textContent = `${fmt(activeRange.start)} - ${fmt(activeRange.end)}`;
            }
        }

        if (datePickerEl && typeof flatpickr !== 'undefined') {
            // No defaultDate: start unrestricted so an uploaded export is fully
            // visible, and let the user narrow from there.
            fpInstance = flatpickr('#date-range-picker', {
                mode: 'range',
                dateFormat: 'd M Y',
                position: 'auto right',
                maxDate: 'today',
                onChange: function (selectedDates) {
                    if (selectedDates.length === 2) {
                        if (shortcutsEl) shortcutsEl.value = 'custom';
                        applyRange(selectedDates);
                    }
                }
            });
        }

        if (shortcutsEl && fpInstance) {
            shortcutsEl.addEventListener('change', (e) => {
                const val = e.target.value;
                const today = new Date();
                let start = new Date();

                if (val === '7') {
                    start.setDate(today.getDate() - 7);
                    fpInstance.setDate([start, today], true);
                } else if (val === '30') {
                    start.setDate(today.getDate() - 30);
                    fpInstance.setDate([start, today], true);
                } else if (val === 'thisMonth') {
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    fpInstance.setDate([start, today], true);
                } else if (val === 'lastMonth') {
                    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const end = new Date(today.getFullYear(), today.getMonth(), 0);
                    fpInstance.setDate([start, end], true);
                } else if (val === 'allTime') {
                    // Clear the range entirely rather than guessing a start date,
                    // so rows older than any hardcoded floor are still counted.
                    fpInstance.clear();
                    applyRange(null);
                } else if (val === 'custom') {
                    fpInstance.open();
                }
            });
        }

        // ---------------------------------------------------------------------
        // CHART SETUP
        // ---------------------------------------------------------------------
        // Light-theme chart palette. Key names are legacy (white/white70/...)
        // from the glass skin; values now map primary -> tertiary series depth.
        const GLASS_COLORS = {
            white: '#7d5632',    // primary series (brand brown)
            white70: '#b08968',  // secondary series
            white30: '#d9cbb8',  // tertiary series
            white10: '#eceae6',  // grid lines
            purple: '#7c3aed',
            green: '#16a34a',
            amber: '#d97706'
        };

        Chart.defaults.color = '#78716c';
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.boxWidth = 8;

        const glassScales = {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: GLASS_COLORS.white10 }, border: { display: false }, beginAtZero: true }
        };

        const charts = {};

        function makeChart(id, config) {
            const ctx = document.getElementById(id);
            if (!ctx) return null;
            if (charts[id]) charts[id].destroy();
            charts[id] = new Chart(ctx, config);
            return charts[id];
        }

        /** Show a "no data" note over a chart card instead of an empty axis. */
        function setChartEmpty(canvasId, isEmpty, message) {
            const canvas = document.getElementById(canvasId);
            if (!canvas || !canvas.parentElement) return;
            const wrapper = canvas.parentElement;
            let note = wrapper.querySelector('.chart-empty-note');

            if (isEmpty) {
                if (!note) {
                    note = document.createElement('div');
                    note.className = 'chart-empty-note';
                    wrapper.appendChild(note);
                }
                note.textContent = message || 'No data for this selection';
                canvas.style.opacity = '0.15';
            } else {
                if (note) note.remove();
                canvas.style.opacity = '1';
            }
        }

        function renderDayToDayChart(rows) {
            const canvas = document.getElementById('day-to-day-chart');
            if (!canvas) return;

            // Bucket by day, keyed on a sortable timestamp rather than a locale
            // string — the old code sorted "7/29/2026" style keys as text, which
            // put October before July.
            const buckets = new Map();
            rows.forEach(row => {
                const d = getRowDate(row);
                if (!d) return;
                const key = startOfDay(d).getTime();
                if (!buckets.has(key)) buckets.set(key, { reach: 0, clicks: 0, impressions: 0 });
                const b = buckets.get(key);
                b.reach += numFrom(row, COL.reach);
                b.impressions += numFrom(row, COL.impressions);
                b.clicks += numFrom(row, COL.clicks);
            });

            const keys = [...buckets.keys()].sort((a, b) => a - b);
            setChartEmpty('day-to-day-chart', keys.length === 0, 'No dated rows in this range');

            const labels = keys.map(k => new Date(k).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));

            makeChart('day-to-day-chart', {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Reach', data: keys.map(k => buckets.get(k).reach), borderColor: GLASS_COLORS.purple, tension: 0.4 },
                        { label: 'Clicks', data: keys.map(k => buckets.get(k).clicks), borderColor: GLASS_COLORS.green, tension: 0.4 },
                        { label: 'Impressions', data: keys.map(k => buckets.get(k).impressions), borderColor: GLASS_COLORS.amber, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { labels: { color: '#292524' } } },
                    scales: glassScales
                }
            });
        }

        /**
         * Breakdown charts only have real data when the export includes the
         * matching breakdown column. When it does not, say so rather than
         * rendering a chart full of zeroes that looks like a measurement.
         */
        function renderBreakdownChart(canvasId, rows, keyNames, valueNames, type, emptyMessage) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            const totals = new Map();
            rows.forEach(row => {
                const key = strFrom(row, keyNames);
                if (!key) return;
                totals.set(key, (totals.get(key) || 0) + numFrom(row, valueNames));
            });

            const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
            setChartEmpty(canvasId, entries.length === 0, emptyMessage || `Export has no ${keyNames[0]} column`);

            if (entries.length === 0) {
                makeChart(canvasId, {
                    type,
                    data: { labels: [], datasets: [{ data: [] }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
                return;
            }

            const palette = [GLASS_COLORS.white, GLASS_COLORS.white70, GLASS_COLORS.white30, GLASS_COLORS.amber, GLASS_COLORS.purple, GLASS_COLORS.green];

            makeChart(canvasId, {
                type,
                data: {
                    labels: entries.map(e => e[0]),
                    datasets: [{
                        label: valueNames[0],
                        data: entries.map(e => e[1]),
                        backgroundColor: type === 'doughnut' ? palette : GLASS_COLORS.white70,
                        borderWidth: 0,
                        borderRadius: type === 'doughnut' ? 0 : 20,
                        barThickness: 16,
                        cutout: type === 'doughnut' ? '80%' : undefined
                    }]
                },
                options: {
                    indexAxis: type === 'bar' ? 'y' : 'x',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: type === 'doughnut' ? {} : {
                        x: { grid: { color: GLASS_COLORS.white10 }, border: { display: false }, beginAtZero: true },
                        y: { grid: { display: false }, border: { display: false } }
                    },
                    plugins: { legend: { display: type === 'doughnut' } }
                }
            });
        }

        // ---------------------------------------------------------------------
        // FILTERING & RENDERING
        // ---------------------------------------------------------------------

        /** Repopulate a select, preserving the current choice when still valid. */
        function fillSelect(select, values, allLabel, labelFor) {
            if (!select) return;
            const previous = select.value;
            select.innerHTML = '';
            const optAll = document.createElement('option');
            optAll.value = 'all';
            optAll.textContent = allLabel;
            select.appendChild(optAll);
            values.forEach(v => {
                const opt = document.createElement('option');
                // Value stays the raw name so filtering still matches the data;
                // only the visible label is aliased.
                opt.value = v;
                opt.textContent = labelFor ? labelFor(v) : v;
                select.appendChild(opt);
            });
            select.value = values.includes(previous) ? previous : 'all';
        }

        // ---------------------------------------------------------------------
        // CAMPAIGN ALIASES
        // Meta exports carry whatever name was typed in Ads Manager, and rows
        // synced from the master sheet often have no campaign column at all.
        // Rather than rewriting the source rows — which would be lost on the
        // next upload and would break the fingerprint dedup — a display-only
        // alias map is kept in app_config and shared with the team.
        // ---------------------------------------------------------------------
        const UNNAMED = '(Tanpa nama)';
        let campaignAliases = {};

        /** Raw campaign value for a row; '' when the export has no name. */
        function rawCampaign(row) { return strFrom(row, COL.campaign); }

        /** What the user should see for a raw campaign name. */
        function displayCampaign(raw) {
            if (campaignAliases[raw]) return campaignAliases[raw];
            return raw || UNNAMED;
        }

        async function saveAliases() {
            const client = sb();
            if (!client) throw new Error('cloud connection unavailable');
            const { error } = await client.from('app_config')
                .upsert({ key: 'campaign_aliases', value: campaignAliases });
            if (error) throw error;
        }

        async function subscribeAliases() {
            const client = sb();
            if (!client) return;

            const { data, error } = await client
                .from('app_config').select('value').eq('key', 'campaign_aliases').maybeSingle();
            if (!error && data && data.value) {
                campaignAliases = data.value;
                filterDataAndRender();
            }

            client.channel('campaign_aliases_changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'app_config' },
                    payload => {
                        if (!payload.new || payload.new.key !== 'campaign_aliases') return;
                        campaignAliases = payload.new.value || {};
                        filterDataAndRender();
                    })
                .subscribe();
        }

        function getFilteredRows() {
            if (!currentParsedData) return [];
            let rows = currentParsedData;

            if (activeRange) {
                rows = rows.filter(row => {
                    const d = getRowDate(row);
                    // Undated rows are kept: Meta lifetime exports have no date
                    // column at all, and dropping them would zero the dashboard.
                    if (!d) return true;
                    return d >= activeRange.start && d <= activeRange.end;
                });
            }

            const campaign = campaignSelect?.value || 'all';
            const adset = adsetSelect?.value || 'all';
            const ad = adSelect?.value || 'all';

            if (campaign !== 'all') rows = rows.filter(r => strFrom(r, COL.campaign) === campaign);
            if (adset !== 'all') rows = rows.filter(r => strFrom(r, COL.adset) === adset);
            if (ad !== 'all') rows = rows.filter(r => strFrom(r, COL.ad) === ad);

            return rows;
        }

        function filterDataAndRender() {
            if (!currentParsedData) return;

            // Cascade the hierarchy: ad sets shown depend on the chosen campaign.
            const campaign = campaignSelect?.value || 'all';
            const inCampaign = campaign === 'all'
                ? currentParsedData
                : currentParsedData.filter(r => rawCampaign(r) === campaign);

            fillSelect(adsetSelect, [...new Set(inCampaign.map(r => strFrom(r, COL.adset)).filter(Boolean))], 'All Ad Sets');

            const adset = adsetSelect?.value || 'all';
            const inAdset = adset === 'all'
                ? inCampaign
                : inCampaign.filter(r => strFrom(r, COL.adset) === adset);

            fillSelect(adSelect, [...new Set(inAdset.map(r => strFrom(r, COL.ad)).filter(Boolean))], 'All Ads');

            const filtered = getFilteredRows();

            let totalSpend = 0, totalImpressions = 0, totalClicks = 0;
            filtered.forEach(row => {
                totalSpend += numFrom(row, COL.spend);
                totalImpressions += numFrom(row, COL.impressions);
                totalClicks += numFrom(row, COL.clicks);
            });

            const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
            const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;

            const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
            set('kpi-spend', `Rp ${formatNumber(totalSpend)}`);
            set('kpi-impressions', formatNumber(totalImpressions));
            set('kpi-ctr', `${avgCtr}%`);
            set('kpi-cpc', `Rp ${formatNumber(avgCpc)}`);

            const rowNote = `${filtered.length} of ${currentParsedData.length} rows`;
            document.querySelectorAll('#ads-module .trend').forEach(el => {
                el.textContent = rowNote;
                el.style.color = '#a8a29e';
            });

            renderDayToDayChart(filtered);
            renderBreakdownChart('platformChart', filtered, ['Platform', 'Publisher Platform', 'Platform Ad'], COL.impressions, 'doughnut');
            renderBreakdownChart('placementChart', filtered, ['Placement', 'Platform Position', 'Penempatan'], COL.impressions, 'bar');
            renderBreakdownChart('demoChart', filtered, ['Age', 'Usia', 'Gender'], COL.impressions, 'bar');

            set('report-spend', `Rp ${formatNumber(totalSpend)}`);
            set('report-imp', formatNumber(totalImpressions));
            set('report-clicks', formatNumber(totalClicks));
            set('report-cpc', `Rp ${formatNumber(avgCpc)}`);

            const reportTableBody = document.getElementById('report-table-body');
            if (reportTableBody) {
                reportTableBody.innerHTML = '';

                if (filtered.length === 0) {
                    const tr = document.createElement('tr');
                    const td = document.createElement('td');
                    td.colSpan = 5;
                    td.style.cssText = 'padding:16px;text-align:center;color:#a8a29e;';
                    td.textContent = 'No rows match the current filters.';
                    tr.appendChild(td);
                    reportTableBody.appendChild(tr);
                } else {
                    // Aggregate per campaign rather than dumping every raw row —
                    // a lifetime export can be thousands of lines long.
                    const byCampaign = new Map();
                    filtered.forEach(row => {
                        const name = rawCampaign(row);
                        if (!byCampaign.has(name)) byCampaign.set(name, { spend: 0, imp: 0, clicks: 0 });
                        const c = byCampaign.get(name);
                        c.spend += numFrom(row, COL.spend);
                        c.imp += numFrom(row, COL.impressions);
                        c.clicks += numFrom(row, COL.clicks);
                    });

                    // Spreadsheets often carry annotation rows below the data
                    // ("SUMMARY", "Efisiensi Biaya"). They parse as campaigns
                    // with no spend, impressions or clicks. Hide them by
                    // default but report the count — never drop rows silently.
                    let entries = [...byCampaign.entries()].sort((a, b) => b[1].spend - a[1].spend);
                    const inactive = entries.filter(([, c]) => !c.spend && !c.imp && !c.clicks);
                    if (hideInactive) entries = entries.filter(([, c]) => c.spend || c.imp || c.clicks);

                    const note = document.getElementById('inactive-note');
                    if (note) {
                        note.textContent = inactive.length
                            ? `${inactive.length} baris tanpa aktivitas ${hideInactive ? 'disembunyikan' : 'ditampilkan'}.`
                            : '';
                    }

                    entries.forEach(([name, c]) => {
                        const cpc = c.clicks > 0 ? c.spend / c.clicks : 0;
                        const tr = document.createElement('tr');
                        tr.style.borderBottom = '1px solid #eceae6';

                        // Name cell carries the rename control.
                        const nameCell = document.createElement('td');
                        nameCell.style.padding = '12px 8px';
                        nameCell.appendChild(campaignNameCell(name));
                        tr.appendChild(nameCell);

                        [`Rp ${formatNumber(c.spend)}`, formatNumber(c.imp), formatNumber(c.clicks), `Rp ${formatNumber(cpc)}`]
                            .forEach(text => {
                                const td = document.createElement('td');
                                td.style.padding = '12px 8px';
                                td.textContent = text; // textContent — campaign data is untrusted
                                tr.appendChild(td);
                            });
                        reportTableBody.appendChild(tr);
                    });
                }
            }
        }

        /**
         * Campaign name cell: label + rename control, swapping to an inline
         * input on demand. Renaming is display-only — the underlying rows keep
         * their original name so a re-upload still dedupes against them.
         */
        function campaignNameCell(raw) {
            const wrap = document.createElement('div');
            wrap.className = 'campaign-cell';

            const label = document.createElement('span');
            label.className = 'campaign-label';
            label.textContent = displayCampaign(raw);
            if (campaignAliases[raw]) {
                label.title = `Nama asli: ${raw || '(kosong di file)'}`;
                label.classList.add('renamed');
            } else if (!raw) {
                label.title = 'Baris ini tidak punya nama campaign di file sumber. Klik ikon pensil untuk memberi nama.';
            }

            const edit = document.createElement('button');
            edit.className = 'rename-btn';
            edit.type = 'button';
            edit.title = 'Ubah nama tampilan';
            edit.setAttribute('aria-label', `Ubah nama untuk ${displayCampaign(raw)}`);
            edit.innerHTML = '<i class="fa-solid fa-pen"></i>';

            function startEdit() {
                const input = document.createElement('input');
                input.className = 'rename-input';
                input.value = displayCampaign(raw) === UNNAMED ? '' : displayCampaign(raw);
                input.placeholder = 'Nama campaign';
                input.setAttribute('aria-label', 'Nama campaign baru');

                let settled = false;
                const commit = async () => {
                    if (settled) return;
                    settled = true;
                    const next = input.value.trim();

                    if (!next || next === raw) delete campaignAliases[raw];
                    else campaignAliases[raw] = next;

                    filterDataAndRender();   // optimistic; snapshot will confirm
                    try {
                        await saveAliases();
                    } catch (err) {
                        console.error('Alias save failed:', err);
                        alert('Nama tersimpan sementara di layar ini, tetapi GAGAL disimpan ke cloud: ' +
                              (err.message || err) + '\n\nRekan tim belum melihat perubahan ini.');
                    }
                };
                const cancel = () => { if (!settled) { settled = true; filterDataAndRender(); } };

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commit(); }
                    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
                });
                input.addEventListener('blur', commit);

                wrap.replaceChildren(input);
                input.focus();
                input.select();
            }

            const del = document.createElement('button');
            del.className = 'rename-btn danger';
            del.type = 'button';
            del.title = 'Hapus campaign ini dari dataset tim';
            del.setAttribute('aria-label', `Hapus ${displayCampaign(raw)}`);
            del.innerHTML = '<i class="fa-solid fa-trash"></i>';

            del.addEventListener('click', async () => {
                const affected = currentParsedData.filter(r => rawCampaign(r) === raw);
                const spend = affected.reduce((s, r) => s + numFrom(r, COL.spend), 0);

                if (!confirm(
                    `Hapus "${displayCampaign(raw)}"?\n\n` +
                    `${affected.length} baris · total spend Rp ${formatNumber(spend)}\n\n` +
                    'Data ini dihapus untuk SELURUH TIM dan tidak bisa dikembalikan. ' +
                    'Mengunggah ulang file sumbernya akan memunculkannya kembali.'
                )) return;

                del.disabled = true;
                del.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                try {
                    await deleteCampaignFromCloud(raw);

                    // Drop locally too: the realtime echo is suppressed for our
                    // own writes, so nothing else would refresh this view.
                    [...datasetRows.entries()].forEach(([fp, row]) => {
                        if (rawCampaign(row) === raw) datasetRows.delete(fp);
                    });
                    currentParsedData = [...datasetRows.values()];

                    if (campaignAliases[raw]) { delete campaignAliases[raw]; saveAliases().catch(() => {}); }
                    if (campaignSelect && campaignSelect.value === raw) campaignSelect.value = 'all';

                    fillSelect(campaignSelect,
                        [...new Set(currentParsedData.map(rawCampaign).filter(Boolean))],
                        'All Campaigns', displayCampaign);

                    renderDatasetPanel();
                    filterDataAndRender();
                    setUploadStatus(`"${displayCampaign(raw)}" dihapus — ${affected.length} baris.`);
                } catch (err) {
                    console.error('Delete campaign failed:', err);
                    alert('Gagal menghapus: ' + (err.message || err));
                    filterDataAndRender();
                }
            });

            edit.addEventListener('click', startEdit);
            label.addEventListener('dblclick', startEdit);

            wrap.appendChild(label);
            wrap.appendChild(edit);
            wrap.appendChild(del);
            return wrap;
        }

        // Attached once, at startup. The old code re-attached this inside
        // handleParsedData, so every sync added another duplicate listener.
        [campaignSelect, adsetSelect, adSelect].forEach(sel => {
            if (sel) sel.addEventListener('change', filterDataAndRender);
        });

        // Inactive-row visibility. Default hidden: annotation rows with zero
        // spend are noise in a spend report, but the count stays on screen.
        let hideInactive = true;
        const inactiveToggle = document.getElementById('toggle-inactive');
        if (inactiveToggle) {
            inactiveToggle.checked = hideInactive;
            inactiveToggle.addEventListener('change', () => {
                hideInactive = inactiveToggle.checked;
                filterDataAndRender();
            });
        }

        /**
         * Merge a freshly parsed file into the accumulated dataset.
         * Returns {added, updated} so the upload log can report what happened.
         */
        function mergeIntoDataset(data, filename) {
            let added = 0, updated = 0;

            data.filter(row => !strFrom(row, COL.campaign).toUpperCase().includes('TOTAL'))
                .forEach(row => {
                    const fp = rowFingerprint(row);
                    if (datasetRows.has(fp)) updated++; else added++;
                    // Keep the provenance so the panel can show which file a row
                    // came from; non-enumerable-ish keys stay out of exports by
                    // living under a __ prefix the column helpers never read.
                    datasetRows.set(fp, Object.assign({}, row, { __src: filename, __fp: fp }));
                });

            currentParsedData = [...datasetRows.values()];
            return { added, updated };
        }

        function renderDatasetPanel() {
            const total = datasetRows.size;

            const statsEl = document.getElementById('dataset-stats');
            if (statsEl) statsEl.textContent = `${total} Row${total === 1 ? '' : 's'} Loaded`;

            if (datasetPanel) datasetPanel.style.display = total > 0 ? 'block' : 'none';

            // Summary tiles: totals across everything accumulated so far.
            const summary = document.getElementById('dataset-summary');
            if (summary) {
                const rows = currentParsedData || [];
                const spend = rows.reduce((s, r) => s + numFrom(r, COL.spend), 0);
                const dates = rows.map(getRowDate).filter(Boolean).sort((a, b) => a - b);
                const fmtD = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

                const tiles = [
                    ['Total Rows', String(total)],
                    ['Files Uploaded', String(uploadLog.length)],
                    ['Total Spend', `Rp ${formatNumber(spend)}`],
                    ['Date Coverage', dates.length ? `${fmtD(dates[0])} – ${fmtD(dates[dates.length - 1])}` : 'No dated rows'],
                ];

                summary.innerHTML = '';
                tiles.forEach(([label, value]) => {
                    const card = document.createElement('div');
                    card.className = 'glass-card';
                    card.style.padding = '14px';
                    const h4 = document.createElement('h4');
                    h4.style.cssText = 'color:var(--text-secondary);margin-bottom:6px;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.7px;';
                    h4.textContent = label;
                    const p = document.createElement('div');
                    p.style.cssText = 'font-size:1.25rem;font-weight:700;';
                    p.textContent = value;
                    card.appendChild(h4);
                    card.appendChild(p);
                    summary.appendChild(card);
                });
            }

            const logBody = document.getElementById('upload-log-body');
            if (logBody) {
                logBody.innerHTML = '';
                if (uploadLog.length === 0) {
                    const tr = document.createElement('tr');
                    const td = document.createElement('td');
                    td.colSpan = 4;
                    td.style.cssText = 'text-align:center;color:var(--text-tertiary);padding:16px;';
                    td.textContent = 'Loaded from the team cloud — no uploads in this session yet.';
                    tr.appendChild(td);
                    logBody.appendChild(tr);
                } else {
                    [...uploadLog].reverse().forEach(entry => {
                        const tr = document.createElement('tr');
                        [entry.filename, String(entry.added), String(entry.updated),
                         entry.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })]
                            .forEach(text => {
                                const td = document.createElement('td');
                                td.textContent = text; // filenames are untrusted input
                                tr.appendChild(td);
                            });
                        logBody.appendChild(tr);
                    });
                }
            }
        }

        function handleParsedData(data, columns, filename, opts) {
            opts = opts || {};

            const { added, updated } = mergeIntoDataset(data, filename);

            let blankCount = 0;
            currentParsedData.forEach(row => {
                columns.forEach(col => { if (!row[col] && row[col] !== 0) blankCount++; });
            });

            fillSelect(campaignSelect,
                [...new Set(currentParsedData.map(rawCampaign).filter(Boolean))],
                'All Campaigns', displayCampaign);

            currentDataProfile = {
                filename,
                totalRows: currentParsedData.length,
                columns,
                blankCellsFound: blankCount,
                sampleData: currentParsedData.slice(0, 5)
            };

            let summary = '';
            if (!opts.fromCloud) {
                uploadLog.push({ filename, added, updated, at: new Date() });
                summary =
                    `${filename}: ${added} new row${added === 1 ? '' : 's'} added` +
                    (updated > 0 ? `, ${updated} existing row${updated === 1 ? '' : 's'} updated (overlapping period — not double-counted)` : '') +
                    `. Dataset now holds ${datasetRows.size} rows.`;
                setUploadStatus(summary);
            }

            renderDatasetPanel();
            updateReportDateLabel();
            filterDataAndRender();

            // Local uploads are pushed to the team cloud; data arriving FROM the
            // cloud must not be written straight back. The dedup summary is
            // passed through so the cloud result appends to it instead of
            // wiping the only place the user learns what the merge did.
            if (!opts.fromCloud) {
                saveRowsToCloud([...datasetRows.values()].filter(r => r.__src === filename), filename, summary);
            }
        }

        // ---------------------------------------------------------------------
        // FILE UPLOAD
        // ---------------------------------------------------------------------
        if (uploadZone && fileInput) {
            uploadZone.addEventListener('click', () => fileInput.click());
            uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.borderColor = '#7d5632'; });
            uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = '#d6d2cb'; });
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.style.borderColor = '#d6d2cb';
                if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) processFiles(e.target.files);
                e.target.value = ''; // allow re-selecting the same file later
            });
        }

        /**
         * Process files one at a time. Sequential rather than parallel so each
         * merge sees the previous file's rows — two files covering the same
         * period must deduplicate against each other, not race.
         */
        async function processFiles(fileList) {
            const files = [...fileList];
            for (let i = 0; i < files.length; i++) {
                if (files.length > 1) setUploadStatus(`Processing file ${i + 1} of ${files.length}: ${files[i].name}...`);
                try {
                    await processFile(files[i]);
                } catch (err) {
                    console.error('Upload failed:', err);
                    setUploadStatus(`${files[i].name}: ${err.message}`, true);
                }
            }
        }

        function processFile(file) {
            return new Promise((resolve, reject) => {
            // Meta often exports XLSX content under a .csv extension, so always go
            // through SheetJS, which sniffs the real format either way.
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('could not be read from disk'));
            reader.onload = function (e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

                    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                    if (rawRows.length === 0) {
                        reject(new Error('the file appears to be empty'));
                        return;
                    }

                    // Meta prefixes exports with title rows, so locate the real
                    // header row instead of assuming row 0.
                    const headerKeys = ['Amount Spent', 'Impressions', 'Campaign name', 'Nama Campaign', 'Reach'];
                    let headerRowIndex = 0;
                    for (let i = 0; i < rawRows.length; i++) {
                        const row = rawRows[i];
                        if (row.length > 3 && headerKeys.some(k => row.includes(k))) {
                            headerRowIndex = i;
                            break;
                        }
                    }

                    const json = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });
                    if (json.length > 0) {
                        handleParsedData(json, Object.keys(json[0]), file.name);
                        resolve();
                    } else {
                        reject(new Error('no data rows found below the headers'));
                    }
                } catch (err) {
                    console.error('Parse Error:', err);
                    reject(new Error("could not be parsed — is it a valid Meta Ads export?"));
                }
            };
            reader.readAsArrayBuffer(file);
            });
        }

        // ---------------------------------------------------------------------
        // CONFIG SAVING
        // ---------------------------------------------------------------------
        if (saveKeyBtn) {
            saveKeyBtn.addEventListener('click', () => {
                const val = apiKeyInput.value.trim();
                if (!val) return;

                keyStatus.className = 'sheets-status disconnected';
                keyStatus.textContent = 'Testing Key...';

                const originalText = saveKeyBtn.innerHTML;
                saveKeyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                saveKeyBtn.disabled = true;

                fetch(GEMINI_URL(val), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
                }).then(async res => {
                    if (!res.ok) {
                        const detail = await res.text().catch(() => '');
                        throw new Error(`HTTP ${res.status} ${detail.slice(0, 200)}`);
                    }
                    geminiApiKey = val;
                    localStorage.setItem('gemini_api_key', val);
                    keyStatus.className = 'sheets-status connected';
                    keyStatus.textContent = 'Key Saved & Valid';

                    saveKeyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
                    saveKeyBtn.style.background = OK_BG;
                    saveKeyBtn.style.color = OK_TEXT;
                    saveKeyBtn.disabled = false;
                    setTimeout(() => resetBtn(saveKeyBtn, originalText), 2000);
                }).catch((err) => {
                    console.error('Gemini key validation failed:', err);
                    keyStatus.className = 'sheets-status disconnected';
                    keyStatus.textContent = 'Invalid API Key';
                    // Surface the reason: a retired model id fails identically to
                    // a bad key otherwise, which is very hard to debug.
                    keyStatus.title = String(err.message || err);

                    saveKeyBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Failed';
                    saveKeyBtn.style.background = FAIL_BG;
                    saveKeyBtn.style.color = FAIL_TEXT;
                    saveKeyBtn.disabled = false;
                    setTimeout(() => resetBtn(saveKeyBtn, originalText), 2000);
                });
            });
        }

        if (saveSyncUrlBtn) {
            saveSyncUrlBtn.addEventListener('click', () => {
                const val = syncUrlInput.value.trim();
                if (!val) return;

                gsheetSyncUrl = val;
                localStorage.setItem('gsheet_sync_url', val);
                syncUrlStatus.className = 'sheets-status connected';
                syncUrlStatus.textContent = 'Webhook Ready';

                const originalText = saveSyncUrlBtn.innerHTML;
                saveSyncUrlBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
                saveSyncUrlBtn.style.background = OK_BG;
                saveSyncUrlBtn.style.color = OK_TEXT;
                setTimeout(() => resetBtn(saveSyncUrlBtn, originalText), 2000);
            });
        }

        // ---------------------------------------------------------------------
        // CLEAR DATASET
        // ---------------------------------------------------------------------
        if (clearDatasetBtn) {
            clearDatasetBtn.addEventListener('click', async () => {
                if (!confirm(`Delete all ${datasetRows.size} accumulated rows? This clears the dataset for the whole team and cannot be undone.`)) return;

                clearDatasetBtn.disabled = true;
                clearDatasetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Clearing...';
                try {
                    await clearCloudDataset();
                    datasetRows.clear();
                    uploadLog.length = 0;
                    currentParsedData = [];
                    currentDataProfile = null;
                    fillSelect(campaignSelect, [], 'All Campaigns');
                    renderDatasetPanel();
                    renderEmptyDashboard();
                    filterDataAndRender();
                    setUploadStatus('Dataset cleared.');
                } catch (err) {
                    setUploadStatus(`Could not clear the team dataset: ${err.message || err}`, true);
                }
                resetBtn(clearDatasetBtn, '<i class="fa-solid fa-trash"></i> Clear All');
            });
        }

        // ---------------------------------------------------------------------
        // PUSH TO SHEET
        // ---------------------------------------------------------------------
        const SYNC_BTN_IDLE = '<i class="fa-solid fa-cloud-arrow-up"></i> Send to Sheet';

        if (triggerSyncBtn) {
            triggerSyncBtn.addEventListener('click', async () => {
                if (!gsheetSyncUrl) { setUploadStatus('Set your Google Apps Script Webhook URL in the configuration first.', true); return; }
                if (!currentParsedData || currentParsedData.length === 0) return;

                triggerSyncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
                triggerSyncBtn.disabled = true;
                setUploadStatus('Sending to Google Sheets...');

                try {
                    // Apps Script does not send CORS headers on POST, so this has to
                    // be a no-cors request. That makes the response opaque: we
                    // cannot read the status, so we cannot claim the write
                    // succeeded. Only a network-level failure is detectable here.
                    await fetch(gsheetSyncUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(currentParsedData)
                    });

                    triggerSyncBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Sent';
                    triggerSyncBtn.style.background = OK_BG;
                    triggerSyncBtn.style.borderColor = OK_BORDER;
                    triggerSyncBtn.style.color = OK_TEXT;
                    triggerSyncBtn.disabled = false;
                    setUploadStatus(`Sent ${currentParsedData.length} rows to the webhook. The browser cannot read the response of a no-cors request, so please confirm the rows actually landed in your Master Spreadsheet.`);
                    setTimeout(() => resetBtn(triggerSyncBtn, SYNC_BTN_IDLE), 4000);
                } catch (error) {
                    console.error(error);
                    triggerSyncBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sync Failed';
                    triggerSyncBtn.style.background = FAIL_BG;
                    triggerSyncBtn.style.color = FAIL_TEXT;
                    triggerSyncBtn.disabled = false;
                    setUploadStatus(`Send failed: ${error.message}. Verify the Webhook URL is correct and deployed as a Web App.`, true);
                    setTimeout(() => resetBtn(triggerSyncBtn, SYNC_BTN_IDLE), 4000);
                }
            });
        }

        // ---------------------------------------------------------------------
        // MODULE TABS
        // ---------------------------------------------------------------------
        const adsTab = document.getElementById('sidebar-ads-tab');
        const repTab = document.getElementById('sidebar-reports-tab');
        const adsModule = document.getElementById('ads-module');
        const repModule = document.getElementById('report-module');
        const moduleTitle = document.getElementById('current-module-title');

        function showModule(which) {
            const showAds = which === 'ads';
            if (adsTab) adsTab.classList.toggle('active', showAds);
            if (repTab) repTab.classList.toggle('active', !showAds);
            if (adsModule) adsModule.style.display = showAds ? 'block' : 'none';
            if (repModule) repModule.style.display = showAds ? 'none' : 'block';
            if (moduleTitle) moduleTitle.textContent = showAds ? 'Meta Ads & Optimization' : 'Campaign Reporting';
            // Chart.js mis-measures canvases laid out while hidden.
            if (showAds) Object.values(charts).forEach(c => c && c.resize());
        }

        if (adsTab) adsTab.addEventListener('click', () => showModule('ads'));
        if (repTab) repTab.addEventListener('click', () => showModule('reports'));

        // ---------------------------------------------------------------------
        // EXPORT & AI SUMMARY
        // ---------------------------------------------------------------------
        const btnExportPdf = document.getElementById('btn-export-pdf');
        const PDF_BTN_IDLE = '<i class="fa-solid fa-download"></i> Export PDF';

        if (btnExportPdf) {
            btnExportPdf.addEventListener('click', () => {
                const element = document.getElementById('printable-report');
                if (!element) return;

                btnExportPdf.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Exporting...';
                btnExportPdf.disabled = true;

                html2pdf().set({
                    margin: 0.5,
                    filename: `OIC_Campaign_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, backgroundColor: '#ffffff' },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
                }).from(element).save()
                    // The old version had no catch, so any failure left the button
                    // stuck showing "Exporting..." forever.
                    .then(() => resetBtn(btnExportPdf, PDF_BTN_IDLE))
                    .catch(err => {
                        console.error('PDF export failed:', err);
                        alert('PDF export failed: ' + err.message);
                        resetBtn(btnExportPdf, PDF_BTN_IDLE);
                    });
            });
        }

        const btnAiSummary = document.getElementById('btn-generate-ai-summary');
        const AI_BTN_IDLE = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Generate Summary';

        if (btnAiSummary) {
            btnAiSummary.addEventListener('click', async () => {
                if (!geminiApiKey) {
                    alert('Please save your Gemini API Key in the Ads Configuration module first.');
                    return;
                }
                if (!currentParsedData) {
                    alert('Load a dataset first.');
                    return;
                }

                btnAiSummary.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
                btnAiSummary.disabled = true;

                const tableText = Array.from(document.querySelectorAll('#report-table-body tr'))
                    .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent).join(' | '))
                    .join('\n');

                const textOf = id => document.getElementById(id)?.textContent || 'n/a';
                const prompt = `You are an expert Meta Ads Analyst. Here is our campaign performance for ${textOf('report-date-range')}:
Total Spend: ${textOf('report-spend')}
Total Impressions: ${textOf('report-imp')}
Total Clicks: ${textOf('report-clicks')}
Avg CPC: ${textOf('report-cpc')}

Campaign Breakdown:
${tableText}

Write a 3-paragraph executive summary covering best performing campaigns, areas of concern, and actionable recommendations. Use plain prose, bold key figures with **double asterisks**.`;

                try {
                    const response = await fetch(GEMINI_URL(geminiApiKey), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                    });

                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const data = await response.json();

                    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!aiText) throw new Error('Gemini returned no text');

                    const summaryBox = document.getElementById('report-ai-summary');
                    const summaryText = document.getElementById('report-ai-text');
                    if (summaryBox) summaryBox.style.display = 'block';
                    if (summaryText) {
                        summaryText.innerHTML = escapeHtml(aiText)
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br>');
                    }

                    btnAiSummary.innerHTML = '<i class="fa-solid fa-check"></i> Summary Generated';
                    btnAiSummary.disabled = false;
                    setTimeout(() => resetBtn(btnAiSummary, AI_BTN_IDLE), 3000);
                } catch (e) {
                    console.error(e);
                    alert('Error generating summary: ' + e.message);
                    resetBtn(btnAiSummary, AI_BTN_IDLE);
                }
            });
        }

        /**
         * Draw every chart in its empty state. Without this a fresh load shows
         * three blank canvases with no explanation until data arrives.
         */
        function renderEmptyDashboard() {
            const hint = 'Upload an export or sync master data';
            renderDayToDayChart([]);
            setChartEmpty('day-to-day-chart', true, hint);
            renderBreakdownChart('platformChart', [], ['Platform'], COL.impressions, 'doughnut', hint);
            renderBreakdownChart('placementChart', [], ['Placement'], COL.impressions, 'bar', hint);
            renderBreakdownChart('demoChart', [], ['Age'], COL.impressions, 'bar', hint);
        }

        // ---------------------------------------------------------------------
        // BOOT — runs last, after every declaration above is initialised.
        // The team cloud is the shared source of truth; the Google Sheet pull
        // is a manual import that also feeds the cloud.
        // ---------------------------------------------------------------------
        updateReportDateLabel();
        renderEmptyDashboard();
        if (window.OICBackend) {
            window.OICBackend.whenAuthed(() => {
                subscribeCloudDataset().catch(err => console.error('Cloud subscription failed:', err));
                subscribeAliases().catch(err => console.error('Alias subscription failed:', err));
            });
        }
    }
});
