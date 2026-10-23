# AIESEC Denmark — OGX CRM

A small internal CRM for tracking OGX (Global Volunteer / Global Talent) Exchange
Participants, replacing the Podio "EP CRM" app. Built with Next.js + Supabase,
deployable for free (Vercel + Supabase free tiers).

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind) — the web app.
- **Supabase** — Postgres database, auth (Google sign-in), and row-level security
  for branch-scoped access.
- **Vercel** — hosting (free Hobby tier).
- **Typeform** — sign-up form; submissions are pushed to the CRM via webhook.

Nobody needs to pay for anything to run this at AIESEC Denmark's current scale
(~20–30 users). All three services' free tiers comfortably cover this.

## One-time setup

You'll need to create three free accounts yourself (an AI assistant can't create
accounts on your behalf): **GitHub**, **Supabase**, and **Vercel**.

### 1. Push this code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a new (private) repository on GitHub and push this folder to it.

### 2. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Once it's created, open **SQL Editor** and run the contents of
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
   This creates all tables, enums, and row-level security policies.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — it
     bypasses all security rules)

### 3. Enable Google sign-in, restricted to @aiesec.dk

1. In Supabase: **Authentication → Providers → Google** → enable it.
2. You need a Google OAuth Client ID/Secret. In
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Create an OAuth 2.0 Client ID (type: Web application).
   - Authorized redirect URI: the callback URL Supabase shows you on the
     Google provider settings page (looks like
     `https://xxxx.supabase.co/auth/v1/callback`).
   - Paste the generated Client ID and Client Secret into Supabase.
3. Because `aiesec.dk` is a Google Workspace domain, the app additionally
   passes `hd=aiesec.dk` when starting the Google sign-in flow
   ([`src/app/login/page.tsx`](./src/app/login/page.tsx)), so only
   `@aiesec.dk` accounts even see a successful sign-in. As a second layer of
   defense, the database itself refuses to create a profile for any other
   email domain (see the `check` constraint on `profiles.email` in the
   migration), and the app signs out and redirects to an error page if it
   ever sees a session with a different domain.

### 4. Set environment variables

Copy `.env.local.example` to `.env.local` and fill in the three Supabase
values above, plus a `TYPEFORM_WEBHOOK_SECRET` (any long random string you
make up — you'll enter the same value in Typeform in step 6).

```bash
cp .env.local.example .env.local
```

Run locally to test:

```bash
npm install
npm run dev
```

### 5. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import the GitHub
   repo.
2. Add the same four environment variables from `.env.local` in the Vercel
   project's **Settings → Environment Variables**.
3. Deploy.
4. In Supabase → **Authentication → URL Configuration**, set the **Site URL**
   to your Vercel URL (or your custom domain, see below) and add it to
   **Redirect URLs** too (`https://your-domain/auth/callback`).

#### Custom domain (crm.aiesec.dk)

1. In Vercel → Project → **Settings → Domains**, add `crm.aiesec.dk`.
2. Vercel will give you a DNS record to add (a `CNAME` pointing
   `crm` → `cname.vercel-dns.com`, typically). Add that record wherever
   `aiesec.dk`'s DNS is managed.
3. Once it resolves, update the Supabase Site URL / Redirect URLs (step above)
   to use `https://crm.aiesec.dk` instead of the `*.vercel.app` URL.

### 6. Connect the Typeform webhook

1. In Typeform: your form → **Connect → Webhooks** → add a new webhook.
   - URL: `https://crm.aiesec.dk/api/typeform-webhook`
   - Secret: the same value you put in `TYPEFORM_WEBHOOK_SECRET`.
2. Open [`src/app/api/typeform-webhook/route.ts`](./src/app/api/typeform-webhook/route.ts)
   and fill in `FIELD_REF_MAP` (which Typeform question → which CRM field)
   and `ENTITY_FIELD_REF` (which question tells us the branch). Each
   question's `ref` is visible in the Typeform builder, or via
   `GET https://api.typeform.com/forms/{form_id}` with your Typeform API
   token. **This step needs the real form in front of us — ping Claude with
   the form link/structure and this file gets filled in together.**

## How access control works

- Every user signs in with their `@aiesec.dk` Google account.
- On first login they're asked to pick their branch (Odense / Kopenhag /
  Aarhus / MC Denmark) — this is permanent; an MC Denmark admin would need to
  fix it directly in the `profiles` table if someone picks wrong.
- Odense/Kopenhag/Aarhus accounts only ever see EPs belonging to their own
  branch. MC Denmark accounts see everything. This is enforced by Postgres
  Row Level Security (`supabase/migrations/0001_init.sql`), not just by the
  app's UI — so it holds even if someone calls the database directly.

## EP status pipeline

- 🟢 Main pipeline, in order: `Open → Applied → Accepted → Paid → Approved →
  Realised → Finished → Completed`
- 🟡 Secondary (re-entering another cycle): `Consecutive Approval`,
  `Re-integrated`
- 🔴 Dropped out of the pipeline: `Dropped`, `Rejected`, `Withdrawn`,
  `No Response`

Every status change is timestamped (`ep_status_history` table), which powers
the Open→Applied / Applied→Accepted / Accepted→Approved duration shown on
each EP's page.

## What's intentionally not here (v1)

- No email notifications — follow-ups only show inside the app.
- No step-by-step checklists per stage (Podio had these) — just the single
  Status field.
- No task/reminder system beyond the "next follow-up" date + description
  fields.
- No historical Podio data — this starts empty.

These were explicit scope decisions, not oversights — easy to revisit later.
