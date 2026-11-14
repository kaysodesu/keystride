/* Accounts and saved data via Firebase (Auth + Firestore), so the site can run on
 * static hosting such as GitHub Pages.
 *
 * Sign-in options: Google, Microsoft (Outlook / Hotmail / work accounts), email + password.
 * Guests can use everything without signing in; their scores just aren't saved.
 *
 * The signed-in user's data is cached in memory, so pages read it synchronously with
 * current(). Writes go to Firestore and then update the cache.
 *
 * Firestore layout:
 *   users/{uid}                 { name, created, progress: { [lessonId]: {...} } }
 *   users/{uid}/scores/{id}     { date, wpm, accuracy, errors, seconds, chars, source, kind }
 *   users/{uid}/prompts/{id}    { title, text, created }
 */
window.KS_Store = (function () {
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const cfg = window.KS_FIREBASE_CONFIG;
  const configured = !!(cfg && cfg.apiKey && cfg.projectId);

  let fb = null, auth = null, db = null;
  let user = null;          // cached profile + data for the signed-in user
  let loadedUid = null, loading = null;
  const listeners = new Set();
  const notify = () => listeners.forEach(fn => { try { fn(user); } catch {} });

  const ERRORS = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/popup-closed-by-user': 'The sign-in window was closed before finishing.',
    'auth/cancelled-popup-request': 'The sign-in window was closed before finishing.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Please allow pop-ups for this site and try again.',
    'auth/account-exists-with-different-credential': 'This email is already registered with a different sign-in method. Please use the method you signed up with.',
    'auth/unauthorized-domain': 'This website address is not yet authorized for sign-in (see SETUP.md, step 4).',
    'auth/operation-not-allowed': 'This sign-in method has not been turned on yet (see SETUP.md, step 3).',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/requires-recent-login': 'For your security, please sign out, sign back in, and try again.',
    'permission-denied': 'Permission denied. Please sign in again.',
    'unavailable': 'Could not reach the server. Check your connection and try again.',
  };
  const friendly = e => {
    const code = (e && e.code) || '';
    if (ERRORS[code]) return new Error(ERRORS[code]);
    if (code.startsWith('auth/api-key') || code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found') {
      return new Error('Sign-in is not configured correctly. Check js/firebase-config.js (see SETUP.md, steps 2–3).');
    }
    return new Error(String((e && e.message) || 'Something went wrong.').replace(/^Firebase:\s*/, ''));
  };
  const wrap = fn => async (...args) => { try { return await fn(...args); } catch (e) { throw friendly(e); } };

  function requireReady() {
    if (!configured) throw new Error('Sign-in is not set up on this site yet. You can still play as a guest.');
    if (!fb) throw new Error('Sign-in is still loading. Please try again in a moment.');
  }
  function requireUser() {
    requireReady();
    if (!auth.currentUser || !user) throw new Error('Please sign in first.');
    return auth.currentUser.uid;
  }
  const userRef = uid => fb.doc(db, 'users', uid);

  async function load(fbUser) {
    if (!fbUser) { user = null; loadedUid = null; notify(); return null; }
    if (loadedUid === fbUser.uid && user) return user;
    if (loading && loading.uid === fbUser.uid) return loading.p;
    const p = (async () => {
      const ref = userRef(fbUser.uid);
      let snap = await fb.getDoc(ref);
      if (!snap.exists()) {
        const name = (fbUser.displayName || (fbUser.email || '').split('@')[0] || 'Typist').slice(0, 60);
        await fb.setDoc(ref, { name, created: Date.now(), progress: {} });
        snap = await fb.getDoc(ref);
      }
      const d = snap.data();
      const [sc, pr] = await Promise.all([
        fb.getDocs(fb.query(fb.collection(ref, 'scores'), fb.orderBy('date'), fb.limitToLast(1000))),
        fb.getDocs(fb.query(fb.collection(ref, 'prompts'), fb.orderBy('created', 'desc'))),
      ]);
      user = {
        uid: fbUser.uid,
        name: d.name || 'Typist',
        email: fbUser.email || '',
        emailVerified: fbUser.emailVerified,
        provider: (fbUser.providerData[0] || {}).providerId || 'password',
        created: d.created || Date.now(),
        progress: d.progress || {},
        scores: sc.docs.map(x => ({ id: x.id, ...x.data() })),
        prompts: pr.docs.map(x => ({ id: x.id, ...x.data() })),
      };
      loadedUid = fbUser.uid;
      notify();
      return user;
    })();
    loading = { uid: fbUser.uid, p };
    try { return await p; } finally { if (loading && loading.p === p) loading = null; }
  }

  async function popupSignIn(provider) {
    requireReady();
    const cred = await fb.signInWithPopup(auth, provider);
    return load(cred.user);
  }

  return {
    configured,

    /** Load Firebase and the current session. Resolves even if offline or not configured. */
    async init() {
      try { localStorage.removeItem('ks_db_v1'); localStorage.removeItem('ks_session_v1'); } catch {}
      if (!configured) return null;
      try {
        const [a, b, c] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]);
        fb = { ...a, ...b, ...c };
        const app = fb.initializeApp(cfg);
        auth = fb.getAuth(app);
        db = fb.getFirestore(app);
        let first = true;
        await new Promise(resolve => {
          fb.onAuthStateChanged(auth, async u => {
            try { await load(u); } catch (e) { console.error(e); user = null; }
            if (first) { first = false; resolve(); } else notify();
          });
        });
      } catch (e) {
        console.error('Firebase failed to load', e);
      }
      return user;
    },
    current: () => user,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    // ----- Sign in / out -----
    signInGoogle: wrap(() => {
      requireReady();
      const p = new fb.GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      return popupSignIn(p);
    }),
    signInMicrosoft: wrap(() => {
      requireReady();
      const p = new fb.OAuthProvider('microsoft.com');
      p.setCustomParameters({ prompt: 'select_account' });
      return popupSignIn(p);
    }),
    signUpEmail: wrap(async (name, email, password) => {
      requireReady();
      name = String(name || '').trim().slice(0, 60);
      if (!name) throw new Error('Please enter your name.');
      const cred = await fb.createUserWithEmailAndPassword(auth, String(email).trim(), password);
      await fb.updateProfile(cred.user, { displayName: name });
      fb.sendEmailVerification(cred.user).catch(() => {});
      const u = await load(cred.user);
      if (u.name !== name) { await fb.setDoc(userRef(cred.user.uid), { name }, { merge: true }); u.name = name; }
      return u;
    }),
    signInEmail: wrap(async (email, password) => {
      requireReady();
      const cred = await fb.signInWithEmailAndPassword(auth, String(email).trim(), password);
      return load(cred.user);
    }),
    resetPassword: wrap(async email => {
      requireReady();
      if (!String(email).trim()) throw new Error('Enter your email address first.');
      await fb.sendPasswordResetEmail(auth, String(email).trim());
    }),
    resendVerification: wrap(async () => { requireUser(); await fb.sendEmailVerification(auth.currentUser); }),
    logOut: wrap(async () => { if (auth) await fb.signOut(auth); user = null; loadedUid = null; }),

    // ----- Data -----
    addScore: wrap(async r => {
      const uid = requireUser();
      const s = {
        date: Date.now(),
        wpm: Math.max(0, Math.min(1000, Math.round(+r.wpm || 0))),
        accuracy: Math.max(0, Math.min(100, +r.accuracy || 0)),
        errors: Math.max(0, Math.round(+r.errors || 0)),
        seconds: Math.max(0, +r.seconds || 0),
        chars: Math.max(0, Math.round(+r.chars || 0)),
        source: String(r.source || '').slice(0, 100),
        kind: r.kind === 'lesson' ? 'lesson' : 'practice',
      };
      const ref = await fb.addDoc(fb.collection(userRef(uid), 'scores'), s);
      user.scores.push({ id: ref.id, ...s });
    }),
    clearScores: wrap(async () => {
      const uid = requireUser();
      const ids = user.scores.map(s => s.id);
      for (let i = 0; i < ids.length; i += 400) {
        const batch = fb.writeBatch(db);
        ids.slice(i, i + 400).forEach(id => batch.delete(fb.doc(db, 'users', uid, 'scores', id)));
        await batch.commit();
      }
      user.scores = [];
    }),
    addPrompt: wrap(async (title, text) => {
      const uid = requireUser();
      if (user.prompts.length >= 200) throw new Error('You can save up to 200 prompts.');
      const p = { title: String(title || 'Untitled').slice(0, 60), text: String(text).slice(0, 20000), created: Date.now() };
      const ref = await fb.addDoc(fb.collection(userRef(uid), 'prompts'), p);
      const saved = { id: ref.id, ...p };
      user.prompts.unshift(saved);
      return saved;
    }),
    deletePrompt: wrap(async id => {
      const uid = requireUser();
      await fb.deleteDoc(fb.doc(db, 'users', uid, 'prompts', id));
      user.prompts = user.prompts.filter(p => p.id !== id);
    }),
    getPrompt: id => (user ? user.prompts.find(p => p.id === id) : null),
    setProgress: wrap(async (lessonId, data) => {
      const uid = requireUser();
      const prev = user.progress[lessonId] || {};
      const next = { done: true, bestWpm: Math.max(prev.bestWpm || 0, Math.min(1000, Math.round(data.wpm))), bestAcc: Math.max(prev.bestAcc || 0, data.accuracy), date: Date.now() };
      await fb.updateDoc(userRef(uid), { ['progress.' + lessonId]: next });
      user.progress[lessonId] = next;
    }),
    deleteAccount: wrap(async () => {
      const uid = requireUser();
      const ref = userRef(uid);
      const refs = [
        ...user.scores.map(s => fb.doc(db, 'users', uid, 'scores', s.id)),
        ...user.prompts.map(p => fb.doc(db, 'users', uid, 'prompts', p.id)),
        ref,
      ];
      for (let i = 0; i < refs.length; i += 400) {
        const batch = fb.writeBatch(db);
        refs.slice(i, i + 400).forEach(r => batch.delete(r));
        await batch.commit();
      }
      try { await fb.deleteUser(auth.currentUser); }
      catch (e) {
        if (e.code === 'auth/requires-recent-login') {
          await fb.signOut(auth);
          user = null; loadedUid = null;
          throw new Error('Your data was deleted. To finish removing the sign-in itself, sign in again and delete once more.');
        }
        throw e;
      }
      user = null; loadedUid = null;
    }),
  };
})();
