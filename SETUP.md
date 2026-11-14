# Putting Keystride online (GitHub Pages + Firebase)

**GitHub Pages** hosts the website for free. **Firebase** (also free on its Spark plan) handles sign-in and stores scores and prompts. GitHub Pages can only serve files, so Firebase does the account work.

The site works for guests as soon as step 1 is done. Steps 2–6 switch on accounts. Allow about 30 minutes, most of it for the Microsoft step.

In the steps below, replace `YOUR-NAME` with your GitHub username and `keystride` with your repository name if you choose a different one.

---

## 1. Publish the site on GitHub Pages
1. Sign in at https://github.com and click **New repository**. Name it `keystride` and set it to **Public**. (GitHub Pages is free for public repositories.)
2. On the new repository page, click **uploading an existing file**. Drag in **everything inside** the `keystride` folder, including `.nojekyll`, then click **Commit changes**.
   - Tip: hidden files such as `.nojekyll` may not show in File Explorer. Turn on *View → Show → Hidden items*.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then click **Save**.
4. After a minute or two, your site is live at `https://YOUR-NAME.github.io/keystride/`.

At this point, guests can use practice and the full course. The sign-in buttons say accounts aren't switched on yet.

## 2. Create a Firebase project
1. Go to https://console.firebase.google.com and click **Create a project**. Any name works, such as `keystride`. You can turn Google Analytics off.
2. On the project home page, click the **web icon `</>`** to add a web app. Give it a nickname and leave *Firebase Hosting* unticked.
3. Firebase shows a `firebaseConfig = { ... }` block. Open `js/firebase-config.js` and replace `null` with those values:
   ```js
   window.KS_FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "keystride-xxxx.firebaseapp.com",
     projectId: "keystride-xxxx",
     storageBucket: "keystride-xxxx.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   These values are safe to publish. Your data is protected by the rules in step 5.

## 3. Turn on the sign-in methods
In Firebase, go to **Build → Authentication → Get started → Sign-in method**.

**Email/Password:** click it, enable the first switch, and click **Save**.

**Google (Gmail):** click it, enable it, pick a support email, and click **Save**.

**Microsoft (Outlook, Hotmail, Live and work accounts):** this needs an app registration on Microsoft's side.
1. In Firebase, click **Microsoft** and enable it. Copy the **callback URL** shown at the bottom (it ends in `/__/auth/handler`). Leave this tab open.
2. In a new tab, open https://entra.microsoft.com (sign in with any Microsoft account). Go to **Applications → App registrations → New registration**.
   - Name: `Keystride`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: platform **Web**, then paste the callback URL from Firebase
   - Click **Register**.
3. Copy the **Application (client) ID** into the Firebase Microsoft dialog.
4. In Entra, go to **Certificates & secrets → New client secret**, then click **Add**. Copy the secret's **Value** (not its ID) into Firebase. Click **Save** in Firebase.
   - The secret expires (the longest option is 24 months). Put a reminder in your calendar to create a new one and paste it into Firebase before then.

## 4. Allow your GitHub Pages address
In Firebase, go to **Authentication → Settings → Authorized domains → Add domain** and enter `YOUR-NAME.github.io`. Use only the domain: no `https://` and no `/keystride`.

## 5. Create the database and lock it down
1. Go to **Build → Firestore Database → Create database**. Pick a location near your users and start in **production mode**.
2. Open the **Rules** tab. Replace everything with the contents of `firestore.rules` from this folder, then click **Publish**.

## 6. Upload the config and test
1. On GitHub, open `js/firebase-config.js`, click the ✏️ pencil, paste in your config from step 2, and commit.
2. Wait a minute, then open your site and click **Sign in**. Try Google, Microsoft and email sign-up.
   - Email sign-ups get a verification link, and **Forgot your password?** sends a reset link. These come from Firebase's default sender. You can customise them under *Authentication → Templates*.

---

### Troubleshooting
| Message | Fix |
|---|---|
| “This website address is not yet authorized for sign-in” | Step 4: add `YOUR-NAME.github.io` to Authorized domains |
| “This sign-in method has not been turned on yet” | Step 3: enable that provider |
| Microsoft sign-in shows an error about the redirect URI | The Entra redirect URI must exactly match Firebase's callback URL (step 3) |
| Microsoft sign-in stopped working after a long time | The client secret expired. Create a new one in Entra and paste it into Firebase |
| “Permission denied” when saving | Step 5: make sure the rules were published |
| Browser blocked the sign-in window | Allow pop-ups for your site |
| Site changes don’t show up | GitHub Pages can take a few minutes. Hard-refresh with Ctrl+F5 |

### Preview on your own computer
```
node tools/dev-server.js
```
Then open http://localhost:5173. Firebase allows `localhost` by default, so sign-in works there too once steps 2–5 are done.
