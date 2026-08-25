/**
 * Outlet Monitoring — content production briefs per outlet.
 *
 * Replaces the per-city Action_Plan_SOP_Content_Production_<CITY>.xlsx files
 * the CDM team maintained by hand. Everything those files held is here: the
 * phased action plan, the hand-drawn Gantt (now computed from dates), the SOP
 * and shot checklist, and the reference links.
 *
 * Journey: overview first (every city, one screen, worst problems on top),
 * filter by city or status, click a card for the detail. New briefs come from
 * the standard template so a Surabaya plan can never claim to be Bandung again.
 */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const view = document.getElementById('outlets-view');
    if (!view) return;

    // =========================================================================
    // TEMPLATE — lifted from the team's own spreadsheets, typos fixed.
    // Day offsets are relative to the brief's start date and reproduce the
    // rhythm of the August 2026 plan (including its weekend gaps).
    // =========================================================================
    const TEMPLATE_TASKS = [
        { phase: '1. Persiapan & Briefing', task: 'Filter outlet Spa Cabin & buat content brief promo', scope: 'Outlet', pic: 'Tim CDM', s: 0, e: 1, deliverable: 'Content Brief Approved', quality: 'Sesuai standar visual brand & ketersediaan fasilitas cabin' },
        { phase: '1. Persiapan & Briefing', task: 'Briefing, SOP teknis & siapkan folder GDrive', scope: 'Outlet', pic: 'CDM', s: 2, e: 2, deliverable: 'Folder Drive & Brief Ready', quality: 'Seluruh PIC Outlet paham SOP & kualifikasi video' },
        { phase: '2. Production (Take Content)', task: 'Cek kesiapan outlet, set-up cabin, & briefing therapist, berikan referensi video', scope: 'Outlet', pic: 'PIC Outlet', s: 3, e: 3, deliverable: 'Cabin Clean & Rapi', quality: 'Therapist: cepol rapi, NO accessories, seragam bersih' },
        { phase: '2. Production (Take Content)', task: 'Take Footage Day 1: Exterior, Reception, Waiting, Welcome Drink, Cabin Ambience, Tray', scope: 'Outlet', pic: 'Videographer / PIC', s: 3, e: 3, deliverable: 'Raw Footage Part 1', quality: '4K/1080p 60fps, Cinematic Mode, 3-5 variasi per scene' },
        { phase: '2. Production (Take Content)', task: 'Take Footage Day 2: Treatment & Aftercare, take TikTok trend', scope: 'Outlet', pic: 'Videographer / PIC', s: 4, e: 4, deliverable: 'Raw Footage Part 2', quality: 'Lighting warm/cozy, gerakan smooth, no blur/crack' },
        { phase: '3. Post-Production', task: 'Upload seluruh raw footage & video yang sudah diedit ke Google Drive', scope: 'Online / Drive', pic: 'PIC Outlet', s: 5, e: 5, deliverable: 'Raw Files in Drive', quality: 'Folder terstruktur rapi per outlet & jenis promo' },
        { phase: '3. Post-Production', task: 'Editing video Cinematic Spa Cabin & TikTok creative draft 1 + deadline penyerahan draft pertama', scope: 'HQ / Editor', pic: 'PIC Outlet / Video Editor', s: 5, e: 6, deliverable: 'Video Draft Cut 1', quality: 'Pacing pas, audio jernih, sesuai brief' },
        { phase: '4. Review & Revisi', task: 'Proses kurasi & sortir konten dari seluruh outlet', scope: 'CDM', pic: 'CDM', s: 7, e: 7, deliverable: 'Draft Submission Complete', quality: 'Maksimal H+3 setelah shooting selesai' },
        { phase: '4. Review & Revisi', task: 'Proses perbaikan & revisi video (final adjustment)', scope: 'HQ CDM Team', pic: 'PIC / CDM', s: 8, e: 8, deliverable: 'Hasil Kurasi & Catatan', quality: 'Menjaga estetika visual & reputasi brand luxury' },
        { phase: '5. Publication', task: 'Planning content upload', scope: 'HQ / Editor', pic: 'Video Editor', s: 11, e: 11, deliverable: 'Final Approved Video', quality: 'Jadwal selaras content calendar' },
        { phase: '5. Publication', task: 'Upload video approved ke IG Reels & TikTok sesuai calendar', scope: 'Social Media', pic: 'Socmed Admin', s: 13, e: 13, deliverable: 'Live Social Posts', quality: 'Caption, tagar, dan jam tayang sesuai plan' },
    ];

    const TEMPLATE_CHECKLIST = [
        { section: 'technical', item: 'Device Smartphone', spec: 'Minimal iPhone / Samsung seri terbaru', mandatory: 'Resolusi 4K @ 60 FPS / HD 1080p @ 60 FPS' },
        { section: 'technical', item: 'Mode & Kualitas Video', spec: 'Gunakan Cinematic Mode, lensa bersih', mandatory: 'Video tidak blur, pecah, atau patah' },
        { section: 'technical', item: 'Pencahayaan (Lighting)', spec: 'Terang namun warm, cozy, & relaxing', mandatory: 'Hindari underexposed/overexposed' },
        { section: 'technical', item: 'Stok Footage (B-Roll)', spec: '3-5 variasi footage per scene', mandatory: 'Wajib stok coverage untuk editing' },
        { section: 'therapist', item: 'Penampilan Rambut', spec: 'Rambut wajib dicepol rapi & bersih', mandatory: 'Konsistensi tampilan luxury brand' },
        { section: 'therapist', item: 'Aksesoris Perhiasan', spec: 'NO ACCESSORIES (jam, cincin, gelang)', mandatory: 'Dilarang keras saat take' },
        { section: 'therapist', item: 'Seragam Therapist', spec: 'Seragam bersih, rapi, standar brand', mandatory: 'Tampilan higienis & profesional' },
        { section: 'setup', item: 'Kerapian Spa Cabin', spec: 'Ruangan cabin wajib super rapi & bersih', mandatory: 'Bebas dari barang pribadi' },
        { section: 'setup', item: 'Hospitality Assets', spec: 'Tray, minyak aromaterapi, handuk, kimono', mandatory: 'Penataan sesuai visual brand' },
        { section: 'sequence', item: 'Exterior & Entrance', spec: 'Pintu masuk Spa & signage logo brand', mandatory: 'Establishing shot, welcoming & luxury vibe' },
        { section: 'sequence', item: 'Greeting & Reception', spec: 'Area receptionist & greeting ramah staff', mandatory: 'Hospitality, keramahan, warm smile' },
        { section: 'sequence', item: 'Waiting Area', spec: 'Ruang tunggu & ambience ruang depan', mandatory: 'Kenyamanan, kebersihan ruang tunggu' },
        { section: 'sequence', item: 'Foot Bath / Reflexology', spec: 'Area reflexology / foot bath station', mandatory: 'Kerapian tempat & fasilitas pembuka' },
        { section: 'sequence', item: 'Welcome Experience', spec: 'Penyajian welcome drink & ochibori', mandatory: 'Detail pelayanan, handuk hangat/dingin' },
        { section: 'sequence', item: 'Cabin Ambience', spec: 'Interior view ruang Spa Cabin menyeluruh', mandatory: 'Estetika room, pencahayaan warm cozy' },
        { section: 'sequence', item: 'Equipment Tray', spec: 'Close-up nampan peralatan', mandatory: 'Penataan produk & kebersihan kain' },
        { section: 'sequence', item: 'Treatment Process', spec: 'All treatment massage shots', mandatory: 'Teknik therapist & kenyamanan tamu, 3-5 variasi' },
        { section: 'sequence', item: 'Aftercare Experience', spec: 'Aftercare treatment (ginger tea)', mandatory: 'Sensasi rileks akhir & penutupan ramah' },
    ];

    const SECTION_LABELS = {
        technical: 'Persyaratan Teknis',
        therapist: 'Therapist SOP',
        setup: 'Set-up Ruangan',
        sequence: 'Urutan Pengambilan Gambar',
    };

    const TASK_STATUS = [
        { id: 'pending', label: 'Pending' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'completed', label: 'Completed' },
        { id: 'blocked', label: 'Blocked' },
    ];

    // =========================================================================
    // STATE & HELPERS
    // =========================================================================
    let briefs = [], tasks = [], checklist = [];
    let currentBriefId = null;
    let filterCity = 'all', filterStatus = 'active';

    const el = id => document.getElementById(id);
    const sb = () => (window.OICBackend ? window.OICBackend.client : null);

    function newId(prefix) {
        const rand = (crypto.randomUUID && crypto.randomUUID().slice(0, 8)) ||
            Math.random().toString(36).slice(2, 10);
        return prefix + '-' + Date.now().toString(36) + '-' + rand;
    }

    /** YYYY-MM-DD in LOCAL time; toISOString() would shift a day in UTC+7. */
    function localDateKey(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function addDays(iso, days) {
        const [y, m, dd] = iso.split('-').map(Number);
        const t = new Date(y, m - 1, dd + days);
        return localDateKey(t);
    }
    const todayKey = () => localDateKey(new Date());
    function fmtDate(iso) {
        if (!iso) return '-';
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }

    function isOverdue(task) {
        return task.status !== 'completed' && task.end_date && task.end_date < todayKey();
    }
    function isDueSoon(task) {
        if (task.status === 'completed' || !task.end_date) return false;
        const t = todayKey();
        return task.end_date >= t && task.end_date <= addDays(t, 7);
    }

    const tasksOf = id => tasks.filter(t => t.brief_id === id).sort((a, b) => a.sort_order - b.sort_order);
    const checklistOf = id => checklist.filter(c => c.brief_id === id).sort((a, b) => a.sort_order - b.sort_order);
    function progressOf(id) {
        const list = tasksOf(id);
        if (!list.length) return 0;
        return Math.round(list.filter(t => t.status === 'completed').length / list.length * 100);
    }

    // ---- error banner (outside every panel; lesson from the ads incident) ----
    const banner = el('sync-banner');
    let bannerKind = null; // 'load' | 'write'

    function showBanner(title, text, kind) {
        if (!banner) return;
        bannerKind = kind || 'load';
        banner.hidden = false;
        el('sync-banner-title').textContent = title;
        el('sync-banner-text').textContent = text;
    }
    function hideBanner() { bannerKind = null; if (banner) banner.hidden = true; }

    /**
     * A successful background refetch may only clear LOAD banners. A write
     * failure stays visible until a write succeeds, otherwise the realtime
     * refetch races the error message off the screen before anyone reads it.
     */
    function hideLoadBanner() { if (bannerKind !== 'write') hideBanner(); }

    function describeDbError(error) {
        const text = String((error && error.message) || error).toLowerCase();
        if (text.includes('does not exist') || text.includes('schema cache'))
            return 'Tabel modul ini belum dibuat. Jalankan supabase/schema.sql (versi terbaru) di SQL Editor.';
        if (text.includes('permission') || text.includes('42501') || text.includes('policy'))
            return 'Akses ditolak database: ' + error.message + '. Jalankan supabase/fix-permissions.sql.';
        return error.message || String(error);
    }

    // =========================================================================
    // DATA
    // =========================================================================
    async function fetchAll() {
        const client = sb();
        if (!client) return;

        const [b, t, c] = await Promise.all([
            client.from('outlet_briefs').select('*'),
            client.from('brief_tasks').select('*'),
            client.from('brief_checklist').select('*'),
        ]);
        const failed = [b, t, c].find(r => r.error);
        if (failed) { showBanner('Tidak bisa memuat data', describeDbError(failed.error)); return; }

        briefs = b.data || [];
        tasks = t.data || [];
        checklist = c.data || [];
        hideLoadBanner();
        renderAll();
    }

    /** Single-row save; on failure the change is reverted and explained. */
    async function saveRow(table, row, revert) {
        const client = sb();
        if (!client) { showBanner('Tidak ada koneksi', 'Muat ulang halaman setelah kembali online.'); if (revert) revert(); return false; }
        const { error } = await client.from(table).upsert(row);
        if (error) {
            if (revert) revert();
            showBanner('Perubahan GAGAL disimpan', describeDbError(error), 'write');
            renderAll();
            return false;
        }
        hideBanner();
        return true;
    }

    let realtimeTimer = null;
    function subscribeRealtime() {
        const client = sb();
        if (!client) return;
        ['outlet_briefs', 'brief_tasks', 'brief_checklist'].forEach(table => {
            client.channel('om_' + table)
                .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                    // Small dataset: refetching whole tables beats hand-merging
                    // per-row events, and the debounce absorbs bursts.
                    clearTimeout(realtimeTimer);
                    realtimeTimer = setTimeout(() => fetchAll().catch(console.error), 400);
                })
                .subscribe();
        });
    }

    // =========================================================================
    // RENDER: OVERVIEW
    // =========================================================================
    function visibleBriefs() {
        return briefs
            .filter(b => filterCity === 'all' || b.city === filterCity)
            .filter(b => filterStatus === 'all' || b.status === filterStatus)
            // Worst first: most overdue tasks on top, then by progress.
            .sort((a, b2) => {
                const oa = tasksOf(a.id).filter(isOverdue).length;
                const ob = tasksOf(b2.id).filter(isOverdue).length;
                if (oa !== ob) return ob - oa;
                return progressOf(a.id) - progressOf(b2.id);
            });
    }

    function renderKpis() {
        const active = briefs.filter(b => b.status === 'active');
        const activeTasks = tasks.filter(t => active.some(b => b.id === t.brief_id));
        const overdue = activeTasks.filter(isOverdue).length;
        const dueSoon = activeTasks.filter(isDueSoon).length;
        const avg = active.length
            ? Math.round(active.reduce((s, b) => s + progressOf(b.id), 0) / active.length)
            : 0;

        el('om-kpi-active').textContent = String(active.length);
        el('om-kpi-active-sub').textContent = [...new Set(active.map(b => b.city))].length + ' kota';
        el('om-kpi-overdue').textContent = String(overdue);
        el('om-kpi-overdue').style.color = overdue > 0 ? 'var(--red)' : '';
        el('om-kpi-due').textContent = String(dueSoon);
        el('om-kpi-progress').textContent = avg + '%';
    }

    function renderCityFilter() {
        const sel = el('om-filter-city');
        const prev = sel.value;
        const cities = [...new Set(briefs.map(b => b.city))].sort();
        sel.innerHTML = '<option value="all">Semua Kota</option>';
        cities.forEach(c => {
            const o = document.createElement('option');
            o.value = c; o.textContent = c;
            sel.appendChild(o);
        });
        sel.value = cities.includes(prev) ? prev : 'all';

        const dl = el('om-city-list');
        if (dl) {
            dl.innerHTML = '';
            cities.forEach(c => {
                const o = document.createElement('option');
                o.value = c;
                dl.appendChild(o);
            });
        }
    }

    function briefCard(b) {
        const list = tasksOf(b.id);
        const prog = progressOf(b.id);
        const overdue = list.filter(isOverdue);
        const next = list.filter(t => t.status !== 'completed')
            .sort((x, y) => String(x.end_date).localeCompare(String(y.end_date)))[0];

        const card = document.createElement('div');
        card.className = 'glass-card om-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'Buka brief ' + b.title);

        const head = document.createElement('div');
        head.className = 'om-card-head';
        const city = document.createElement('span');
        city.className = 'chip om-city';
        city.textContent = b.city;
        head.appendChild(city);
        if (overdue.length) {
            const warn = document.createElement('span');
            warn.className = 'chip om-overdue';
            warn.textContent = overdue.length + ' terlambat';
            head.appendChild(warn);
        }
        if (b.status !== 'active') {
            const st = document.createElement('span');
            st.className = 'chip sent-none';
            st.textContent = b.status === 'done' ? 'Selesai' : 'Arsip';
            head.appendChild(st);
        }
        card.appendChild(head);

        const h = document.createElement('h3');
        h.textContent = b.title;
        card.appendChild(h);

        const sub = document.createElement('p');
        sub.className = 'om-card-sub';
        sub.textContent = b.outlet_name + (b.start_date ? ' · mulai ' + fmtDate(b.start_date) : '');
        card.appendChild(sub);

        const track = document.createElement('div');
        track.className = 'om-progress-track';
        const fill = document.createElement('div');
        fill.className = 'om-progress-fill';
        fill.style.width = prog + '%';
        if (overdue.length) fill.classList.add('late');
        track.appendChild(fill);
        card.appendChild(track);

        const foot = document.createElement('div');
        foot.className = 'om-card-foot';
        const done = list.filter(t => t.status === 'completed').length;
        const left = document.createElement('span');
        left.textContent = done + '/' + list.length + ' tugas · ' + prog + '%';
        foot.appendChild(left);
        const right = document.createElement('span');
        if (next) {
            right.textContent = 'Berikutnya: ' + String(next.task).slice(0, 34) + (next.end_date ? ' (' + fmtDate(next.end_date) + ')' : '');
            if (isOverdue(next)) right.classList.add('om-late-text');
        } else {
            right.textContent = list.length ? 'Semua tugas selesai' : 'Belum ada tugas';
        }
        foot.appendChild(right);
        card.appendChild(foot);

        const open = () => openDetail(b.id);
        card.addEventListener('click', open);
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        return card;
    }

    function renderOverview() {
        const grid = el('om-brief-grid');
        grid.innerHTML = '';
        const list = visibleBriefs();
        el('om-empty').hidden = list.length > 0;
        list.forEach(b => grid.appendChild(briefCard(b)));
    }

    // =========================================================================
    // RENDER: DETAIL
    // =========================================================================
    function openDetail(id) {
        currentBriefId = id;
        showSection('detail');
        renderDetail();
    }

    function renderDetail() {
        const b = briefs.find(x => x.id === currentBriefId);
        if (!b) { showSection('overview'); return; }

        el('om-d-title').textContent = b.title;
        el('om-d-sub').textContent = b.city + ' · ' + b.outlet_name +
            (b.start_date ? ' · mulai ' + fmtDate(b.start_date) : '') +
            (b.ref_memo ? ' · ' + b.ref_memo : '');
        const prog = progressOf(b.id);
        el('om-d-progressbar').style.width = prog + '%';
        el('om-d-progresstext').textContent = prog + '%';
        el('om-d-status').value = b.status;

        renderPlanPane(b);
        renderTimelinePane(b);
        renderSopPane(b);
        renderRefsPane(b);
    }

    function statusSelect(task) {
        const sel = document.createElement('select');
        sel.className = 'om-status om-status-' + task.status;
        TASK_STATUS.forEach(s => {
            const o = document.createElement('option');
            o.value = s.id; o.textContent = s.label;
            sel.appendChild(o);
        });
        sel.value = task.status;
        sel.addEventListener('change', async () => {
            const prevStatus = task.status;
            task.status = sel.value;
            renderAll(); renderDetail();
            await saveRow('brief_tasks', task, () => { task.status = prevStatus; });
        });
        return sel;
    }

    function renderPlanPane(b) {
        const pane = el('om-pane-plan');
        pane.innerHTML = '';
        const list = tasksOf(b.id);
        const phases = [...new Set(list.map(t => t.phase))];

        phases.forEach(phase => {
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.marginBottom = '16px';

            const phaseTasks = list.filter(t => t.phase === phase);
            const doneCount = phaseTasks.filter(t => t.status === 'completed').length;

            const head = document.createElement('div');
            head.className = 'card-header';
            const h = document.createElement('h3');
            h.textContent = phase;
            head.appendChild(h);
            const tag = document.createElement('span');
            tag.className = 'glass-tag';
            tag.textContent = doneCount + '/' + phaseTasks.length;
            head.appendChild(tag);
            card.appendChild(head);

            const wrap = document.createElement('div');
            wrap.style.overflowX = 'auto';
            const table = document.createElement('table');
            table.className = 'pr-table';
            table.innerHTML = '<thead><tr><th>Tugas</th><th>PIC</th><th>Jadwal</th><th>Deliverable</th><th>Status</th></tr></thead>';
            const body = document.createElement('tbody');

            phaseTasks.forEach(t => {
                const tr = document.createElement('tr');
                if (isOverdue(t)) tr.classList.add('om-row-late');

                const c1 = document.createElement('td');
                c1.style.maxWidth = '340px';
                const tt = document.createElement('div');
                tt.textContent = t.task;
                c1.appendChild(tt);
                if (t.quality) {
                    const q = document.createElement('div');
                    q.className = 'om-quality';
                    q.textContent = t.quality;
                    c1.appendChild(q);
                }
                tr.appendChild(c1);

                const c2 = document.createElement('td');
                c2.textContent = t.pic || '-';
                tr.appendChild(c2);

                const c3 = document.createElement('td');
                c3.style.whiteSpace = 'nowrap';
                c3.textContent = fmtDate(t.start_date) + (t.end_date !== t.start_date ? ' - ' + fmtDate(t.end_date) : '');
                if (isOverdue(t)) {
                    const late = document.createElement('span');
                    late.className = 'chip om-overdue';
                    late.style.marginLeft = '8px';
                    late.textContent = 'terlambat';
                    c3.appendChild(late);
                }
                tr.appendChild(c3);

                const c4 = document.createElement('td');
                c4.textContent = t.deliverable || '-';
                tr.appendChild(c4);

                const c5 = document.createElement('td');
                c5.appendChild(statusSelect(t));
                tr.appendChild(c5);

                body.appendChild(tr);
            });

            table.appendChild(body);
            wrap.appendChild(table);
            card.appendChild(wrap);
            pane.appendChild(card);
        });
    }

    function renderTimelinePane(b) {
        const pane = el('om-pane-timeline');
        pane.innerHTML = '';
        const list = tasksOf(b.id).filter(t => t.start_date && t.end_date);

        const card = document.createElement('div');
        card.className = 'glass-card';

        if (!list.length) {
            card.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 24px;">Belum ada tugas berjadwal.</p>';
            pane.appendChild(card);
            return;
        }

        const min = list.reduce((m, t) => t.start_date < m ? t.start_date : m, list[0].start_date);
        const max = list.reduce((m, t) => t.end_date > m ? t.end_date : m, list[0].end_date);
        const spanOf = iso => (new Date(iso) - new Date(min)) / 86400000;
        const total = Math.max(1, spanOf(max) + 1);

        const head = document.createElement('div');
        head.className = 'card-header';
        head.innerHTML = '<h3>Timeline</h3>';
        const range = document.createElement('span');
        range.className = 'glass-tag';
        range.textContent = fmtDate(min) + ' - ' + fmtDate(max);
        head.appendChild(range);
        card.appendChild(head);

        const chart = document.createElement('div');
        chart.className = 'om-gantt';

        // Today marker, only when inside the plan's range.
        const t = todayKey();
        if (t >= min && t <= max) {
            const line = document.createElement('div');
            line.className = 'om-gantt-today';
            line.style.left = 'calc(200px + (100% - 200px) * ' + (spanOf(t) / total) + ')';
            line.title = 'Hari ini';
            chart.appendChild(line);
        }

        list.forEach(task => {
            const row = document.createElement('div');
            row.className = 'om-gantt-row';

            const label = document.createElement('div');
            label.className = 'om-gantt-label';
            label.textContent = task.task;
            label.title = task.task;
            row.appendChild(label);

            const track = document.createElement('div');
            track.className = 'om-gantt-track';
            const bar = document.createElement('div');
            bar.className = 'om-gantt-bar om-bar-' + task.status + (isOverdue(task) ? ' late' : '');
            bar.style.left = (spanOf(task.start_date) / total * 100) + '%';
            bar.style.width = Math.max(2.5, (spanOf(task.end_date) - spanOf(task.start_date) + 1) / total * 100) + '%';
            bar.title = task.task + ' (' + fmtDate(task.start_date) + ' - ' + fmtDate(task.end_date) + ')';
            track.appendChild(bar);
            row.appendChild(track);

            chart.appendChild(row);
        });

        card.appendChild(chart);

        const legend = document.createElement('p');
        legend.className = 'om-quality';
        legend.style.marginTop = '12px';
        legend.textContent = 'Digambar otomatis dari tanggal tugas. Garis vertikal menandai hari ini.';
        card.appendChild(legend);
        pane.appendChild(card);
    }

    function renderSopPane(b) {
        const pane = el('om-pane-sop');
        pane.innerHTML = '';
        const items = checklistOf(b.id);
        const sections = ['technical', 'therapist', 'setup', 'sequence'].filter(s => items.some(i => i.section === s));

        sections.forEach(section => {
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.marginBottom = '16px';

            const secItems = items.filter(i => i.section === section);
            const passed = secItems.filter(i => i.status === 'pass').length;

            const head = document.createElement('div');
            head.className = 'card-header';
            const h = document.createElement('h3');
            h.textContent = SECTION_LABELS[section] || section;
            head.appendChild(h);
            const tag = document.createElement('span');
            tag.className = 'glass-tag';
            tag.textContent = passed + '/' + secItems.length + ' pass';
            head.appendChild(tag);
            card.appendChild(head);

            secItems.forEach(item => {
                const row = document.createElement('div');
                row.className = 'om-check';

                const main = document.createElement('div');
                main.className = 'om-check-main';
                const name = document.createElement('div');
                name.className = 'om-check-item';
                name.textContent = item.item;
                main.appendChild(name);
                const spec = document.createElement('div');
                spec.className = 'om-quality';
                spec.textContent = [item.spec, item.mandatory].filter(Boolean).join(' · ');
                main.appendChild(spec);
                row.appendChild(main);

                const btns = document.createElement('div');
                btns.className = 'om-check-btns';
                [['pass', 'Pass'], ['fail', 'Fail']].forEach(([val, label]) => {
                    const btn = document.createElement('button');
                    btn.className = 'om-check-btn ' + val + (item.status === val ? ' on' : '');
                    btn.textContent = label;
                    btn.addEventListener('click', async () => {
                        const prevStatus = item.status;
                        item.status = item.status === val ? 'pending' : val;
                        renderDetail();
                        await saveRow('brief_checklist', item, () => { item.status = prevStatus; });
                    });
                    btns.appendChild(btn);
                });
                row.appendChild(btns);
                card.appendChild(row);
            });

            pane.appendChild(card);
        });

        if (!sections.length) {
            const empty = document.createElement('div');
            empty.className = 'glass-card';
            empty.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 24px;">Brief ini dibuat tanpa checklist SOP.</p>';
            pane.appendChild(empty);
        }
    }

    function renderRefsPane(b) {
        const pane = el('om-pane-refs');
        pane.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'glass-card';
        card.innerHTML = '<div class="card-header"><h3>Video Referensi</h3></div>';

        const refs = Array.isArray(b.refs) ? b.refs : [];
        if (refs.length) {
            const wrap = document.createElement('div');
            refs.forEach((r, idx) => {
                const row = document.createElement('div');
                row.className = 'om-check';

                const main = document.createElement('div');
                main.className = 'om-check-main';
                const top = document.createElement('div');
                top.className = 'om-check-item';
                top.textContent = (r.source ? r.source + ' · ' : '') + (r.category || 'Referensi');
                main.appendChild(top);
                const link = document.createElement('a');
                link.href = /^https?:\/\//i.test(r.url || '') ? r.url : '#';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = r.url || '-';
                link.className = 'om-ref-link';
                main.appendChild(link);
                if (r.note) {
                    const note = document.createElement('div');
                    note.className = 'om-quality';
                    note.textContent = r.note;
                    main.appendChild(note);
                }
                row.appendChild(main);

                const del = document.createElement('button');
                del.className = 'icon-btn';
                del.title = 'Hapus referensi';
                del.innerHTML = '<i class="fa-solid fa-trash"></i>';
                del.addEventListener('click', async () => {
                    const prevRefs = refs.slice();
                    b.refs = refs.filter((_, i) => i !== idx);
                    renderDetail();
                    await saveRow('outlet_briefs', b, () => { b.refs = prevRefs; });
                });
                row.appendChild(del);
                wrap.appendChild(row);
            });
            card.appendChild(wrap);
        } else {
            const empty = document.createElement('p');
            empty.style.cssText = 'color: var(--text-tertiary); padding: 8px 0 16px;';
            empty.textContent = 'Belum ada referensi. Tambahkan tautan IG Reels / TikTok sebagai acuan visual.';
            card.appendChild(empty);
        }

        // add form
        const form = document.createElement('div');
        form.className = 'om-ref-form';
        const cat = document.createElement('input');
        cat.className = 'pr-input'; cat.placeholder = 'Kategori (Ambience / Treatment / ...)';
        const url = document.createElement('input');
        url.className = 'pr-input'; url.placeholder = 'https://www.instagram.com/reel/...';
        const add = document.createElement('button');
        add.className = 'glass-btn primary';
        add.innerHTML = '<i class="fa-solid fa-plus"></i> Tambah';
        add.addEventListener('click', async () => {
            const u = url.value.trim();
            if (!/^https?:\/\//i.test(u)) { url.focus(); return; }
            const prevRefs = (b.refs || []).slice();
            b.refs = [...prevRefs, { category: cat.value.trim() || 'Referensi', url: u }];
            cat.value = ''; url.value = '';
            renderDetail();
            await saveRow('outlet_briefs', b, () => { b.refs = prevRefs; });
        });
        form.appendChild(cat); form.appendChild(url); form.appendChild(add);
        card.appendChild(form);

        pane.appendChild(card);
    }

    // =========================================================================
    // CREATE / DELETE / STATUS
    // =========================================================================
    async function createBrief() {
        const city = el('om-f-city').value.trim();
        const outlet = el('om-f-outlet').value.trim();
        const title = el('om-f-title').value.trim();
        const start = el('om-f-start').value;
        const status = el('om-f-status');

        if (!city || !outlet || !title || !start) {
            status.textContent = 'Kota, outlet, judul, dan tanggal mulai wajib diisi.';
            status.style.color = 'var(--red)';
            return;
        }

        const btn = el('om-f-save');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Membuat...';
        status.textContent = '';
        status.style.color = '';

        const client = sb();
        const brief = {
            id: newId('brief'),
            city, outlet_name: outlet, title,
            ref_memo: el('om-f-memo').value.trim() || null,
            start_date: start,
            status: 'active',
            refs: [],
        };

        try {
            if (!client) throw new Error('cloud connection unavailable');
            let res = await client.from('outlet_briefs').upsert(brief);
            if (res.error) throw res.error;

            if (el('om-f-template').checked) {
                const rows = TEMPLATE_TASKS.map((t, i) => ({
                    id: newId('task'),
                    brief_id: brief.id,
                    phase: t.phase, task: t.task, scope: t.scope, pic: t.pic,
                    start_date: addDays(start, t.s), end_date: addDays(start, t.e),
                    deliverable: t.deliverable, quality: t.quality,
                    status: 'pending', sort_order: i + 1,
                }));
                res = await client.from('brief_tasks').upsert(rows);
                if (res.error) throw res.error;

                const checks = TEMPLATE_CHECKLIST.map((c, i) => ({
                    id: newId('check'),
                    brief_id: brief.id,
                    section: c.section, item: c.item, spec: c.spec, mandatory: c.mandatory,
                    status: 'pending', sort_order: i + 1,
                }));
                res = await client.from('brief_checklist').upsert(checks);
                if (res.error) throw res.error;
            }

            await fetchAll();
            clearCreateForm();
            openDetail(brief.id);
        } catch (err) {
            // The form keeps its values so nothing typed is lost.
            status.textContent = 'Gagal membuat brief: ' + describeDbError(err);
            status.style.color = 'var(--red)';
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Buat Brief';
    }

    function clearCreateForm() {
        ['om-f-city', 'om-f-outlet', 'om-f-title', 'om-f-memo'].forEach(id => { el(id).value = ''; });
        el('om-f-start').value = todayKey();
        el('om-f-template').checked = true;
        el('om-f-status').textContent = '';
    }

    async function deleteBrief() {
        const b = briefs.find(x => x.id === currentBriefId);
        if (!b) return;
        const count = tasksOf(b.id).length;
        if (!confirm('Hapus "' + b.title + '"?\n\n' + count + ' tugas dan checklist-nya ikut terhapus untuk SELURUH TIM, dan tidak bisa dikembalikan.')) return;

        const client = sb();
        if (!client) return;
        try {
            // Explicit deletes: works both with the FK cascade in production and
            // with the flat test fake, which has no cascade.
            let r = await client.from('brief_tasks').delete().eq('brief_id', b.id);
            if (r.error) throw r.error;
            r = await client.from('brief_checklist').delete().eq('brief_id', b.id);
            if (r.error) throw r.error;
            r = await client.from('outlet_briefs').delete().eq('id', b.id);
            if (r.error) throw r.error;
            await fetchAll();
            showSection('overview');
        } catch (err) {
            showBanner('Gagal menghapus', describeDbError(err));
        }
    }

    // =========================================================================
    // NAVIGATION & WIRING
    // =========================================================================
    function showSection(which) {
        el('om-overview').style.display = which === 'overview' ? 'block' : 'none';
        el('om-detail').style.display = which === 'detail' ? 'block' : 'none';
        el('om-create').style.display = which === 'create' ? 'block' : 'none';
        el('om-title').textContent = which === 'create' ? 'Brief Baru' : 'Outlet Monitoring';
    }

    function renderAll() {
        renderKpis();
        renderCityFilter();
        renderOverview();
    }

    el('om-filter-city').addEventListener('change', e => { filterCity = e.target.value; renderOverview(); });
    el('om-filter-status').addEventListener('change', e => { filterStatus = e.target.value; renderOverview(); });
    el('om-new-brief').addEventListener('click', () => { clearCreateForm(); showSection('create'); });
    el('om-f-cancel').addEventListener('click', () => showSection('overview'));
    el('om-f-save').addEventListener('click', createBrief);
    el('om-back').addEventListener('click', () => { currentBriefId = null; showSection('overview'); renderAll(); });
    el('om-d-delete').addEventListener('click', deleteBrief);

    el('om-d-status').addEventListener('change', async e => {
        const b = briefs.find(x => x.id === currentBriefId);
        if (!b) return;
        const prevStatus = b.status;
        b.status = e.target.value;
        renderAll();
        await saveRow('outlet_briefs', b, () => { b.status = prevStatus; renderDetail(); });
    });

    document.querySelectorAll('[data-omtab]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('[data-omtab]').forEach(t => t.classList.toggle('active', t === tab));
            ['plan', 'timeline', 'sop', 'refs'].forEach(p => {
                el('om-pane-' + p).style.display = tab.dataset.omtab === p ? 'block' : 'none';
            });
        });
    });

    const retry = el('sync-banner-retry');
    if (retry) retry.addEventListener('click', () => fetchAll().catch(console.error));

    // =========================================================================
    // BOOT
    // =========================================================================
    el('om-f-start').value = todayKey();
    if (window.OICBackend) {
        window.OICBackend.whenAuthed(() => {
            fetchAll().catch(err => showBanner('Tidak bisa memuat data', describeDbError(err)));
            subscribeRealtime();
        });
    } else {
        showBanner('Koneksi tidak tersedia', 'Muat ulang halaman setelah kembali online.');
    }
});
