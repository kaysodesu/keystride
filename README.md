# Keystride — typing practice website

A free typing practice site that runs on **GitHub Pages**. There's no server to run. Sign-in and saved data use **Firebase**.

🌐 **Live site:** https://kaysodesu.github.io/keystride/

👉 **To switch on accounts, follow [SETUP.md](SETUP.md)** (steps 2–6).

## Ways to use it
- **Guest:** practice and the full course, with no account. Scores aren't saved.
- **Continue with Google:** any Gmail or Google account.
- **Continue with Microsoft:** Outlook.com, Hotmail, Live and work or school Microsoft accounts.
- **Email and password:** sign up with any email address. Includes email verification and password reset.

Signed-in users get saved scores, uploaded prompts (`.txt`/`.md` or pasted text), course progress and a dashboard with a speed chart, all synced across devices.

## Features
- **Practice:** random common words, 8 passages, or your own text. Optional 30/60/120s time limit, live WPM/accuracy/errors, and a keyboard guide with see-through hands.
- **Course:** 9 lessons. Each one has highlighted keyboard diagrams with animated transparent hands, then a strict practice drill where you must press the right key to move on.

## Files
```
index.html, css/, js/   the website (this is all GitHub Pages serves)
js/firebase-config.js   paste your Firebase settings here (SETUP.md step 2)
js/data.js              passages, word list and course lessons (edit to add content)
js/store.js             sign-in and saving (Firebase)
firestore.rules         database security rules (SETUP.md step 5)
.nojekyll               tells GitHub Pages to serve files as-is
tools/dev-server.js     optional local preview: node tools/dev-server.js
```

## Security
- Passwords and Google/Microsoft logins are handled entirely by Firebase Authentication. The site never sees or stores passwords.
- `firestore.rules` lets each person read and write only their own data, and checks the shape and size of everything saved.
- The Firebase config in `js/firebase-config.js` is meant to be public. Protection comes from the rules and the Authorized domains list.
