# Home Alone

> Simple records. Clearer days.

Home Alone is a light-mode household expense and subscription tracking web application built with Next.js App Router, TypeScript, and React 19.

---

## Features

- **Household & Subscription Ledger**: Track recurring streaming platforms (Netflix, Spotify, Apple TV+), AI developer tools (ChatGPT, Claude, Cursor, Midjourney), and essential home utilities (Electricity & Gas, Broadband, Water, Property Tax).
- **Multi-Device Cloud Sync**: Real-time cross-device persistence across your mobile phone, laptop, and desktop via Supabase (PostgreSQL), with offline localStorage fallback.
- **Mobile PWA Ready**: Installable on iOS Safari and Android Chrome as a standalone mobile application via Web App Manifest.
- **Light-Mode Editorial Design System**: Built according to the Home Alone Brand & Interface Guide with custom tokens, Barlow Condensed and Inter typography, and tabular figures.
- **Euro (€ / EUR) Standardized**: Default European financial ledger with multi-currency conversion support (£ GBP, $ USD, CAD, AUD, JPY).
- **AI & Tech Intelligence**: Audits active models and identifies multi-frontier model redundancy (e.g. ChatGPT + Claude concurrent subscription warnings).
- **Household Utilities & Contracts**: Tracks direct debit schedules and flags fixed-term contract expiry dates.
- **Chronological Payment Schedule**: 31-day renewal calendar with 7-day payment urgency countdowns.
- **Budget Optimization**: Objective insights calculating annual tier discount opportunities (~16% / 2 months free) and rotation strategies.
- **Preset Catalog & Portability**: Standard one-click subscription catalog, CSV export for spreadsheets, and offline JSON backup/restore.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Database / Sync**: Supabase (PostgreSQL) + LocalStorage offline-first fallback
- **Styling**: Pure CSS design system with CSS custom properties (`--ha-*`)
- **Icons**: Lucide React
- **Deployment**: 1-click deploy to Vercel, Netlify, or Node.js

---

## Environment Variables (Optional for Cloud Sync)

To enable cross-device cloud sync with Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

*Note: If no Supabase keys are provided, Home Alone automatically uses local browser storage.*

---

## Development

```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
