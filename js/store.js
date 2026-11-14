/* On-device profile: a first name and username (no password, no email).
 * Scores, prompts and course progress are kept in this browser's localStorage.
 * Nothing is sent anywhere. Methods that change data return promises so the pages
 * can treat saving the same way whatever storage is used later. */
window.KS_Store = (function () {
  const KEY = 'ks_profile_v1';
  const listeners = new Set();
  let profile = null;

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
  }
  function write() {
    try {
      if (profile) localStorage.setItem(KEY, JSON.stringify(profile));
      else localStorage.removeItem(KEY);
    } catch {
      throw new Error('Could not save. Your browser may be blocking storage (private mode?), or it is full.');
    }
    listeners.forEach(fn => { try { fn(profile); } catch {} });
  }
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  function validate(firstName, username) {
    firstName = String(firstName || '').trim().replace(/\s+/g, ' ');
    username = String(username || '').trim();
    if (!firstName) throw new Error('Please enter your first name.');
    if (firstName.length > 40) throw new Error('First name must be 40 characters or fewer.');
    if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username)) throw new Error('Username must be 3–24 characters: letters, numbers, _ . -');
    return { firstName, username };
  }
  function need() {
    if (!profile) throw new Error('Create a profile first to save this.');
    return profile;
  }
  // "name" is what pages show in greetings
  const withName = p => { if (p) p.name = p.firstName; return p; };

  return {
    async init() {
      // Clean up data from earlier versions of the site
      try { localStorage.removeItem('ks_db_v1'); localStorage.removeItem('ks_session_v1'); } catch {}
      profile = withName(read());
      return profile;
    },
    current: () => profile,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    async createProfile(firstName, username) {
      const v = validate(firstName, username);
      profile = withName({ ...v, created: Date.now(), scores: [], prompts: [], progress: {} });
      write();
      return profile;
    },
    async updateProfile(firstName, username) {
      const p = need();
      Object.assign(p, validate(firstName, username));
      withName(p);
      write();
      return p;
    },
    async resetProfile() { profile = null; write(); },

    async addScore(r) {
      const p = need();
      p.scores.push({
        id: uid(), date: Date.now(),
        wpm: Math.max(0, Math.round(+r.wpm || 0)), accuracy: +r.accuracy || 0, errors: +r.errors || 0,
        seconds: +r.seconds || 0, chars: +r.chars || 0,
        source: String(r.source || '').slice(0, 100), kind: r.kind === 'lesson' ? 'lesson' : 'practice',
      });
      if (p.scores.length > 1000) p.scores.splice(0, p.scores.length - 1000);
      write();
    },
    async clearScores() { need().scores = []; write(); },

    async addPrompt(title, text) {
      const p = need();
      if (p.prompts.length >= 200) throw new Error('You can save up to 200 prompts.');
      const item = { id: uid(), title: String(title || 'Untitled').slice(0, 60), text: String(text).slice(0, 20000), created: Date.now() };
      p.prompts.unshift(item);
      try { write(); } catch (e) { p.prompts.shift(); throw e; }
      return item;
    },
    async deletePrompt(id) { const p = need(); p.prompts = p.prompts.filter(x => x.id !== id); write(); },
    getPrompt: id => (profile ? profile.prompts.find(x => x.id === id) : null),

    async setProgress(lessonId, data) {
      const p = need();
      const prev = p.progress[lessonId] || {};
      p.progress[lessonId] = { done: true, bestWpm: Math.max(prev.bestWpm || 0, Math.round(data.wpm)), bestAcc: Math.max(prev.bestAcc || 0, data.accuracy), date: Date.now() };
      write();
    },
  };
})();
