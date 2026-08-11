/* global supabase */
/**
 * Supabase bootstrap yang dipakai semua halaman. Dimuat SETELAH tag <script>
 * supabase-js dan SEBELUM app.js / pr.js.
 *
 * Model auth: satu akun tim bersama (TEAM_EMAIL). PIN 6 digit adalah password
 * akun tersebut, diverifikasi di server Supabase — bukan di browser. Row Level
 * Security menolak setiap request tanpa sesi login yang sah.
 *
 * CATATAN: anon key di bawah memang publik. Ia hanya mengidentifikasi project
 * dan tidak memberi akses apa pun; pengaman sesungguhnya ada di RLS policy
 * (lihat supabase/schema.sql). Service role key dan password database TIDAK
 * BOLEH ada di file ini atau di mana pun dalam aplikasi client-side.
 */
(function () {
    'use strict';

    const SUPABASE_URL = 'https://jyfgfqzbfypdvwmxvdbx.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZmdmcXpiZnlwZHZ3bXh2ZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MTYyNzUsImV4cCI6MjEwMTk5MjI3NX0.pFXqMA90K2cM99Jfph90HD4CrqtQhRkY91sRtpZbfJg';
    const TEAM_EMAIL = 'team@oic-digital.app';

    if (typeof supabase === 'undefined' || !supabase.createClient) {
        console.error('Supabase SDK gagal dimuat — periksa tag script CDN.');
        window.OICBackend = null;
        return;
    }

    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
    });

    let currentUser = null;
    let authKnown = false;
    const authedCallbacks = [];

    function flushAuthed(user) {
        authedCallbacks.splice(0).forEach(cb => {
            try { cb(user); } catch (e) { console.error(e); }
        });
    }

    /**
     * Halaman login adalah satu-satunya halaman yang boleh diakses tanpa sesi.
     * Sisanya dialihkan ke sana; sesi yang sudah aktif melewati halaman login.
     */
    function routeForSession(session) {
        currentUser = session ? session.user : null;
        authKnown = true;

        const onLoginPage = !!document.getElementById('login-view');
        if (!currentUser && !onLoginPage) {
            window.location.href = 'index.html';
            return;
        }
        if (currentUser && onLoginPage) {
            window.location.href = 'hub.html';
            return;
        }
        if (currentUser) flushAuthed(currentUser);
    }

    // getSession() membaca sesi tersimpan sebelum event pertama tiba, sehingga
    // halaman tidak sempat "berkedip" ke login saat reload.
    client.auth.getSession().then(({ data }) => routeForSession(data.session));
    client.auth.onAuthStateChange((_event, session) => {
        // Abaikan sampai pemeriksaan awal selesai supaya tidak redirect ganda.
        if (!authKnown) return;
        routeForSession(session);
    });

    window.OICBackend = {
        client,
        TEAM_EMAIL,

        /** Login dengan PIN tim (password akun bersama). */
        signInWithPin(pin) {
            return client.auth.signInWithPassword({ email: TEAM_EMAIL, password: pin })
                .then(({ data, error }) => {
                    if (error) throw error;
                    return data;
                });
        },

        signOut() {
            return client.auth.signOut().then(() => { window.location.href = 'index.html'; });
        },

        /** Jalankan cb begitu sesi tersedia (langsung bila sudah login). */
        whenAuthed(cb) {
            if (currentUser) cb(currentUser);
            else authedCallbacks.push(cb);
        },

        isAuthKnown() { return authKnown; },
    };
})();
