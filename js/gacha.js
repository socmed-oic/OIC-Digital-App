/**
 * Ritual Teratai — DEMO gacha for OIC.
 *
 * Playable showcase only: nothing is stored, anywhere. No localStorage, no
 * Supabase, no auth. Reloading the page wipes everything and rituals are
 * unlimited, so the experience can be tried over and over.
 *
 * Because nothing persists and no voucher is ever tracked, the codes shown are
 * illustrative — they demonstrate what a real voucher would look like. The UI
 * says so plainly; a visitor must never leave thinking they hold a redeemable
 * discount.
 *
 * Turning this into a live promo means adding, in this order: server-side
 * drawing (so the odds cannot be edited in the browser), an issued_vouchers
 * table to validate codes against, and a per-person limit.
 */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // =========================================================================
    // CONFIG — everything a marketer would want to change lives here.
    // =========================================================================

    /**
     * Odds must sum to 100. Displayed openly in the UI: gacha mechanics that
     * hide their rates are a bad look and, in several markets, not allowed.
     */
    const PRIZES = [
        {
            id: 'grand', weight: 2, tier: 'Sanctuary', rarity: 'Legendary',
            value: '50%', label: 'Diskon 50%', color: '#f0c869',
            sub: 'Hadiah utama. Ritual paling langka — nikmati perawatan lengkap dengan setengah harga.',
        },
        {
            id: 'cash25', weight: 18, tier: 'Serenity', rarity: 'Rare',
            value: '25K', label: 'Potongan Rp 25.000', color: '#b9a0e8',
            sub: 'Potongan langsung Rp 25.000 untuk perawatan pilihan Anda.',
        },
        {
            id: 'off10', weight: 30, tier: 'Bloom', rarity: 'Uncommon',
            value: '10%', label: 'Diskon 10%', color: '#8fd3b0',
            sub: 'Sepuluh persen lebih ringan untuk sesi relaksasi berikutnya.',
        },
        {
            id: 'off5', weight: 50, tier: 'Petal', rarity: 'Common',
            value: '5%', label: 'Diskon 5%', color: '#cbbfae',
            sub: 'Sentuhan kecil untuk memulai ritual perawatan Anda.',
        },
    ];

    const BRANDS = [
        { id: 'annathaya', name: 'Annathaya', logo: 'img/brands/annathaya.png' },
        { id: 'odilia', name: 'Odilia Spa & Massage', logo: 'img/brands/odilia.png' },
        { id: 'nirvaya', name: 'Nirvaya', logo: 'img/brands/nirvaya.png' },
        { id: 'odelique', name: 'Odélique', logo: 'img/brands/odelique.png' },
        { id: 'square', name: 'The Square Fitness Gym', logo: 'img/brands/square-gym.png' },
        { id: 'oic', name: 'Outlet OIC mana pun', logo: 'img/brands/oic.png' },
    ];

    const VOUCHER_DAYS = 30;      // shown on the illustrative voucher
    const HOLD_MS = 1600;         // how long the button must be held

    /**
     * The only state there is: this tab's rituals, in memory. Never written to
     * storage — a reload starts fresh, which is what a demo wants.
     */
    const sessionPulls = [];

    // =========================================================================
    // DRAW
    // =========================================================================
    const TOTAL_WEIGHT = PRIZES.reduce((s, p) => s + p.weight, 0);

    /**
     * Weighted pick using crypto randomness where available. The cumulative
     * walk is inclusive of the final bucket, so floating point can never fall
     * through and return undefined.
     */
    function drawPrize() {
        let roll;
        if (window.crypto && window.crypto.getRandomValues) {
            const buf = new Uint32Array(1);
            window.crypto.getRandomValues(buf);
            roll = (buf[0] / 4294967296) * TOTAL_WEIGHT;
        } else {
            roll = Math.random() * TOTAL_WEIGHT;
        }
        let acc = 0;
        for (const prize of PRIZES) {
            acc += prize.weight;
            if (roll < acc) return prize;
        }
        return PRIZES[PRIZES.length - 1];
    }

    /** Human-friendly code: no 0/O/1/I so it can be read aloud at the counter. */
    function voucherCode(prize) {
        const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const buf = new Uint32Array(5);
        if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(buf);
        else for (let i = 0; i < 5; i++) buf[i] = Math.floor(Math.random() * 4294967296);
        const rand = [...buf].map(n => ALPHABET[n % ALPHABET.length]).join('');
        return `OIC-${prize.tier.slice(0, 4).toUpperCase()}-${rand}`;
    }

    const fmtDate = d => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // =========================================================================
    // DOM
    // =========================================================================
    const el = id => document.getElementById(id);
    const bowl = el('bowl');
    const lotus = el('lotus');
    const chargeFill = el('charge-fill');
    const ritualBtn = el('ritual-btn');
    const btnLabel = el('ritual-btn-label');
    const quotaNote = el('quota-note');
    const reveal = el('reveal');
    const revealCard = el('reveal-card');

    let selectedBrand = BRANDS[0];

    // ---- steam particles ----
    (function steam() {
        const host = el('steam');
        if (!host) return;
        for (let i = 0; i < 14; i++) {
            const p = document.createElement('i');
            p.style.left = (Math.random() * 100) + '%';
            p.style.animationDuration = (13 + Math.random() * 12) + 's';
            p.style.animationDelay = (-Math.random() * 22) + 's';
            p.style.setProperty('--sway', (Math.random() * 90 - 45) + 'px');
            host.appendChild(p);
        }
    })();

    // ---- lotus petals ----
    (function buildLotus() {
        if (!lotus) return;
        const NS = 'http://www.w3.org/2000/svg';

        const defs = document.createElementNS(NS, 'defs');
        defs.innerHTML =
            '<linearGradient id="petalGrad" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#fff8ec"/>' +
            '<stop offset="55%" stop-color="#f0dcb8"/>' +
            '<stop offset="100%" stop-color="#c9a163"/>' +
            '</linearGradient>';
        lotus.appendChild(defs);

        // Three rings, drawn innermost first so outer petals layer on top.
        const RINGS = [
            { count: 6, len: 42, wide: 13, open: 26, delay: 0 },
            { count: 8, len: 62, wide: 17, open: 44, delay: 90 },
            { count: 10, len: 84, wide: 21, open: 62, delay: 180 },
        ];

        RINGS.forEach((ring, ri) => {
            const g = document.createElementNS(NS, 'g');
            g.dataset.ring = String(ri);
            for (let i = 0; i < ring.count; i++) {
                const angle = (360 / ring.count) * i + (ri * 12);
                const p = document.createElementNS(NS, 'path');
                // Teardrop petal pointing "up" from the origin.
                p.setAttribute('d',
                    `M 0 0 C ${ring.wide} ${-ring.len * 0.35}, ${ring.wide * 0.7} ${-ring.len * 0.8}, 0 ${-ring.len} ` +
                    `C ${-ring.wide * 0.7} ${-ring.len * 0.8}, ${-ring.wide} ${-ring.len * 0.35}, 0 0 Z`);
                p.setAttribute('class', 'petal');
                p.dataset.angle = String(angle);
                p.dataset.open = String(ring.open);
                p.dataset.delay = String(ring.delay + i * 22);
                // Closed: petals stand upright, overlapping into a bud.
                p.style.transform = `rotate(${angle}deg) scale(0.62)`;
                p.style.opacity = ri === 2 ? '1' : '0.9';
                g.appendChild(p);
            }
            lotus.appendChild(g);
        });
    })();

    function setLotusOpen(open) {
        lotus.querySelectorAll('.petal').forEach(p => {
            const angle = p.dataset.angle;
            if (open) {
                p.style.transitionDelay = p.dataset.delay + 'ms';
                // Bloom: tilt outward, push away from centre, grow.
                p.style.transform =
                    `rotate(${angle}deg) translateY(-${p.dataset.open * 0.42}px) scale(1.18)`;
            } else {
                p.style.transitionDelay = '0ms';
                p.style.transform = `rotate(${angle}deg) scale(0.62)`;
            }
        });
    }

    // ---- brand picker ----
    (function brands() {
        const grid = el('brand-grid');
        if (!grid) return;
        BRANDS.forEach((b, i) => {
            const btn = document.createElement('button');
            btn.className = 'brand';
            btn.type = 'button';
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', String(i === 0));
            btn.setAttribute('aria-label', b.name);
            btn.title = b.name;
            const img = document.createElement('img');
            img.src = b.logo;
            img.alt = b.name;
            btn.appendChild(img);
            btn.addEventListener('click', () => {
                selectedBrand = b;
                grid.querySelectorAll('.brand').forEach(x => x.setAttribute('aria-checked', 'false'));
                btn.setAttribute('aria-checked', 'true');
            });
            grid.appendChild(btn);
        });
    })();

    // ---- odds table ----
    (function odds() {
        const table = el('odds-table');
        if (!table) return;
        PRIZES.forEach(p => {
            const tr = document.createElement('tr');
            const name = document.createElement('td');
            name.className = 'o-name';
            const dot = document.createElement('span');
            dot.className = 'dot';
            dot.style.background = p.color;
            name.appendChild(dot);
            name.appendChild(document.createTextNode(`${p.label} · ${p.tier}`));
            const pct = document.createElement('td');
            pct.className = 'o-pct';
            pct.style.color = p.color;
            pct.textContent = ((p.weight / TOTAL_WEIGHT) * 100).toFixed(0) + '%';
            tr.appendChild(name);
            tr.appendChild(pct);
            table.appendChild(tr);
        });

        const toggle = el('odds-toggle');
        const body = el('odds-body');
        toggle.addEventListener('click', () => {
            const open = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!open));
            body.hidden = open;
        });
    })();

    // =========================================================================
    // HOLD-TO-CHARGE
    // =========================================================================
    const CIRC = 703.7; // 2πr for r=112, matching the SVG
    let holdStart = 0;
    let rafId = null;
    let firing = false;

    function setCharge(ratio) {
        chargeFill.style.strokeDashoffset = String(CIRC * (1 - ratio));
    }

    function tick() {
        const ratio = Math.min(1, (performance.now() - holdStart) / HOLD_MS);
        setCharge(ratio);
        if (ratio >= 1) { endHold(true); return; }
        rafId = requestAnimationFrame(tick);
    }

    function startHold(e) {
        if (firing) return;
        if (e && e.cancelable) e.preventDefault();
        holdStart = performance.now();
        bowl.classList.add('charging');
        btnLabel.textContent = 'Tahan…';
        rafId = requestAnimationFrame(tick);
    }

    function endHold(completed) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        if (!holdStart) return;
        holdStart = 0;
        bowl.classList.remove('charging');

        if (completed) {
            fire();
        } else {
            setCharge(0);
            btnLabel.textContent = 'Tekan & tahan';
        }
    }

    ritualBtn.addEventListener('mousedown', startHold);
    ritualBtn.addEventListener('touchstart', startHold, { passive: false });
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev =>
        ritualBtn.addEventListener(ev, () => endHold(false)));

    // Keyboard: hold Space/Enter. keydown repeats, so only the first starts it.
    ritualBtn.addEventListener('keydown', (e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !holdStart) { e.preventDefault(); startHold(null); }
    });
    ritualBtn.addEventListener('keyup', (e) => {
        if (e.key === ' ' || e.key === 'Enter') endHold(false);
    });

    // =========================================================================
    // FIRE → BLOOM → REVEAL
    // =========================================================================
    function fire() {
        firing = true;
        ritualBtn.disabled = true;
        btnLabel.textContent = 'Mekar…';

        const prize = drawPrize();
        const now = new Date();
        const expires = new Date(now.getTime() + VOUCHER_DAYS * 86400000);

        const voucher = {
            code: voucherCode(prize),
            prizeId: prize.id,
            label: prize.label,
            value: prize.value,
            tier: prize.tier,
            color: prize.color,
            brandId: selectedBrand.id,
            brandName: selectedBrand.name,
            brandLogo: selectedBrand.logo,
            issued: now.toISOString(),
            expires: expires.toISOString(),
        };

        sessionPulls.unshift(voucher);

        bowl.classList.add('bloomed');
        setLotusOpen(true);

        setTimeout(() => showReveal(prize, voucher), 1250);
        setTimeout(() => {
            bowl.classList.remove('bloomed');
            setLotusOpen(false);
            setCharge(0);
            firing = false;
            ritualBtn.disabled = false;
            btnLabel.textContent = 'Tekan & tahan';
        }, 2600);
    }

    function showReveal(prize, voucher) {
        revealCard.style.setProperty('--tier-color', prize.color);
        el('tier-badge').textContent = `${prize.rarity} · ${prize.tier}`;
        el('prize-value').textContent = prize.value;
        el('prize-title').textContent = prize.label;
        el('prize-sub').textContent = prize.sub;

        const logo = el('voucher-logo');
        logo.src = voucher.brandLogo;
        logo.alt = voucher.brandName;
        el('voucher-code').textContent = voucher.code;
        el('voucher-meta').textContent =
            `${voucher.brandName} · contoh masa berlaku ${fmtDate(new Date(voucher.expires))}`;
        // Say plainly that this is a sample. Nothing is recorded, so a visitor
        // must not walk away believing they hold a redeemable discount.
        el('terms').textContent =
            'Contoh tampilan voucher — ini demo, kode tidak tersimpan dan belum berlaku di outlet.';

        reveal.hidden = false;
        el('close-reveal').focus();
        renderSession();
    }

    function closeReveal() { reveal.hidden = true; }

    el('close-reveal').addEventListener('click', closeReveal);
    el('again').addEventListener('click', () => {
        closeReveal();
        ritualBtn.focus();
    });
    reveal.addEventListener('click', (e) => { if (e.target === reveal) reveal.hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !reveal.hidden) reveal.hidden = true; });

    el('copy-code').addEventListener('click', async () => {
        const btn = el('copy-code');
        const code = el('voucher-code').textContent;
        try {
            await navigator.clipboard.writeText(code);
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin';
        } catch (err) {
            // Clipboard needs a secure context and permission; tell the user
            // rather than silently doing nothing.
            btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Salin manual';
        }
        setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Salin kode'; }, 2000);
    });

    // =========================================================================
    // SESSION LOG
    // In place of a saved wallet: what this tab has drawn so far. Doubles as a
    // live demonstration that the rare tiers really are rare.
    // =========================================================================
    function renderSession() {
        const panel = el('session-panel');
        const list = el('session-list');
        const tally = el('session-tally');
        if (!panel || !list) return;

        if (sessionPulls.length === 0) { panel.hidden = true; return; }
        panel.hidden = false;

        const counts = {};
        sessionPulls.forEach(v => { counts[v.prizeId] = (counts[v.prizeId] || 0) + 1; });
        tally.innerHTML = '';
        PRIZES.forEach(p => {
            if (!counts[p.id]) return;
            const chip = document.createElement('span');
            chip.className = 'tally-chip';
            chip.style.color = p.color;
            chip.style.borderColor = p.color;
            chip.textContent = `${p.value} × ${counts[p.id]}`;
            tally.appendChild(chip);
        });

        list.innerHTML = '';
        sessionPulls.slice(0, 10).forEach(v => {
            const row = document.createElement('div');
            row.className = 'v-item';

            const img = document.createElement('img');
            img.src = v.brandLogo; img.alt = '';
            row.appendChild(img);

            const main = document.createElement('div');
            main.className = 'v-main';

            const prize = document.createElement('div');
            prize.className = 'v-prize';
            prize.textContent = v.label;
            prize.style.color = v.color;

            const code = document.createElement('div');
            code.className = 'v-code';
            code.textContent = v.code;

            main.appendChild(prize);
            main.appendChild(code);
            row.appendChild(main);
            list.appendChild(row);
        });
    }

    // =========================================================================
    // BOOT
    // =========================================================================
    setCharge(0);
    setLotusOpen(false);
    quotaNote.textContent = 'Mode demo — mainkan sebanyak yang Anda mau.';
    renderSession();
});
