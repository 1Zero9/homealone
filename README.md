# Home Alone

> Simple records. Clearer days.

Home Alone is a light-mode household expense and subscription tracking web application built with React, TypeScript, and Vite.

---

## Features

- **Household & Subscription Ledger**: Track recurring streaming platforms (Netflix, Spotify, Apple TV+), AI developer tools (ChatGPT, Claude, Cursor, Midjourney), and essential home utilities (Electricity & Gas, Broadband, Water, Property Tax).
- **Light-Mode Editorial Design System**: Built according to the Home Alone Brand & Interface Guide with custom tokens, Barlow Condensed and Inter typography, and tabular figures.
- **Euro (€ / EUR) Standardized**: Default European financial ledger with multi-currency conversion support (£ GBP, $ USD, CAD, AUD, JPY).
- **AI & Tech Intelligence**: Audits active models and identifies multi-frontier model redundancy (e.g. ChatGPT + Claude concurrent subscription warnings).
- **Household Utilities & Contracts**: Tracks direct debit schedules and flags fixed-term contract expiry dates.
- **Chronological Payment Schedule**: 31-day renewal calendar with 7-day payment urgency countdowns.
- **Budget Optimization**: Objective insights calculating annual tier discount opportunities (~16% / 2 months free) and rotation strategies.
- **Preset Catalog & Portability**: Standard one-click subscription catalog, CSV export for spreadsheets, and offline JSON backup/restore.

---

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Pure CSS design system with CSS custom properties (`--ha-*`)
- **Icons**: Lucide React
- **Persistence**: LocalStorage with automatic schema migration and CSV/JSON backup utilities

---

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
