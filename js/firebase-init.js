/* global firebase */
/**
 * Firebase bootstrap shared by every page. Loads AFTER the compat SDK
 * <script> tags and BEFORE app.js / pr.js.
 *
 * Auth model: one shared team account (TEAM_EMAIL). The 6-digit team PIN is
 * that account's password, verified by Firebase's servers — unlike the old
 * hardcoded client-side PIN, the database rejects anyone who has not signed
 * in, and Firestore security rules only accept this account's email.
 *
 * NOTE: the firebaseConfig below is intentionally public. It identifies the
 * project; it grants no access. Access control lives in Firebase Auth and the
 * Firestore security rules.
 */
(function () {
    'use strict';

    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK failed to load — check the CDN script tags.');
        window.OICFirebase = null;
        return;
    }

    const firebaseConfig = {
        apiKey: 'AIzaSyDvJ_-UNHk-pU9JLUhx0AwvInW7NoIgzZc',
        authDomain: 'oic-digital-app-4cfe5.firebaseapp.com',
        projectId: 'oic-digital-app-4cfe5',
        storageBucket: 'oic-digital-app-4cfe5.firebasestorage.app',
        messagingSenderId: '352022445829',
        appId: '1:352022445829:web:41d7131158213bf736416c'
    };

    const TEAM_EMAIL = 'team@oic-digital.app';

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Offline cache: reads keep working without a connection and queued writes
    // flush when it returns. Fails harmlessly when unsupported (private mode).
    db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        console.warn('Firestore offline cache unavailable:', err.code || err.message);
    });

    let currentUser = null;
    let authKnown = false;
    const authedCallbacks = [];

    auth.onAuthStateChanged(user => {
        currentUser = user;
        authKnown = true;

        // The login page is the only page that exists pre-auth. Everything
        // else redirects there; a signed-in visit to the login page skips it.
        const onLoginPage = !!document.getElementById('login-view');
        if (!user && !onLoginPage) {
            window.location.href = 'index.html';
            return;
        }
        if (user && onLoginPage) {
            window.location.href = 'hub.html';
            return;
        }

        if (user) {
            authedCallbacks.splice(0).forEach(cb => {
                try { cb(user); } catch (e) { console.error(e); }
            });
        }
    });

    window.OICFirebase = {
        auth,
        db,
        TEAM_EMAIL,

        /** Sign in with the shared team PIN (the account's password). */
        signInWithPin(pin) {
            return auth.signInWithEmailAndPassword(TEAM_EMAIL, pin);
        },

        signOut() {
            return auth.signOut().then(() => { window.location.href = 'index.html'; });
        },

        /** Run cb once a signed-in user is available (immediately if already). */
        whenAuthed(cb) {
            if (currentUser) cb(currentUser);
            else authedCallbacks.push(cb);
        },

        /** True once Firebase has reported the initial auth state. */
        isAuthKnown() { return authKnown; },
    };
})();
