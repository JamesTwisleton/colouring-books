# Vercel Deployment Setup

The GitHub Actions workflow (`.github/workflows/deploy.yml`) and `vercel.json` are already in the repo. You just need to wire up the external services below.

Pushes to `main` deploy to production. Pull requests get automatic preview deployments.

> **Payment / print features are disabled.** Stripe and Gelato are not required for this deployment — those features are stubbed out with "coming soon" UI and will be wired up in a future iteration.

---

## Step 1 — Vercel account & project

1. Create a free account at vercel.com (sign in with GitHub)
2. Click **Add New → Project**, import the `colouring-books` GitHub repo
3. On the configure screen, **do not click Deploy** — the GitHub Actions workflow handles deploys

---

## Step 2 — Vercel API token

1. Go to vercel.com/account/tokens
2. Click **Create Token** — name it `github-actions`, no expiry
3. Copy the token (you'll use it in Step 4)

---

## Step 3 — Get your Vercel org & project IDs

Install the Vercel CLI and link the project:

```bash
npm i -g vercel
vercel link
cat .vercel/project.json
```

Note the `orgId` and `projectId` values from that file.

> The `.vercel/` directory is gitignored — do not commit it.

---

## Step 4 — Add GitHub repo secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.

Add these three secrets:

| Secret name | Value |
|---|---|
| `VERCEL_TOKEN` | Token from Step 2 |
| `VERCEL_ORG_ID` | `orgId` from Step 3 |
| `VERCEL_PROJECT_ID` | `projectId` from Step 3 |

These are the only GitHub secrets needed right now.

---

## Step 5 — Set up Supabase

### 5a — Create a project

1. Go to supabase.com and create a free account
2. Click **New project**, give it a name (e.g. `colouring-books`), choose a region close to you, set a database password
3. Wait for provisioning (~1 minute)

### 5b — Find your API keys

1. In the left sidebar, click the **cog icon (Settings)** at the bottom
2. Click **Data API** in the settings menu
3. You will see three values you need:

| What you see in Supabase | Environment variable name |
|---|---|
| **Project URL** (top of the page, looks like `https://abcdefgh.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon** key (under "Project API keys") | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** key (under "Project API keys", click "Reveal") | `SUPABASE_SERVICE_ROLE_KEY` |

> Keep the `service_role` key secret — it bypasses row-level security. Never put it in any `NEXT_PUBLIC_` variable.

### 5c — Configure the auth redirect URL

1. In the left sidebar click **Authentication**, then **URL Configuration**
2. Under **Redirect URLs**, click **Add URL** and add:
   `https://<your-vercel-url>/api/auth/callback`
   (You'll know your Vercel URL after the first deploy — come back and add it then)
3. If using preview deployments, also add:
   `https://*-colouring-books.vercel.app/api/auth/callback`

---

## Step 6 — Add environment variables in Vercel

Go to your Vercel project → **Settings → Environment Variables**.

Add the following, setting each for **Production**, **Preview**, and **Development**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Step 5b |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key from Step 5b |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key from Step 5b |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://colouring-books.vercel.app` |

That's all that's required. Stripe and Gelato variables are not needed yet.

---

## Step 7 — Trigger the first deploy

Push any commit to `main`:

```bash
git add .
git commit -m "Deploy"
git push
```

The Actions workflow will run: **type-check → lint → build → deploy**. Watch progress in the **Actions** tab of your GitHub repo.

After the first deploy you'll have a live URL — go back to Step 5c and add it to Supabase's redirect URL list.
