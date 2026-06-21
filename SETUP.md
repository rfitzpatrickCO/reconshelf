# Recon Shelf — setup & deploy

A private, single-user book tracker. Each person runs their own account; row-level
security keeps every shelf completely private. Installable as a PWA on iOS and just as
at home on a desktop browser.

---

## 1. Create a free Supabase project (one-time, ~3 min)

1. Go to <https://supabase.com> → sign in → **New project**. Pick a name, a strong
   database password (you won't need it for this app), and a region near you.
2. Wait for it to finish provisioning.
3. **Settings → API**: copy the **Project URL** and the **anon / public** key.
4. **SQL Editor → New query**: paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates the
   tables and the privacy (row-level-security) policies.
5. **Authentication → Providers → Email**: make sure **Email** is enabled. Magic links
   work out of the box on the free tier.
6. **Authentication → URL Configuration**: add your app's URL(s) to **Redirect URLs**
   (e.g. `http://localhost:5173` for local dev and your deployed URL). This is where the
   magic link sends people back after they click it.

## 2. Configure the app locally

```bash
cp .env.example .env
# then edit .env and paste your two values:
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...

npm install
npm run dev
```

Open the printed URL (usually <http://localhost:5173>). Enter your email, click the link
in your inbox, and you're on your shelf. The anon key is *meant* to ship in the client —
RLS is what protects the data, not key secrecy.

## 3. Deploy (free, static hosting)

The app is a static bundle (`npm run build` → `dist/`). Any static host works:

- **Netlify / Vercel:** point it at the repo, set build command `npm run build`, publish
  directory `dist`, and add the two `VITE_…` env vars in the dashboard. Add a redirect so
  client-side routes work (Netlify: a `public/_redirects` file with `/* /index.html 200`;
  Vercel handles SPAs automatically).
- **GitHub Pages (project site):** build with `BASE_PATH=/reconshelf/ npm run build` and
  publish `dist/`. The base path is wired through `vite.config.js`.

After deploying, add the deployed URL to Supabase **Redirect URLs** (step 1.6).

## 4. Install on iPhone (PWA)

1. Open the deployed URL in **Safari** on the iPhone (must be the live HTTPS URL, not
   localhost).
2. Tap the **Share** button → **Add to Home Screen**.
3. Launch it from the home screen — it runs full-screen with no Safari chrome, using the
   brass-tomahawk icon.

## 5. Sharing with friends & family

Each person just visits the same deployed URL and signs in with **their own** email. They
get their own private account and shelf automatically — no one can see anyone else's books
(enforced at the database by the RLS policies). One deployment serves everyone; zero
cross-account visibility, no social features.

---

### Notes / caveats

- **Free Supabase projects pause after ~1 week of zero activity** and take ~30s to wake on
  the next visit. Normal use keeps it awake; the first hit after a long quiet spell is just
  a little slow.
- No external book APIs, analytics, or social posting are wired in — by design (spec §7).
