# Vercel Deployment Setup

The GitHub Actions workflow (`.github/workflows/deploy.yml`) and `vercel.json` are already configured. You just need to wire up the external services.

Pushes to `main` deploy to production. Pull requests get automatic preview deployments.

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

Note the `orgId` and `projectId` values from that file. (The `.vercel/` directory is gitignored — don't commit it.)

---

## Step 4 — Add GitHub repo secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.

Add these three secrets:

| Secret name | Value |
|---|---|
| `VERCEL_TOKEN` | Token from Step 2 |
| `VERCEL_ORG_ID` | `orgId` from Step 3 |
| `VERCEL_PROJECT_ID` | `projectId` from Step 3 |

---

## Step 5 — Add environment variables in Vercel

Go to your Vercel project → **Settings → Environment Variables**.

Add all of the following. Set each one for **Production**, **Preview**, and **Development** environments unless noted otherwise.

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Add after first deploy — see Step 6 |
| `GELATO_API_KEY` | Gelato Dashboard → Account → API |
| `GELATO_BOOK_SKU` | Your Gelato product catalogue |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://colouring-books.vercel.app` |

> Use test-mode Stripe keys (`pk_test_...` / `sk_test_...`) for Preview environments and live keys for Production only.

---

## Step 6 — Stripe webhook (after first deploy)

1. Go to Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Set the endpoint URL to `https://<your-vercel-url>/api/webhooks/stripe`
3. Select the event `checkout.session.completed`
4. Copy the **Signing secret** (`whsec_...`)
5. Add it as `STRIPE_WEBHOOK_SECRET` in Vercel environment variables (Production only)

---

## Step 7 — Supabase auth redirect URL

1. Go to your Supabase project → **Authentication → URL Configuration**
2. Under **Redirect URLs**, add: `https://<your-vercel-url>/api/auth/callback`
3. If using preview deployments, also add the wildcard: `https://*-colouring-books.vercel.app/api/auth/callback`

---

## Triggering the first deploy

Once Steps 1–5 are complete, push any commit to `main`:

```bash
git add vercel.json
git commit -m "Add Vercel deployment config"
git push
```

The Actions workflow will run: type-check → lint → build → deploy. Check progress in the **Actions** tab of your GitHub repo.
