# Tally User Guide

*Simple records. Clearer days.*

Tally is a shared household ledger for expenses, income, accounts, and the real journey your money takes — plus AI-assisted insights to help you save. This guide walks through every part of the app.

---

## Contents

1. [Signing in](#1-signing-in)
2. [Overview](#2-overview)
3. [Spending](#3-spending)
4. [Bills (calendar)](#4-bills-calendar)
5. [Income](#5-income)
6. [Accounts](#6-accounts)
7. [Flow (the money journey ledger)](#7-flow-the-money-journey-ledger)
8. [Goals](#8-goals)
9. [Planned expenses](#9-planned-expenses)
10. [Money Map](#10-money-map)
11. [Insights](#11-insights)
12. [Asking Tally a question](#12-asking-tally-a-question)
13. [Settings & preferences](#13-settings--preferences)
14. [Sharing your household workspace](#14-sharing-your-household-workspace)
15. [Admin & users](#15-admin--users)
16. [Data export & backup](#16-data-export--backup)
17. [Privacy & security](#17-privacy--security)

---

## 1. Signing in

Tally uses **passwordless sign-in**: enter your email address and you'll receive a 6-digit code valid for 15 minutes. Enter the code to sign in — there's no password to remember or leak.

- New to a household? Use **Create Account** on the logon screen, or accept an email invite / shareable link from an existing member (see [Sharing your household workspace](#13-sharing-your-household-workspace)).
- Sessions last up to 30 days and are stored in a secure, httpOnly cookie — nothing you can access from other browser scripts — so you're not asked to log back in every visit.
- For security, you're automatically signed out after **30 minutes of inactivity** in an open tab (no mouse, keyboard, scroll, or touch activity) — you'll see a note on the login screen explaining why next time you sign back in. Actively using the app resets this timer, so it never interrupts you mid-task.
- A copy of your basic profile is cached in your browser's local storage purely so the app can greet you instantly on return visits; it is not used for authentication.

## 2. Overview

The landing dashboard once you sign in. It shows your household's current-period totals at a glance: money in, money out, and how your budget is tracking. Use this as your starting point before drilling into a specific area.

## 3. Spending

The **Spending** tab (and its sub-views: **All**, **AI & Tech**, **Utilities**, **Education**, **Mortgage, Loans & Big Purchases**) is your recurring-bill ledger — subscriptions, utilities, household costs, and big-ticket items like mortgage or loan repayments and one-off large purchases.

- **Add expense**: set the amount, currency, billing cycle (`weekly`, `monthly`, `quarterly`, `termly`, `annual`, `once`), category, payment method, and optional contract end date.
- **Custom categories**: don't see a fit among the built-in categories (e.g. road/bridge tolls)? Pick **+ Create new category…** at the bottom of the category dropdown, name it, and it's instantly available on every category picker in the app — shared across the household, with an automatically assigned colour.
- **One-off costs**: use billing cycle `once` for a single payment (e.g. a large purchase). It won't recur or roll forward once its date passes — mark it paid or delete it when done.
- **Catalog**: add common household bills (Netflix, electricity, broadband, etc.) in one click instead of typing them from scratch.
- **Usage rating**: mark a subscription as low/medium/high usage — low-usage items are flagged as cancellation candidates in Insights.
- **Pause / resume**: pause a subscription instead of deleting it, so you keep the history and see it counted in your "already saving" total.
- **Contract renewal reminders**: once an expense's contract end date is within 60 days, a badge appears on it, and the household is emailed automatically at 30, 14 and 7 days before it ends.
- **Contact a vendor**: if an expense has a vendor email saved, click the mail icon to have Tally draft a polite email (negotiate a better rate, cancel, or ask about renewal terms). You always review and send it yourself — nothing is emailed automatically.

## 4. Bills (calendar)

A 31-day renewal calendar showing what's due and when, with urgency indicators for anything renewing within 7 days. Use it to plan cash flow around due dates.

## 5. Income

Record salary, freelance, rental, or other recurring income with an amount, currency, and frequency. Link each income source to the account it lands in (see [Accounts](#6-accounts)) so Money Map and money-flow analysis can use it.

## 6. Accounts

Your household's bank accounts, cards, and loans, stored with sensitive fields (account/routing numbers, online banking logins, security notes) **encrypted at rest** — never sent to the browser in plain text, only revealed on demand.

Supported account types: **Checking, Savings, Credit Union, Credit Card, Debit Card, PayPal, Loan, Investment, Other**.

- Link expenses to the account they're paid from, and income to the account it's deposited into — this powers Money Map and the Insights AI analysis.
- For a **Loan**, you can track the original amount, interest rate, term, and payoff date.
- Don't have any accounts yet? You don't need to start here — [Statement imports](#7-flow-the-money-journey-ledger) let you add your first account inline, right from the import screen.
- Sensitive fields are masked in list views (`hasAccountNumber`, `hasLoginPassword`, etc.) and only decrypted when you explicitly click "reveal."

## 7. Flow (the money journey ledger)

**Flow** is where you log every real movement of money — the household's transfer ledger. Each entry has a **From** and a **To**:

- **Income landing**: From = *External (income source)*, To = one of your accounts.
- **Moving money between accounts**: From = one account, To = another account (e.g. sweeping savings into current).
- **Payments and one-off spending**: From = the account paying, To = *External (payment / one-off spend)*. This covers recurring direct debits **and** one-off costs like a car repair, a doctor's visit, or a heating repair — just pick which account paid for it and add a note (e.g. "Car repair", "Netflix DD", "Doctor visit").

You can optionally link a transfer to an existing recurring Expense or Income record, or just use a free-text label for anything ad hoc. Every transfer is dated, so Flow becomes a real, searchable history of where your money actually went — not just a projection.

### Statement imports

Under Flow, **Statement imports** lets you cross-check a real bank or credit-card statement against what you've logged:

- **Upload a CSV, PDF, or photo/screenshot** — CSV works best, but Tally reads PDFs and photos with AI, so there's no need to convert a bank PDF to CSV first.
- For CSV, tell Tally which column is the date, description and amount. Either way, pick which **Account** the statement is from — this keeps matching accurate once you have more than one account.
- From a PDF or photo, Tally also extracts whatever account-level details are printed — bank name, account holder, account number, sort code/IBAN, statement period, opening/closing balance — and, once you pick the account, checks the account number and sort code against what's saved for it. A mismatch is flagged; if the account has nothing saved yet, you can save the extracted value in one click.
- **No account for this statement yet?** Click **Add a new account** (or **Add your first account** if you have none) right on the import screen — no need to leave and set one up separately. Give it a name, type, and institution, and any account number/sort code Tally found on the statement is carried straight over and encrypted automatically. This works for CSV statements too, even without extracted details.
- Tally suggests matches against your existing bills and transfers and flags recurring-but-untracked charges worth checking — but only ever auto-confirms a merchant you've personally confirmed before; everything else waits in **Needs review** for an explicit "Confirm match". A suggested match is only ever a guess: the confirm and correct buttons are equally weighted, and a low-confidence guess shows a reassurance note — correcting a match also improves future suggestions for that merchant.
- For anything that isn't a bill you've tracked, **Add as expense** logs it with a proper spending category (remembered per merchant for next time) instead of an anonymous transfer — or use **Log as transfer** for a quick, uncategorized entry.
- **Rename a merchant**: click the pencil next to any row's description to give a cryptic bank description a friendly nickname (e.g. "IEPROS" → "Smyths Toy Shop"). It updates that row plus every past and future row for the same merchant, and groups rows under the nickname too.
- **Add all as expense**: for a merchant with several rows in the same statement (e.g. five Starbucks visits), pick a category once on that group and log all of them as expenses in one go, instead of one row at a time.
- **Rename an import**: click the pencil next to a statement's name in the Statement imports list, or from inside the review screen, to give it a friendlier label than the uploaded filename.
- Clicking outside the import dialog never discards anything — only the visible buttons (Back, Import, Done, the X) can close or navigate it.

## 8. Goals

Track savings targets — an emergency fund, a holiday, a deposit. Each goal has a name, target amount, current amount, optional target date, and can be linked to the account the money is actually sitting in. Progress bars show percentage complete and days remaining until the target date.

Use **Split into equal payments** when adding or editing a goal to see what the remaining amount works out to per instalment (2, 4, 12, 20, or a custom number) — it's a quick on-screen calculator only, nothing is saved.

A goal can also be linked from a [Planned expense](#9-planned-expenses), or from any regular bill in the ledger — handy for something cheaper paid annually that you can't afford in one go, like a subscription. Link a mini goal, top it up monthly, and its progress bar shows right on that ledger row (or planned item).

## 9. Planned expenses

For costs you know are coming but aren't required yet — like college fees, a future big purchase, or anything you want to prepare for ahead of time. Tick **"Planned — not required yet"** when adding an expense (or use **"Add planned expense"** from the **Planned** tab) and it sits in its own stand-alone list.

- **Zero impact until activated**: planned items never count towards totals, bills, insights, or the money-flow analysis — they're purely a heads-up list.
- **Link a goal**: optionally link a planned item to a [Goal](#8-goals) to track savings progress towards it right there on the list.
- **Due-soon badge**: once a planned item's expected date is within 30 days, it gets a "consider activating" badge as a gentle reminder.
- **Overview nudge**: when you have planned costs coming up, a quiet banner appears on the Overview dashboard — click it to jump straight to the Planned list. It's informational only and never changes any figures.
- **Activate**: when a planned cost becomes real, click **Activate** to move it into your normal ledger — it will start counting towards totals, bills and insights from that point on.

## 10. Money Map

A visual diagram of your money's journey, with two modes:

- **Actual journey** (default once you've logged transfers in Flow): built from your real dated Transfer records. Three columns — money in (external sources) → your accounts → money out (external destinations) — plus a distinct violet path for direct account-to-account transfers. Filter by **All time / 90 days / 30 days**.
- **Projected**: the original monthly-equivalent view, built from your recurring Expenses/Income linked to accounts — useful before you've logged any real transfers, or to see a "typical month" projection alongside the real history.

Hover any connection to see the exact amount. Account circles are colored blue when net-positive and red when net-negative or a loan.

## 11. Insights

Two sections, side by side:

- **Money flow analysis (AI)**: click **Analyze my money flow** for an on-demand AI review of your accounts, transfers, and goals — flagging idle cash sitting in low-interest accounts, direct-debit **timing risk** (bills landing before income arrives), account **consolidation** opportunities, and concrete **savings** suggestions. This is opt-in per click, not automatic, and only ever uses your own household's data.
- **What could we save?**: a rule-based (non-AI) breakdown of savings opportunities — switching monthly subscriptions to annual billing, rarely-used subscriptions worth cancelling, and a running total of what you're already saving from paused subscriptions. Toggle the horizon between 1 month, 1 year, 3 years, and 5 years.

## 12. Asking Tally a question

Click the search icon in the top bar to ask a plain-English question about your own household data — e.g. *"where can I save"* or *"what's going out this week"*. Tally answers using only your household's expense and income records; it never sees or uses data from any other household.

## 13. Settings & preferences

Open via the gear icon in the top bar. Set your preferred display currency (EUR, GBP, USD, CAD, AUD, JPY — amounts convert automatically), and manage other household-wide preferences.

## 14. Sharing your household workspace

Click **Share** to:

- Send a direct email invite to a partner or family member, or
- Copy a shareable invite link / invite code for them to join.

Everyone in the same household sees the same shared ledger — accounts, expenses, income, transfers, and goals are all shared, not per-person.

## 15. Admin & users

Available to **Admin** and **Backup Admin** roles via the avatar menu. Manage household member accounts, change roles, and remove accounts that no longer belong. A household must always keep at least one Admin — Tally won't let you remove the last one. Admins can also trigger a full database backup export.

Roles:
- **Admin** — full control: users, workspace sharing, backups.
- **Member** — day-to-day use: log, categorize, and edit household expenses, income, accounts, transfers, and goals.
- **Backup Admin** — a disaster-recovery role for emergency failover if the primary Admin is unavailable.

## 16. Data export & backup

Click **Export** at any time to download your records as a CSV spreadsheet or a full JSON backup. Admins can also trigger a full database backup from the Admin tab.

## 17. Privacy & security

- Passwordless sign-in via one-time 6-digit codes — no passwords stored anywhere.
- Session tokens live in a secure, httpOnly cookie, valid up to 30 days — but an idle tab automatically signs out after 30 minutes of no activity, independent of that 30-day window.
- The screen blurs automatically for privacy after 90 seconds of inactivity (or when the tab loses focus) — click to reveal again. Toggle it manually anytime with the eye icon in the top bar.
- Sensitive account fields (account numbers, online banking logins, security notes) are encrypted at rest and only decrypted on an explicit "reveal" action — or, for statement imports, an on-the-fly admin-only comparison that returns a match/mismatch signal but never the decrypted value itself.
- AI features (the Ask box and Money flow analysis) only ever send your own household's data, and only when you actively trigger them — nothing runs automatically in the background.
- Full details: see the in-app **Privacy** page (footer link) and the **AI transparency** page.

---

*Still stuck? Use the in-app Help guide (avatar menu → Help guide) for a quick tour, or reach out to whoever set up your household workspace.*
