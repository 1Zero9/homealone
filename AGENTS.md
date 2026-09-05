<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Workflow conventions

- Whenever a set of user-facing changes is complete and about to be committed, bump the version in `package.json` and add a matching entry to `src/data/changelog.ts` (`APP_VERSION` + a new `CHANGELOG` entry) describing what changed, before committing.
- If the changes are specific to the mobile PWA experience (mobile-only layout/UX, not visible on desktop), instead (or in addition, if the change spans both) bump `MOBILE_APP_VERSION` and add a matching entry to `MOBILE_CHANGELOG` in `src/data/changelog.ts`. The mobile version/changelog is shown via the version badge in the mobile drawer menu (`Navbar.tsx`) and is tracked independently from the desktop version.
- Modals that contain a data-entry form (typed/selected values only saved via an explicit Save/Add button) must NOT close on backdrop click — use a plain `<div className="modal-overlay">` with no handlers, closing only via the X / Cancel button. Only use the `useOverlayClose` hook (`src/hooks/useOverlayClose.ts`) for read-only viewers or browse/action modals with no unsaved-draft risk. See the doc comment on that hook for the full rationale and the current list of which modals use which pattern.
- After a set of changes is complete (typechecked/linted/built and, where practical, verified against real data), commit and push to `origin/main` automatically without waiting for separate confirmation each time — Vercel builds from `origin/main`, so an unpushed local commit silently leaves the deployed site behind. Still pause before anything destructive/irreversible beyond a normal commit+push (force-push, history rewrite, etc).
- Schema changes go through Prisma Migrate, not `prisma db push`: run `npm run db:migrate` (`prisma migrate dev --name <description>`) locally, which generates a new file under `prisma/migrations/` — commit that file along with the schema change. The build script (`prisma migrate deploy && prisma generate && next build`) applies any pending migrations automatically on every Vercel deploy. `db:push` is a live command against the real production database (no separate local dev database exists for this project) — reserve it for genuine one-off exploratory schema experiments you intend to immediately follow with a real migration, never as the normal path for a schema change you're keeping.
