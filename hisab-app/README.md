# Mohammadia Hisab (second app)

A separate app with two logins, using its **own Firebase project**, so it has its own free 50,000 reads/day:

| Login | Sees |
|---|---|
| **Bank** | The full Bank portal: dashboard, DBBL Daily Hisab, remittance and bank forms. It's the same as in the shop app. |
| **Shop** | Only the shop **Daily Hisab** sheet |

The shop app (`../index.html`) is not changed by this app. This app starts with empty data, because it uses a different project.

## 1. Create the Firebase project (one time)

1. Go to https://console.firebase.google.com and click **Add project**. Use a name like `mohammadia-hisab` and keep the free **Spark** plan.
2. **Build → Authentication → Get started → Email/Password → Enable**.
3. **Authentication → Users → Add user** twice, choosing a password for each:
   - `muhammadiafinance+shop@gmail.com` (Shop login)
   - `muhammadiafinance+bank@gmail.com` (Bank login)

   Password-reset emails for both arrive in the normal `muhammadiafinance@gmail.com` inbox.
4. **Build → Firestore Database → Create database**. Pick a location near you (for example `asia-south1`) and start in production mode.
5. **Firestore → Rules**: paste the contents of `firestore.rules` and click **Publish**.
6. **Project settings (⚙️) → General → Your apps → Web (`</>`)**: register the app, then copy the `firebaseConfig` values into **`config.js`**.

## 2. Put it online at its OWN address

Don't open it at `muhammadiafinance-sudo.github.io/...`. That's the shop app's address, and the two apps would mix data saved on each device. The app refuses to start there.

The easiest free option is **Netlify**, connected to this GitHub repo:

1. Go to https://app.netlify.com, choose **Add new site → Import an existing project → GitHub**, and pick `mohammadia-app`.
2. Leave **Base directory** and **Build command** empty, and set **Publish directory** to `hisab-app`.
3. Deploy. You get an address like `https://mohammadia-hisab.netlify.app`, and every change pushed to the repo updates it automatically.
4. In Firebase → **Authentication → Settings → Authorized domains**, add that Netlify address.

## 3. Updating from the shop app

The bank portal and the hisab sheets are copied from `../index.html`. After the shop app's bank portal or hisab changes, run:

```
python3 hisab-app/build.py
```

This regenerates `hisab-app/index.html`, and `../index.html` is only read. To change this app's own parts, edit `src/app.js`, `src/app.css`, `src/shop.html` or `config.js`, never the generated `index.html`.
