# Keystride — typing practice website

A free typing practice site, hosted on GitHub Pages. There's no server and no sign-in.

🌐 **Live site:** https://kaysodesu.github.io/keystride/
💬 **Discord:** https://discord.gg/rVsJ5Q88yw

## Ways to use it
- **Guest:** practice and the full course straight away. Scores aren't saved.
- **Profile:** enter a first name and a username (no email or password). This saves scores, uploaded prompts and course progress, and turns on the dashboard. Profiles are stored in the visitor's own browser, so they don't carry over to other devices.

## Features
- **Practice:** random common words, 8 passages, or your own text. Optional 30/60/120s time limit, live WPM/accuracy/errors, and a keyboard guide with see-through hands.
- **Course:** 9 lessons. Each one has highlighted keyboard diagrams with animated transparent hands, then a strict practice drill where you must press the right key to move on.
- **My Prompts:** upload `.txt`/`.md` files or paste text to practice with (needs a profile).
- **Dashboard:** best speed, averages, a speed-over-time chart, recent tests and course progress.
- **Discord:** invite links in the top bar, on the home page, on the profile page and in the footer. To change the invite, edit `DISCORD_URL` in `js/app.js` and the footer link in `index.html`.

## Updating the live site
Any change pushed to the `main` branch goes live within a minute or two.

## Files
```
index.html, css/, js/   the website
js/data.js              passages, word list and course lessons (edit to add content)
js/store.js             saves the profile in the browser
.nojekyll               tells GitHub Pages to serve files as-is
tools/dev-server.js     optional local preview: node tools/dev-server.js
```

## Bringing back real accounts later
An earlier version used Firebase for Google, Microsoft and email sign-in, with a setup guide. It's still in this repository's history, in the commit "Keystride typing practice site".


[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/T5N72AQZSL)
