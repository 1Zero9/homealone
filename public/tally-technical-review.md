# Tally technical review

**Source documents:** User Guide v1.22.1, Technical Overview v1.24.0
**Reviewed:** 4 September 2026
**Basis:** Documentation only. No code access, no database access, no runtime testing. Items marked `[EVIDENCE NEEDED]` could not be confirmed from the published documentation and may already be handled in the codebase.

---

## 1. Summary

Tally is a well-structured single-tenant-per-household Next.js application with a stronger security posture than most personal projects of its size: passwordless authentication, AES-256-GCM field-level encryption, session-derived household scoping on every query, and reveal-on-demand for sensitive account fields.

Three areas need attention before the app should be trusted with real household financial records:

1. **Monetary data integrity.** Amount field types, exchange rate persistence, and statement reconciliation are either unstated or absent. These determine whether the numbers can be trusted at all.
2. **Prompt injection through statement uploads.** A path exists from attacker-influenced PDF text to an outbound email. This is the highest severity finding in this review.
3. **Absent operational controls.** No rate limiting, no audit history, no bulk session revocation, no migration history, and no test coverage on the two most error-prone modules.

The product gap worth naming separately: there is no `Budget` entity in the data model, so the app records and analyses spending but never warns before a threshold is crossed.

---

## 2. Data integrity findings

### 2.1 Monetary field types are unstated

**Risk:** High. **Effort:** Low to fix now, high to fix later.

Section 2 of the technical overview does not state whether amounts use Prisma `Decimal`, integer minor units, or `Float`. If any monetary field is `Float`, accumulated totals will drift, and reconciliation will never balance cleanly.

**Action:** Confirm and, if needed, migrate to `Decimal(12,2)` or integer cents across `Expense.amount`, `Income.amount`, `Transfer.amount`, `Goal` target and current values, `StatementTransaction` amount, and the loan fields on `Account`.

`[EVIDENCE NEEDED: current Prisma field types for all monetary values]`

### 2.2 Schema changes use db:push rather than migrations

**Risk:** High. **Effort:** Low.

Section 10 documents `npm run db:push`, which resolves the schema by comparison against the live database and can drop columns without an explicit confirmation step. `DIRECT_URL` is documented as the migration connection, but no migration workflow appears anywhere.

For an application holding financial records, schema history should be committed and replayable.

**Action:**
- Adopt `prisma migrate dev` locally and `prisma migrate deploy` in the build pipeline
- Commit the `prisma/migrations` directory
- Reserve `db:push` for local throwaway databases only

### 2.3 Exchange rates are applied but not persisted

**Risk:** Medium. **Effort:** Low.

The ledger is EUR-standardised with live ECB conversion for GBP, USD, CAD, AUD and JPY. If the applied rate is not stored on the record, historic totals cannot be reproduced once rates move, and a figure shown today will differ from the same figure shown next month.

**Action:** Store four fields on any converted record: original amount, original currency code, rate applied, and rate date. Display the original alongside the converted value.

### 2.4 Statement balances are extracted then discarded

**Risk:** Medium. **Effort:** Medium.

`analyzeStatementDocument` extracts opening and closing balances from PDF and photo statements, but `StatementImport` has no balance fields in the documented model. Those two figures are the only available proof that an import captured every row.

**Action:**
- Persist opening balance, closing balance and statement period on `StatementImport`
- Reconcile logged rows against the balance delta after import
- Surface the result plainly, for example "38 rows imported, £43.18 unaccounted for"

### 2.5 No duplicate guard across entry routes

**Risk:** Medium. **Effort:** Medium.

Receipt scanning matches against existing bill names to avoid duplicates, but the same real payment can still enter three ways: manual expense entry, receipt scan, and statement import creating a `Transfer`. Nothing documented prevents the same payment counting two or three times in Money Map, Insights, or the savings horizons.

**Action:** Add a dedupe check on the tuple of amount, date within a tolerance window, and account, applied at write time across all three routes, with a "possible duplicate" prompt rather than a hard block.

**Partially addressed in v1.38.0**: `POST /api/statements` now checks every incoming row against every `StatementTransaction` already on file for the household (scoped to the same account when known) on the tuple of exact date, amount, currency, direction and normalized description, and auto-assigns a new `DUPLICATE` status (reversible via the same "reset" action as `IGNORED`) instead of leaving it in `UNMATCHED` for the household to catch by eye. This closes the specific case named in the "Action" line above — **re-importing the same or an overlapping statement** — with an exact-match check rather than a tolerance window, since a genuine re-import produces identical rows. It does **not** close the broader finding: a payment entered manually or via receipt scan, then later appearing in an imported statement, is still only caught by `statementMatching.ts`'s heuristic score-and-suggest (a "possible match" the household must confirm), not a hard duplicate check — so the three-entry-route risk described above remains open.

---

## 3. Security findings

### 3.1 Prompt injection through statement uploads, with an email exfiltration path

**Risk:** Critical. **Effort:** Medium.

The chain is:

1. A PDF or photo statement is uploaded to `POST /api/statements/extract`
2. `analyzeStatementDocument` extracts free text from the document
3. That text is written to `StatementTransaction.vendorName`, `suggestedCategory`, `MerchantAlias.vendorName`, or `Transfer.externalLabel`
4. Server-side context assembly later includes those stored strings in prompts for `askAboutHouseholdData` or `draftVendorEmail`
5. `POST /api/expenses/[id]/send-vendor-email` sends an outbound email

Instructing the model to use only the supplied JSON is not a control against this, because the injected instruction arrives inside that JSON as legitimate-looking data. Statement descriptions are attacker-influenceable in practice: a payment reference field on an inbound transfer is free text controlled by whoever sent the money.

The severity comes from step 5. A path from untrusted document text to an outbound email is a data exfiltration path.

**Action, in order:**
- Pin the recipient address server-side from the stored `Expense` vendor email. Never accept a recipient from model output or from the request body.
- Delimit and label all statement-derived strings as untrusted data in every downstream prompt, distinct from household data assembled from first-party fields.
- Sanitise extracted strings at write time: strip control characters, cap length, and reject or flag instruction-like patterns.
- Validate drafted email bodies against expected shape and length before the send route will accept them.
- Log every send with the resolved recipient, so misdirection is detectable after the fact.

### 3.2 No rate limiting documented on any route

**Risk:** High. **Effort:** Low.

Two distinct exposures:

**`POST /api/auth/send-code` is unauthenticated** and triggers a Resend email plus a `VerificationToken` row per call, against any email address supplied. That is an email bombing vector aimed at arbitrary third parties, a Resend cost vector, and a reputation risk for the sending domain.

**Every AI route consumes Gemini quota per call** with no documented per-household cap. `statements/extract` in particular is a vision call on a multi-page document. One member in a loop is an uncapped bill.

**Action:**
- Rate limit `send-code` by both email address and source IP, for example five requests per address per hour
- Add a per-household daily cap on AI calls, with a clear in-app message when it is reached
- Return `429` with a retry hint rather than failing silently

`[EVIDENCE NEEDED: whether any rate limiting exists but is undocumented]`

### 3.3 Cron endpoint protection is unstated

**Risk:** Medium. **Effort:** Low.

`GET /api/cron/reminders` sends the 30, 14 and 7 day contract reminder emails. If it has no shared secret header or platform cron signature check, anyone who discovers the path can trigger household emails on demand. Separately, no dedupe record is documented, so a double invocation on the same day sends duplicate emails.

**Action:**
- Require a secret header, checked with a constant-time comparison, or verify the Vercel cron signature
- Add a `SentReminder` record keyed on expense, threshold and date, checked before send

`[EVIDENCE NEEDED: current authentication on cron/reminders]`

### 3.4 Encrypted values carry no key identifier

**Risk:** Medium. **Effort:** Low.

The stored format is `base64(iv):base64(authTag):base64(ciphertext)`, with no indication of which key encrypted the value. `npm run rotate-key` re-encrypts every sensitive field, so an interruption partway through leaves a database with two keys in use and no way to determine which key applies to which row. Recovery would require trial decryption.

**Action:**
- Prefix a key identifier: `v2:base64(iv):base64(authTag):base64(ciphertext)`
- Have decrypt select the key from the prefix, with the previous key retained during rotation
- Make rotation resumable by processing only rows not yet on the current key identifier

### 3.5 Database backups may defeat field-level encryption

**Risk:** Medium to High, depending on implementation. **Effort:** Low.

`DatabaseBackup` stores a full household JSON snapshot. Two possibilities, both needing an explicit decision:

- If the six `*Enc` account fields are decrypted into the snapshot, the result is a plaintext credential dump stored in the same PostgreSQL instance as the encrypted originals, which removes the benefit of field-level encryption entirely.
- If they remain encrypted, the snapshot becomes unrestorable after a key rotation, so the backup silently stops being a backup.

**Action:** Exclude credential fields from snapshots entirely, or encrypt the snapshot under a separate documented backup key with its own key identifier. State the choice in the technical overview.

`[EVIDENCE NEEDED: how admin/backup handles the six *Enc fields]`

### 3.6 Sessions cannot be revoked in bulk

**Risk:** Medium. **Effort:** Low.

Sliding expiration extends a session back to 30 days whenever remaining life drops under roughly 25 days, so a session in regular use never expires. Combined with no documented bulk revocation, a stolen cookie stays valid indefinitely.

There is also no documented session invalidation when an admin removes a member or changes a role. Whether removal takes effect immediately depends on whether `getSessionUser()` re-reads role and household on every request.

**Action:**
- Add a route that deletes all `Session` rows for a user, exposed as "sign out everywhere"
- Call it automatically on member removal and on role change
- Show active sessions with last-used timestamp and approximate location
- Consider an absolute session ceiling, for example 90 days, beyond which sliding renewal stops

`[EVIDENCE NEEDED: whether role and household are re-read from the database per request]`

---

## 4. Access model findings

### 4.1 BACKUP_ADMIN appears functionally identical to ADMIN

**Risk:** Low. **Effort:** Low.

`requireAdmin()` passes for both `ADMIN` and `BACKUP_ADMIN`, so the roles carry the same permissions. It is also unclear whether a Backup Admin satisfies the "at least one Admin" constraint, which determines whether a household can lock itself out of administration.

**Action:** Either give the role constrained rights, for example user management but no backup export and no role changes, or remove it. Document explicitly whether it counts towards the minimum admin rule.

### 4.2 No read-only role

**Risk:** Low. **Effort:** Medium.

All three existing roles can write to the shared ledger. A teenager, an accountant, or a partner who should see the position without editing it has no appropriate role.

**Action:** Add `VIEWER`, enforced by a `requireWriteAccess()` guard applied to every mutating route.

### 4.3 No audit history

**Risk:** Medium. **Effort:** Medium.

`createdById` records attribution at creation only. There is no record of edits, deletions, planned-expense activations, bulk imports, role changes, or backup exports. In a shared ledger with three writeable roles and destructive bulk operations, this is the control that makes every other one verifiable.

**Action:** Add an append-only `AuditLog` table capturing actor, action, entity type, entity ID, before state, after state, and timestamp. Write to it from a single helper called by every mutating route. Expose it to admins as an activity feed.

### 4.4 No batch rollback for imports

**Risk:** Medium. **Effort:** Low.

"Add all as expense" creates multiple records in one action, and `statements/[id]/transactions/[txId]/resolve` creates records one at a time. Nothing documented reverses an import as a unit.

**Action:** Stamp every record created by an import with that `statementImportId`, then offer "undo this import" as a single scoped delete.

### 4.5 No account deletion or data erasure route

**Risk:** Medium, given the data category. **Effort:** Medium.

Section 6 lists `users` for member management and `admin/backup` for export, but no route for deleting a user account or a household. For an application processing financial data about identifiable individuals in the EU and UK, a right-to-erasure request has no documented mechanism. What happens to expenses assigned to a member who leaves is also undefined.

**Action:**
- Add a self-service account deletion route with a confirmation step
- Define the reassignment behaviour for records assigned to a departing member, and surface the choice at removal time
- Document a retention period for `Session`, `VerificationToken`, and `DatabaseBackup` rows, and prune on a schedule

`[EVIDENCE NEEDED: current deletion and retention behaviour, and whether the Privacy page covers this]`

---

## 5. Engineering practice findings

### 5.1 No test suite

**Risk:** Medium. **Effort:** Low for the highest-value coverage.

Section 10 documents `npm run lint` only. Two modules carry most of the silent-failure risk in the codebase, and both are pure functions, which makes them cheap to test:

- `src/lib/billing.ts`, billing-cycle date arithmetic across weekly, monthly, quarterly, termly, annual and once, including month-end rollover and leap years
- `src/lib/statementMatching.ts`, match scoring and confidence thresholds, including the auto-confirm boundary

**Action:** Add Vitest with unit coverage on those two modules first, then on the crypto round trip in `src/lib/crypto.ts`. Run in CI on every push.

### 5.2 Upload limits and timeout behaviour are unstated

**Risk:** Medium. **Effort:** Low.

`statements/extract` accepts PDFs and photographs and passes them to a Gemini vision call. On Vercel this meets both a request body ceiling and a serverless function timeout, and a multi-page statement extraction is not a fast call. Without explicit caps this fails opaquely on exactly the real-world inputs users will supply, such as a twelve-page annual statement or a high-resolution phone photograph.

**Action:**
- Set and document an explicit file size cap and page cap, and validate MIME type server-side rather than trusting the extension
- Compress or downscale images client-side before upload
- Return a specific message on timeout that tells the user what to do, rather than a generic failure
- For large PDFs, consider chunking by page with progress feedback

`[EVIDENCE NEEDED: current size limits, page limits, and observed timeout behaviour on real statements]`

### 5.3 Exchange rate route has no documented caching

**Risk:** Low. **Effort:** Low.

ECB publishes reference rates once per working day, so any call beyond the first per day per currency pair is wasted, and the route depends on an upstream service being reachable at the moment a user saves a record.

**Action:** Cache the daily rate set server-side with a 24-hour TTL, fall back to the last known set on upstream failure, and record which rate date was used per the recommendation in 2.3.

### 5.4 Edge middleware refreshes the cookie without checking session validity

**Risk:** Low. **Effort:** Low.

`middleware.ts` deliberately avoids Prisma, so it cannot know whether the session behind the cookie still exists. It therefore refreshes `maxAge` on requests carrying an expired or revoked session, leaving the browser holding a cookie that looks valid. The user experience is a bounce to sign-in on the next data fetch.

**Action:** Clear the cookie on the first `401` returned from any API route, so the client state matches the server state.

---

## 6. Product gaps

### 6.1 No budget entity

The meta description commits to keeping a budget in balance, but the data model has no `Budget`. The app records what happened and analyses it afterwards, and never warns before a threshold is crossed. This is the largest gap between what the product says it does and what the schema supports.

**Suggested minimum:** per-category monthly caps, a household total cap, a configurable warning threshold, and a progress indicator on the dashboard. Deterministic, no AI call required.

### 6.2 No projected balance by date

The bills calendar shows a 31-day renewal view, which is renewal timing rather than cash position. The data needed for a projection already exists: billing cycles on `Expense`, `nextPayDate` on `Income`, and account links on both.

**Suggested minimum:** a forward view flagging shortfall dates, for example "£180 short on the 28th, three direct debits land before payday". This is more actionable than the on-demand AI review because it is deterministic, reproducible, and free to compute.

### 6.3 No price-creep or missed-payment detection

Statement matching runs in one direction: it finds statement rows corresponding to known bills. Three inversions carry more value than the current matching does:

- **Price creep.** Compare each matched amount against the previous instance of the same bill and report the change with a percentage.
- **Missed payment.** Flag an expected bill that did not appear in a statement covering its due date, which catches failed direct debits.
- **Untracked subscription.** Flag recurring merchants appearing across multiple statements with no matching tracked `Expense`.

All three are computable from data already in the schema, using `MerchantAlias` for merchant identity.

### 6.4 No transaction splitting

A single payment cannot be split across categories, and a bill is assigned to one household member rather than apportioned. A weekly supermarket shop containing groceries, alcohol and household goods currently lands in one category, which degrades every category-level insight the app produces.

**Suggested minimum:** a child-line model on `Expense` and `Transfer`, with a percentage or fixed-amount split across categories or members, and a constraint that child amounts sum to the parent.

---

## 7. Prioritised build order

| # | Item | Section | Risk | Effort | Rationale for position |
|---|------|---------|------|--------|------------------------|
| 1 | Pin email recipient server-side | 3.1 | Critical | Low | Closes the exfiltration end of the injection chain on its own |
| 2 | Confirm and fix monetary field types | 2.1 | High | Low now | Cost of fixing rises with every record added |
| 3 | Rate limit send-code and AI routes | 3.2 | High | Low | Unauthenticated third-party email vector and uncapped spend |
| 4 | Protect and de-duplicate the cron route | 3.3 | Medium | Low | Small change, removes an on-demand email trigger |
| 5 | Adopt Prisma migrations | 2.2 | High | Low | Prerequisite for every schema change below |
| 6 | Sanitise and delimit statement-derived text | 3.1 | Critical | Medium | The remaining injection surface, needs prompt restructuring |
| 7 | Key identifier on encrypted values | 3.4 | Medium | Low | Makes rotation safe and resumable before it is next needed |
| 8 | Resolve the backup encryption question | 3.5 | Medium to High | Low | Currently either a credential dump or a broken backup |
| 9 | Bulk session revocation | 3.6 | Medium | Low | Also fixes removal not taking effect immediately |
| 10 | Unit tests on billing and matching | 5.1 | Medium | Low | Guards every later change to the two riskiest modules |
| 11 | Upload limits and timeout handling | 5.2 | Medium | Low | Real statements are already hitting these ceilings |
| 12 | Audit log | 4.3 | Medium | Medium | Makes every other control verifiable |
| 13 | Batch rollback on imports | 4.4 | Medium | Low | Cheap once records carry an import ID |
| 14 | Persist exchange rates on records | 2.3 | Medium | Low | Historic figures become reproducible |
| 15 | Budget entity and caps | 6.1 | Product | Medium | Closes the gap against the stated product promise |
| 16 | Statement balance reconciliation | 2.4 | Medium | Medium | Proves imports are complete |
| 17 | Cross-source duplicate guard | 2.5 | Medium | Medium | Protects the integrity of every insight — **partially done in v1.38.0** (exact-match re-import guard within statement imports); cross-route (manual/scan vs. statement) case still open |
| 18 | Projected balance by date | 6.2 | Product | Medium | Highest-value feature per unit of effort, all data present |
| 19 | Price creep and missed payment detection | 6.3 | Product | Medium | Inverts matching towards the questions users actually have |
| 20 | Account deletion and retention policy | 4.5 | Medium | Medium | Needed before any non-family user is onboarded |
| 21 | VIEWER role | 4.2 | Low | Medium | Widens who can safely be given access |
| 22 | Transaction splitting | 6.4 | Product | Medium | Improves the quality of all category-level analysis |
| 23 | Resolve BACKUP_ADMIN semantics | 4.1 | Low | Low | Tidy-up, no current functional impact |
| 24 | Exchange rate caching | 5.3 | Low | Low | Cost and resilience, bundle with item 14 |
| 25 | Clear cookie on 401 | 5.4 | Low | Low | Small user experience fix |

Items 1 to 5 are the ones worth doing before adding any further household data.

---

## 8. Open questions

Collected from the `[EVIDENCE NEEDED]` markers above:

1. What Prisma types back every monetary field?
2. Does `getSessionUser()` re-read role and household from the database on every request, or trust the session row?
3. What authenticates `GET /api/cron/reminders`?
4. Does `admin/backup` decrypt the six `*Enc` account fields into the snapshot?
5. Does any rate limiting exist but go undocumented?
6. What are the current file size, page count, and timeout limits on `statements/extract`?
7. Is there any account deletion or data retention behaviour, and does the Privacy page describe it?
8. Does `BACKUP_ADMIN` satisfy the minimum-one-admin constraint?

---

## 9. Developer self-review — 4 September 2026

**Basis:** Direct code access this time (grep across all source files, and a full manual read of every one of the 39 route handlers under `app/api/`), prompted by the question "do we need a paid penetration test before this goes in front of real users?" Answer: no — nothing found below needs a specialist to catch, and a paid pen test is better value once the app has non-family users. This section closes out several `[EVIDENCE NEEDED]` items from Section 8 and adds one new finding.

### 9.1 IDOR / cross-household access control — audited, one gap found

Every one of the 39 API route handlers was checked against the rule in `src/lib/auth.ts`: never trust a `householdId`/`userId`/`role` from the request, always derive it from the session, and verify ownership before reading, writing, or deleting a record.

**38 of 39 are correctly scoped**, including every `PUT`/`DELETE`-by-id handler (`expenses`, `income`, `goals`, `transfers`, `categories`, `map/nodes`, `map/edges`, `statements`, `statements/.../resolve`, `users`, `bugs`, `accounts/[id]/reveal`), every `findMany` list query, and the multi-action `statements/[id]/transactions/[txId]/resolve` route (which separately re-verifies the target expense and custom category on `link_expense`/`confirm`/`categorize`). The one exception is Section 9.2 below.

The five routes with no `requireUser`/`requireHouseholdUser`/`requireAdmin`/`getSessionUser` call are all intentionally public or pre-auth by design: `auth/send-code`, `auth/verify-code`, `auth/logout` (scoped by the session token itself, not by role), `cron/reminders` (see 9.2 answer to open question 3), and `workspace/join` (hard-disabled, returns `410` unconditionally — self-service joining was removed).

### 9.2 New finding: `DatabaseBackup` has no household boundary — Medium/High — FIXED (v1.35.0)

`admin/backup` (`GET`/`PUT`) is the one route that breaks the pattern above, and it's a schema-level gap rather than a missed check in the route itself:

```prisma
model DatabaseBackup {
  id          String   @id @default(cuid())
  createdById String?
  payloadJson Json
  recordCount Int
  notes       String?
  createdAt   DateTime @default(now())
}
```

Unlike every other tenant-scoped model, `DatabaseBackup` has no `householdId` column, so there is nothing for a query to filter on:

- `GET` lists the 20 most recent backups **system-wide**, across every household, to any admin. Each one carries the full `payloadJson` snapshot of that household's expenses (names, amounts, vendors, notes).
- `PUT` (restore) looks a backup up by `id` alone before using its `payloadJson`. The restore *write* is correctly pinned to the caller's own household (`householdId: auth.user.householdId` on every created record, and only that household's expenses are deleted first) — but the *read* of another household's backup is not blocked, so an admin who supplies a `backupId` belonging to a different household can copy that household's expense data into their own.

This answers open question 4 as a side effect: `admin/backup` only ever snapshots the `Expense` table (`prisma.expense.findMany`), never `Account`, so the six encrypted `*Enc` credential fields are never included in a backup. The credential-dump half of the original 3.5 concern does not apply — but the household-boundary gap above is a new, separate issue in the same route.

**Real-world severity was contained even before the fix**: this deployment currently runs as a single household, and triggering either path requires the `ADMIN` (or `BACKUP_ADMIN`) role, not just any member.

**Fix shipped in v1.35.0**: added a nullable `householdId` column to `DatabaseBackup` (nullable so pre-existing rows don't need a backfill — they simply stop being listed/restorable, the safe fail-closed default). `GET` now filters by `auth.user.householdId`, `POST` stamps every new backup with the creator's household, and `PUT` checks `backup.householdId !== auth.user.householdId` before reading `payloadJson`, returning 404 on mismatch exactly like every other by-id route in the app.

### 9.3 Everything else checked, confirmed clean

- **SQL injection**: zero matches for `$queryRaw`, `$executeRaw`, or their `*Unsafe` variants anywhere in the codebase. Every query goes through Prisma's parameterised query builder — there is no string-built SQL to inject into.
- **Encryption** (resolves 3.4): `src/lib/crypto.ts` uses AES-256-GCM with a random 12-byte IV per value and an auth tag for tamper detection, and every encrypted value now carries a `v1:` key-version prefix so rotation can resume safely instead of requiring trial decryption. Fails closed — it throws rather than storing plaintext if `CREDENTIALS_ENCRYPTION_KEY` isn't set.
- **Session cookies**: `httpOnly: true`, `secure` in production, `sameSite: 'lax'`, confirmed in both `middleware.ts` and the cookie-setting code in the auth routes.
- **`getSessionUser()` re-reads on every request** (resolves open question 2): it looks up the `Session` row and its joined `user` fresh on each call — role and household are never trusted from a cached token, so a role change or removal takes effect on the member's very next request.
- **OTP brute force**: `verify-code` caps guesses at `MAX_ATTEMPTS = 5` before invalidating the code.
- **`send-code` rate limiting** (partially resolves 3.2): per-IP throttle (20 requests / 10 minutes) and a 30-second per-email resend cooldown are both in place, plus a generic response message regardless of whether the email exists, to prevent account enumeration. The AI-route quota half of 3.2 (Gemini calls on `assistant/ask`, `assistant/scan-receipt`, `statements/extract`) is still open — no per-household cap exists yet.
- **Cron protection** (resolves open question 3 / Section 3.3): `GET /api/cron/reminders` checks `Authorization: Bearer ${CRON_SECRET}` when the env var is set, and a `SentReminder` row (unique on expense + threshold + day) prevents duplicate sends on repeat invocations. Minor: the header comparison is a plain `!==`, not constant-time — low practical risk given the secret is high-entropy and never exposed client-side, but worth a `crypto.timingSafeEqual` swap if this is tightened further.
- **Upload limits** (partially resolves open question 6): `statements/extract` enforces a 15MB cap on the incoming base64 payload and validates the MIME type is `application/pdf` or `image/*` server-side. Page-count and timeout behaviour on very large statements remains unverified.
- **`BACKUP_ADMIN` and the last-admin guard** (resolves open question 8): the "cannot demote/delete the last admin" check in `users/route.ts` counts only `role: 'ADMIN'` — `BACKUP_ADMIN` accounts don't count towards that minimum, and removing/demoting a `BACKUP_ADMIN` is never blocked. Consistent, but worth stating explicitly since 4.1 already flags the two roles as functionally identical elsewhere.

### 9.4 Dependency audit (`npm audit`) — FIXED (v1.35.0)

5 known advisories (1 moderate, 4 high) as of this review, both transitive:

| Package | Via | Severity | Reachable from user input? |
|---|---|---|---|
| `deepmerge-ts` → `@prisma/config` → `prisma` | Prisma CLI's config-file merging | High (stack exhaustion) | No — build/dev-time only, not loaded by the deployed app |
| `postcss` (bundled inside `next`'s build pipeline) | XSS via unescaped `</style>`, and path traversal via `sourceMappingURL` | High / Moderate | No — processes the app's own CSS at build time, never user-supplied stylesheets at runtime |

Neither was on a path an attacker could reach through the running application — both packages only run during `npm run build` / `prisma generate`, not in any request handler. `npm audit`'s own suggested fix required major-version bumps (`prisma` → 6.12.0, `next` → 16.3.4). Instead, both transitive packages were pinned directly to their patched versions via `overrides` in `package.json` (`deepmerge-ts@^8.0.2`, `postcss@^8.5.28`), which resolves both advisories with no change to `prisma` or `next` and no breaking changes. `npm audit` now reports 0 vulnerabilities.

### 9.5 Bottom line

No finding here needs a paid penetration test to have caught — they're the kind of thing a focused internal review turns up. Both actionable items (9.2 and 9.4) were fixed the same day, in v1.35.0. Everything else is either already resolved, a pre-existing item on the Section 7 build order, or low severity and non-urgent.

## 10. Developer follow-up — 5 September 2026

### 10.1 New finding: recurring-bill rollover silently drifted the renewal date by a day — Medium — FIXED (v1.39.0)

Found incidentally while building and testing the new "recognize a repeat statement charge as one recurring bill" feature (§8) — not part of a security audit, but a real, previously-undiscovered data-integrity bug in `src/lib/billing.ts`, the module every recurring `Expense`'s due-date rollover goes through (`rolloverIfDue`, called from `GET /api/expenses` and `GET /api/insights/summary` on every read).

`parseDateOnly` builds a `Date` from a `YYYY-MM-DD` string's **local** year/month/day components. Its inverse, `formatDateOnly`, did the opposite conversion via `date.toISOString().split('T')[0]` — `toISOString()` always converts to **UTC** first. In any timezone with a positive UTC offset (confirmed against this deployment's actual `Europe/Dublin` server timezone, which is UTC+1 for most of the year), a local midnight timestamp becomes 23:00 the *previous* day in UTC, so every call to `advanceByCycle` silently returned a date one day earlier than intended. A bill that was several cycles overdue compounded this further, since each rollover iteration re-derives the day-of-month from the previous (already-wrong) result — a monthly bill last paid on the 2nd, several months overdue, could drift onto the 27th or later rather than staying pinned to the 2nd.

Confirmed and reproduced directly: `advanceByCycle('2026-06-02', 'monthly')` returned `'2026-07-01'` (should be `'2026-07-02'`), and a 3-cycle rollover from there landed on `'2026-09-27'` instead of the correct `'2026-09-02'`.

**Real-world impact**: this affects `nextRenewalDate` on any recurring `Expense` that has actually rolled over at least once since being created or last edited — i.e. it wouldn't show up on a bill you keep up to date, only ones left unattended across a renewal. Downstream effects would include a wrong due date shown in Bills/Upcoming Renewals, and the 30/14/7-day contract-reminder emails (§3.3) firing on the wrong day for an affected bill.

**Fix shipped in v1.39.0**: `formatDateOnly` now builds the `YYYY-MM-DD` string from the `Date`'s local components directly (matching `parseDateOnly`'s approach), the same way `duplicateKey`/`statementMatching.ts` already handle dates elsewhere in the codebase. Verified with a standalone repro of the exact rollover chain above, now correctly staying pinned to the 2nd of each month.

**Not done**: no attempt was made to retroactively correct already-drifted `nextRenewalDate` values on existing bills — there's no reliable way to reconstruct what a given bill's date *should* be after an unknown number of silent one-day shifts, and guessing at a fix on real financial data without a verifiable anchor point is worse than leaving it visible. Worth an eyeball on any recurring bill whose renewal date looks off by a few days; re-saving it (which recomputes from the edited value) puts it right.

### 10.2 New finding: one un-stripped bank date format silently broke merchant grouping/aliasing — Low/Medium — FIXED (v1.40.0)

Reported directly by the user: renaming one occurrence of a repeat merchant ("Revolut") to a nickname didn't apply to the many other occurrences of the same real merchant in the same statement, even though the "rename merchant" propagation logic (§8) is supposed to update every row sharing the same `normalizedDescription`.

Root cause, confirmed against the real imported data: this bank's export format is `POS13MAY Revolut**794` — a day-of-month + 3-letter month glued directly to `POS` with **no space** (`POS13MAY`, `POS08MAR`, etc). `normalizeDescription`'s prefix-stripping only handled `POS ` (with a space) — `/^POS\s+/i` — so this specific format left the date embedded in the normalized description. Every occurrence of the same merchant therefore got a *different* `normalizedDescription` (`POS13MAY REVOLUT` vs. `POS12MAY REVOLUT` vs. `POS08MAY REVOLUT`, ...), which broke three things at once: grouping (each occurrence became its own singleton, no bulk actions available), the "rename merchant" propagation (matches by exact `normalizedDescription` equality), and the `MerchantAlias.pattern` built from it (`buildAliasPattern` takes the first few tokens, so the date-contaminated pattern was useless for matching a *different* dated occurrence via the substring check in `findAliasMatch`).

**Fix shipped in v1.40.0**: added `/^POS\d{1,2}[A-Z]{3}\s*/i` to `NOISE_PREFIXES` in `statementMatching.ts` to strip this format going forward. Since existing imported rows keep whatever `normalizedDescription` was computed at import time (a code fix alone doesn't retroactively touch stored data), also added `POST /api/statements/[id]/recheck`, which re-normalizes and re-matches every still-`UNMATCHED` row in an import against current data — surfaced in the UI as a "Recheck matches" button. It also carries a same-batch fallback (any other row that now shares the freshly-corrected `normalizedDescription` and already has a nickname donates that nickname directly) and a best-effort repair of any `MerchantAlias.pattern` that was baked from a now-stale `normalizedDescription`, so a future import of the same merchant benefits too. Verified against the real household data: all 8 real Revolut rows previously scattered across 8 different singleton groups now share one `normalizedDescription`, group together, and correctly carry the household's nickname; re-running recheck a second time is a no-op (0 rows changed), confirming it converges rather than oscillating.

**Not done**: no attempt to enumerate every other bank's date-gluing convention up front — this fixes the one format actually seen in this household's real data. The recheck endpoint is the general safety net for the next format that doesn't get handled perfectly on the first try.

### 10.3 New finding: "Restore from JSON" and "Reset all" never touched the real database — High — FIXED (v1.41.0)

Surfaced by a benchmark/gap-analysis pass across the whole app (not a security audit), then verified directly by tracing the code. Settings → Export/Import's **Export** (CSV/JSON download) correctly uses the live, database-backed `expenses` prop — that half always worked. But **Restore from JSON** and its own **Reset sample records** button, plus a second, separate **Reset all expense records** button under Settings' Danger Zone, all ran through `src/services/storage.ts` — a `localStorage`-only layer left over from before the app's move to Postgres. `importExpensesJSON()`/`resetToDefaults()` wrote to `localStorage` and called `onDataUpdated` → `setExpenses` (local React state only); nothing ever reached an API route, so the very next `fetchDatabaseData()` silently overwrote the change. Settings' Danger Zone version even called `fetchDatabaseData()` itself immediately after resetting, undoing its own action within the same click.

**Real-world impact**: a household member using either "restore" or "reset" would see the UI update for a moment and a success message, then have it silently reverted on the next data refresh — with no error, no indication anything was wrong. Someone relying on "Restore from JSON" as an actual disaster-recovery step would believe their data was back when it wasn't.

**Fix shipped in v1.41.0**: removed all three (Restore from JSON, both Reset buttons) rather than patching them — `ExportImportModal` is now Export-only, and its copy points to the real mechanism instead. Expanded the already-correct `admin/backup` route (previously Expense-only, see the `DatabaseBackup` model note in §2) to cover Account, Goal, Expense, Income and Transfer — the same restore now genuinely round-trips through Postgres for the household's core financial data, deleting and recreating all five tables with id remapping so cross-references survive (detailed in §2). The restore confirmation now states the snapshot's age and exact record count before committing, matching the pattern already used for statement-import deletion (§8).

Verified end-to-end against real household data (with the user's explicit go-ahead, since this is destructive by design): captured a checkpoint snapshot (39 records — 11 accounts, 1 test goal, 24 bills, 2 income, 1 test transfer), restored it onto itself, and confirmed every record count matched and every cross-reference (a Goal's linked Account, a Transfer's from/to Account and linked Expense/Income) correctly resolved to the newly-recreated rows despite every id changing. A pre-existing legacy-format backup (bare Expense array) to test the backward-compatibility branch against didn't exist in this household's data — that branch is code-reviewed for parity with the prior single-table logic, not live-tested, since there was nothing to restore it against.

### 10.4 Two invite paths with different behavior, plus doc/reality mismatches — Medium — FIXED (v1.43.0)

Third item off the benchmark-report remediation plan. `AdminSection.tsx`'s "Add household user" called `POST /api/users` (plain `create`, silent, rejects if the email already exists anywhere). `ShareWorkspaceModal.tsx`'s invite called `POST /api/workspace/invite` (upserts by email, sends a real email via Resend when configured). Same intent, two different implementations reachable from two different screens.

**Fix**: repointed `AdminSection.tsx` to call `workspace/invite` too, so both entry points now behave identically; removed the now-unused `POST` handler from `users/route.ts` (confirmed nothing else called it — it now correctly 405s). Added a guard to `workspace/invite`'s upsert: if the email already belongs to a *different* household, reject with 409 instead of silently reassigning that person — low real-world likelihood at today's single-household scale, but a real gap if this ever isn't the only household in the database. Not live-tested (no second household exists in this deployment to reassign from) — verified by code review.

**Also found while investigating**: `Household.inviteCode` is a real, unique, required schema column, but `POST /api/workspace/join` unconditionally returns 410 — self-service joining via that code has been intentionally disabled, and nothing else in the codebase reads the column. Two places (`app/api/workspace/route.ts`, `prisma/seed.ts`) were hardcoding it to the literal string `'tally-family'` on first-household bootstrap instead of letting Prisma's own `@default(cuid())` generate a proper unique value — fixed, both now omit the field. Also removed the dead `inviteCode` field from `ShareWorkspaceModal`'s fetched-but-never-rendered `WorkspaceInfo` type.

Separately, `docs/user-guide.md`, `src/data/helpGuide.ts` (and so the AI assistant and in-app Help guide, which both read from it), `docs/technical-overview.md`, and `README.md` all described a "Create Account" option and/or a "shareable invite link/code" that don't exist — the real flow is admin-invites-by-email only. All four corrected to match reality.

### 10.5 Recommendation implemented: lightweight per-category budgets — SHIPPED (v1.44.0)

Fourth item off the benchmark-report remediation plan. Tally had no way to set a spending ceiling per category — only after-the-fact totals. Added a new `Budget` model (`householdId, category, monthlyLimit, currency`, `@@unique([householdId, category])`, one row per category), a `budgets` CRUD API, and a "Budgets" panel on the Spending → All spending view, following the `CollapsibleSection` pattern used elsewhere in the app.

**Deliberately scoped as an MVP, not a YNAB-style system**: one static monthly limit per category, compared against that category's current *monthly-equivalent* spend — the same run-rate figure Overview/Spending already use everywhere else (e.g. a quarterly bill counted at 1/3 its amount per month), not a running ledger of actual payments made this calendar month. No rollover of underspend, no history/trend over time, no per-member budgets, no forced budgeting of every category — a category with no limit set simply shows no bar.

Verified against real household data: set a €150/month limit on Utilities (real spend €119.95/month), confirmed the progress bar and figure rendered correctly; edited the limit to €200 via the UI and confirmed the change persisted through the API; deleted the budget and confirmed the household's budget list returned to empty. No test data left behind.

### 10.6 Decision recorded, not built: offline PWA / service worker — DEFERRED

Fifth and final item off the benchmark-report remediation plan. The report flagged offline support as something to "decide deliberately," not necessarily to build. Recommendation: **defer**. A service worker with real offline caching (asset precaching, background sync, conflict resolution for offline writes) is ongoing maintenance for a two-person household app that's realistically always on wifi at home, and nothing surfaced in this session's findings — or in day-to-day use — suggests offline access has actually been missed. Revisit only if a real "I needed this offline" moment comes up; until then, no service worker, no manifest caching strategy, no code change.

---

## 11. Production-readiness follow-up — 5 September 2026

Prompted by a direct question: "if this was to be a production app (still just for the two people), what's missed — are we ready to launch?" Rather than trust the original benchmark report's findings at face value (it was written docs-only, with no code access), each finding was re-checked directly against the real implementation first. Several turned out to already be handled correctly and needed no work: vendor-email send already pins the recipient server-side from the stored `Expense.vendorEmail` and only ever sends human-reviewed text (the report's "critical" prompt-injection→exfiltration finding doesn't apply to the real code); encryption key-versioning (`v1:` prefix, resumable rotation) already exists; `cron/reminders` already checks `CRON_SECRET`; "sign out everywhere" already exists and is exposed in Settings, with session cascade-delete on member removal and live (non-stale) role/household reads on every request; `auth/send-code` already rate-limits by IP and by email; `statements/extract` already caps upload size at 15MB.

The confirmed real gaps became a 10-item remediation plan, executed one item per session with the same rigor as every other feature this session (typecheck/lint/build, live verification against real data, docs, version bump, commit, push). Explicitly excluded from the plan, with rationale recorded at the time: a Float→Decimal monetary-type migration (highest blast radius, least practical benefit at this transaction volume), a VIEWER read-only role, transaction splitting, price-creep/missed-payment detection, projected-balance-by-date, a self-service data-erasure route, and a per-household AI quota cap — each a genuine standalone feature idea, not a fix for something broken, and not requested.

### 11.1 Adopted Prisma Migrate, retired `db:push` for schema changes — FIXED (v1.45.0)

**Problem**: every schema change to this point had gone live via `prisma db push`, which resolves purely by diffing against the live database — no history, no rollback path, and capable of silently dropping a column. For an application holding real financial records, schema history should be committed and replayable.

**Fix**: generated a baseline migration (`prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`) capturing the exact current live schema, wrote it to `prisma/migrations/0_init/migration.sql`, and marked it applied against the real database with `prisma migrate resolve --applied 0_init` — a schema-tracking operation only, no SQL executed, no data touched. Added the standard `migration_lock.toml`. Changed `package.json`'s `build` script to `prisma migrate deploy && prisma generate && next build`, so Vercel applies any pending migration automatically on every deploy. Added `npm run db:migrate` (`prisma migrate dev`) as the new local workflow for schema changes going forward; `db:push` is retained only for first-time setup against a fresh database (documented as such in the technical overview and README), never for changes to an existing one.

Verified: `prisma migrate status` reports the baseline applied with no drift against the live database; `prisma migrate deploy` runs cleanly as a no-op against it; a full `npm run build` (now including the `migrate deploy` step) completes successfully end to end.

### 11.2 Automated household backups with retention — FIXED (v1.46.0)

**Problem**: Admin → Database Snapshots genuinely round-trips through Postgres (verified in §10.3), but only ran when an admin remembered to click "Create Snapshot." A backup nobody triggers isn't a real safety net.

**Fix**: extracted the snapshot-creation logic from `admin/backup`'s `POST` handler into a shared `createHouseholdSnapshot()` helper (`src/lib/backup.ts`), added `isAutomatic Boolean` to `DatabaseBackup` (via the new migration workflow from 11.1 — the first real schema change to go through it), and added a new `CRON_SECRET`-protected `GET /api/cron/backup` (same auth pattern as `cron/reminders`) that snapshots every household daily and prunes each household's automatic snapshots down to the most recent 14 — manual snapshots are never touched by the pruning. Added the cron entry to `vercel.json` (3am, distinct from the 8am reminders cron) and a small "Automatic" badge in the Admin snapshot list so the two kinds are visually distinct.

Verified against real data: manually triggered the cron route repeatedly (17 times) against the real household, confirmed each run created a correctly-shaped automatic snapshot (real account/goal/expense/income/transfer data, `isAutomatic: true`, `notes: "Automatic daily snapshot"`) and that pruning correctly capped the household at exactly 14 automatic snapshots after exceeding that count. All 14 test-generated automatic snapshots were deleted afterward via a direct one-off script (no DELETE route exists for individual snapshots yet) so the real household's backup history wasn't left cluttered with test-run noise.

### 11.3 Preserved original amount/currency/rate on receipt-scan conversions — FIXED (v1.47.0)

**Problem**: `ScanReceiptModal.tsx` fetches a live ECB rate and shows the conversion math on screen, but if the user applies it, only the converted `amount`/`currency` (household currency) was saved to the `Expense` — the original foreign amount, the rate used, and the rate date were shown once and then permanently discarded. No way to later see what was actually paid.

**Fix**: added `originalAmount`/`originalCurrency`/`exchangeRate`/`rateDate` (all nullable) to `Expense`, populated by `ScanReceiptModal.tsx` when a conversion is applied (both the "use match" and "use new" paths), carried through unchanged by `ExpenseModal.tsx` on edit (no form control edits them — they're informational only), and persisted by `app/api/expenses/route.ts` on create/update. Displayed as a small "Originally $50.00 USD, converted at 1.0913 on 2026-09-01" caption in both the expense list's expanded row and the edit modal, never included in any total or aggregation.

Verified: created a test expense directly via the API with all four original-currency fields set (simulating what a real conversion produces, since the AI vision extraction itself is unchanged by this fix and didn't need re-testing), confirmed the caption rendered correctly with the right formatted values in both the expense list and the edit modal, then deleted the test record.

### 11.4 Replaced the permanently-static currency table with a live-refreshed cache — FIXED (v1.48.0)

**Problem**: `src/utils/currencies.ts`'s `CURRENCIES` table (used by `convertCurrency()` everywhere — Overview, Budgets, ExpenseList, category charts) held hardcoded, one-time numbers (`GBP: 0.85`, `USD: 1.09`, etc.) that never updated. The technical overview's claim of "live conversion for GBP/USD/CAD/AUD/JPY" was only true for the one-off receipt-scan flow (§11.3) — every ongoing dashboard figure used these frozen numbers, silently drifting further from reality the longer the app ran.

**Fix**: new global (not household-scoped) `ExchangeRate` model caching the current EUR-base rate per currency, and a new `GET /api/exchange-rate-cache` that refreshes from the same Frankfurter/ECB source already used by `exchange-rate` whenever a row is missing or older than 24h — self-healing, no dependency on a cron having run. `src/utils/currencies.ts` gained `updateLiveRates()`, which mutates the existing `CURRENCIES[code].rateAgainstEUR` values in place; since `convertCurrency()` already reads that value at call time rather than at import time, this one mutation (called once per load from `fetchDatabaseData`) made every existing call site live with zero component changes.

Verified against real data: `/api/exchange-rate-cache` returned genuinely live rates diverging meaningfully from the old hardcoded constants (USD +6.6%, CAD +8.4%, JPY +13.5%), and a second call within the 24h window returned identical cached values without refetching. Confirmed end-to-end in the running app: computed the household's real "AI & Tech" monthly category total two ways (using the live USD rate vs. the old hardcoded one) and found the live-rate figure (€83.24) rendered on the actual Overview/Spending page, not the old hardcoded-rate figure (€83.59) — direct proof the fix is live in the real UI, not just returning correct API data.

### 11.5 Statement import balance reconciliation — FIXED (v1.49.0)

**Problem**: `analyzeStatementDocument` already extracts opening balance, closing balance, and statement period from PDF/photo statements — visible once in the import review screen — but `StatementImport` had no columns for them, and the create request never even sent them to the server, so they vanished the moment the modal closed. Those two numbers are the only available proof an import captured every row from the source document; without them, a missing row failed silently.

**Fix**: added `openingBalance`/`closingBalance`/`statementPeriod` (all nullable — CSV imports have no such header to read) to `StatementImport`; `StatementImportModal.tsx` now sends them on create and captures them back from both the fresh-import and reopen-existing-import code paths; the review screen shows a plain reconciliation line — "N rows imported, balance reconciles" or "…, €X unaccounted for" — computed client-side as `closingBalance - openingBalance` against the sum of every logged row's signed amount (DEBIT negative, CREDIT positive) *regardless of status*, since an `IGNORED` or `DUPLICATE` row was still genuinely present in the source document and should still count toward whether the import captured everything.

Verified against real data via three throwaway imports created directly through the API (a real screenshot scan wasn't needed since the AI extraction step itself is untouched by this fix): one with balances that reconcile exactly against its two logged rows (confirmed "balance reconciles" rendered), one with a deliberately mismatched closing balance (confirmed "€64.50 unaccounted for" rendered), and one with no balances at all simulating a CSV import (confirmed neither reconciliation phrase rendered — no forced/broken UI for the path that has nothing to reconcile against). All three test imports deleted afterward.

### 11.6 Small hardening batch: stale-session cleanup + BACKUP_ADMIN documentation — FIXED (v1.50.0)

Two small, independent, low-risk items bundled into one session:

**Stale session cleanup.** `middleware.ts` runs in the Edge runtime and can't reach Prisma to validate a session, so it kept refreshing a cookie's `maxAge` even when the underlying `Session` row was already gone server-side (e.g. removed from the household, or "sign out everywhere" triggered from another device) — the browser would keep looking signed-in until some later action hit a confusing failure. Fixed in `app/page.tsx`'s `fetchDatabaseData`: if the first request (`/api/users`) comes back `401`, the client now clears the cached `tally_user` from `localStorage`, calls `/api/auth/logout`, and drops to the sign-in screen immediately — matching the existing `handleIdleLogout` pattern already used for the 30-minute inactivity timeout.

Verified directly against the real account: captured a real session's token, deleted its `Session` row via a direct script (simulating exactly the scenario above — a cookie that still looks valid client-side, gone server-side), then confirmed the app cleanly dropped to the sign-in screen, cleared its cached user, and stayed stable on a second check (no loop or flicker). Re-authenticated afterward through the real send-code/verify-code flow to restore a valid session for continued work.

**BACKUP_ADMIN documentation.** Confirmed by reading `src/lib/auth.ts`: `requireAdmin()` already treats `BACKUP_ADMIN` as fully equivalent to `ADMIN` — correct behavior for a small household, just previously undocumented, and the minimum-one-admin check only counts `ADMIN` rows (harmless in practice, since a `BACKUP_ADMIN` already has full rights if ever left as the sole admin). No code change — added a plain statement of this to `docs/technical-overview.md` (both copies), `docs/user-guide.md`, and the in-app Help guide, so it's legible instead of discoverable only by reading the source.

### 11.7 Audit log for destructive and identity-affecting actions — SHIPPED (v1.51.0)

**Problem**: `createdById` records attribution at creation only — no record of edits, deletions, role changes, member removal, or backup restores. In a shared ledger with three writeable roles and genuinely destructive bulk operations (backup restore, imports), there was no way to answer "did that really happen, and who did it."

**Fix, deliberately narrow in scope**: a new append-only `AuditLog` model (`householdId, actorId, actorName, action, entityType, entityLabel, createdAt`) — **not** full field-level diffing on every edit, which would be a much bigger lift for comparatively little value in a small household. Logs only: deletion of an Expense/Account/Goal/Transfer/Income, a backup restore, member removal, and role changes. One helper, `logAudit()` (`src/lib/audit.ts`, deliberately fire-and-forget so a logging failure never turns a successful action into an error response), called from each of those seven routes. Surfaced as a plain reverse-chronological list under a new Admin → "Recent activity" tab, most recent 50 entries.

Verified against real data end to end: exercised all seven logged action types (create-then-delete an Expense/Account/Goal/Income/Transfer, invite a throwaway test member and change its role then remove it, and a real snapshot-then-restore cycle) and confirmed each produced a correctly-attributed entry with the right label; confirmed the "Recent activity" panel renders a fresh entry correctly in the actual UI. All test-generated audit entries, records, the throwaway member, and the test snapshot were deleted afterward — nothing left behind in the real household's data or activity log.

### 11.8 Cross-route duplicate guard — SHIPPED (v1.52.0)

**Problem**: the exact-match duplicate guard added earlier (v1.38.0) only catches re-importing the same/overlapping statement. The same real payment could still enter the ledger more than once — a manual expense entry, a receipt scan (which shares the expense-create route), and a statement import creating a `Transfer` — with nothing checking a *fresh* manual/receipt-scan entry against what might already be on record from an earlier statement import or another manual entry.

**Fix, scoped deliberately**: one shared helper, `findPossibleDuplicate()` (`src/lib/duplicateGuard.ts`), checking both the `Expense` and `Transfer` tables regardless of which one is being written to — same account (when known), same amount/currency, within a ±2 day date tolerance. Never a hard block: the record is created either way, with a dismissible "this looks similar to an existing X" banner. Deliberately restricted to the cases where a real duplicate-payment concern actually exists: one-off (`once`-cycle) Expenses only (a recurring bill's amount is *supposed* to recur every cycle — checking those would just be noisy false positives on every ordinary new subscription), and standalone Transfers only (one tied to a recurring Expense/Income via "mark as paid" is expected to repeat the same amount every cycle too). **Deliberately not touched**: the statement-import resolution route already has its own, more sophisticated confidence-scored matching system for its specific direction (statement row → existing bill); adding a second, differently-shaped duplicate signal there risked confusing overlap rather than closing a real gap.

Verified against real data via a throwaway test account: confirmed a standalone Transfer flagged correctly against a matching one-off Expense created moments earlier (same account/amount, 1 day apart); confirmed a genuinely different amount on the same account did *not* flag; confirmed a transfer 10 days outside the tolerance window did *not* flag; confirmed a new recurring (monthly) Expense with a coincidentally identical amount was never even checked; confirmed a "mark as paid"-style linked Transfer was never checked either. All six scenarios behaved exactly as scoped. Test account, expenses, and transfers deleted afterward.
