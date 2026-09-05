# Tally

> Simple records. Clearer days.

Tally is an editorial light-mode household expense, subscription, and utility tracking web application built with Next.js App Router (15+), TypeScript, React 19, and PostgreSQL via Prisma ORM.

See [`docs/user-guide.md`](./docs/user-guide.md) for a full walkthrough of every feature, or [`docs/technical-overview.md`](./docs/technical-overview.md) for the full technical architecture, data model, API reference, and security model.

---

## Key Features

- **Household & Subscription Ledger**: Track recurring streaming subscriptions (Netflix, Spotify, Apple TV+), AI developer tools (ChatGPT, Claude, Cursor), utilities (Electricity & Gas, Broadband, Water), and family education/sports costs.
- **Passwordless 6-Digit Magic Code Authentication**: Fast, secure sign-in and account registration with 6-digit OTP verification codes and PostgreSQL session management.
- **Shared Household Workspaces & Roles**:
  - **Admin** (`onezeronine@gmail.com`): Full administrative control over users, workspace sharing, and database backups.
  - **Member** (Normal user/family): Ability to view, log, categorize, and edit household expenses.
  - **Backup Admin**: Disaster recovery and emergency failover role.
- **Collaborative Sharing**: Shareable workspace invite links and direct email invitations for partners, spouses, or family members.
- **Warm Household Design System**: Custom Tally design tokens (`--ha-*`), friendly system typography, accessible focus states, responsive controls, and tabular figures for financial accuracy.
- **Money Journey**: Log real transfers between accounts and to/from external payees (Flow), track savings Goals with progress bars (with a quick split-into-instalments calculator), and visualize the actual multi-hop money journey (Money Map).
- **AI Statement Import**: Cross-check a bank/card statement (CSV, PDF, or a photo/screenshot) against your bills — Tally reads PDFs and photos with AI, auto-matches recognised charges, extracts and verifies the account number/sort code against your saved accounts, flags anything worth a second look, and automatically catches likely duplicates from overlapping statement periods.
- **AI Money-Flow Insights**: On-demand AI analysis of idle cash, direct-debit timing risk, account consolidation opportunities, and savings suggestions.
- **Euro (€ / EUR) Standardized**: Default European financial ledger with multi-currency conversion (£ GBP, $ USD, CAD, AUD, JPY).
- **AI & Tech Redundancy Intelligence**: Audits active models and alerts on multi-frontier subscription overlap (e.g. concurrent ChatGPT + Claude subscriptions).
- **Household Utilities & Contracts**: Direct debit schedules, energy provider rates, and contract expiry tracking.
- **Upcoming Renewals Schedule**: 31-day renewal calendar with 7-day payment urgency indicators.
- **Budget Optimisation**: Automated analysis calculating annual tier discounts (~16% / 2 months free) and rotation strategies.
- **Data Portability & Backups**: Preset subscription catalogue, CSV spreadsheet export, and full database JSON snapshots.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Database & ORM**: PostgreSQL via Prisma ORM (`@prisma/client`)
- **Authentication**: Passwordless 6-Digit OTP Magic Code with HTTP-only secure cookie sessions
- **Styling**: Pure Vanilla CSS design tokens (`--ha-*`)
- **Icons**: Lucide React
- **Deployment**: Vercel, Netlify, or Node.js Docker containers

---

## Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL Database Connection URL (e.g. Supabase, Neon, or local Postgres)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Optional Base URL
NEXT_PUBLIC_APP_URL="http://localhost:5174"
```

---

## Getting Started & Development

```bash
# 1. Install dependencies
npm install

# 2. Push schema to database and generate Prisma client
npm run db:push
npx prisma generate

# 3. Seed initial workspace and admin account
npm run db:seed

# 4. Start Next.js development server
npm run dev -- -p 5174
```

Access the application in your browser at [http://localhost:5174](http://localhost:5174).

---

## Authentication & Account Setup

1. **Admin Access**: Sign in with `onezeronine@gmail.com` to receive an admin magic code and access the Admin & Users management tab.
2. **Account Creation**: Click **Create Account** on the logon screen to register a new family/household member account (Role: `MEMBER`).
3. **Collaborative Invites**: Send an invite link or add members directly from the **Share** button in the top navigation bar.

---

## Building for Production

```bash
# Run type checking and production build
npm run build

# Start production server
npm start
```
