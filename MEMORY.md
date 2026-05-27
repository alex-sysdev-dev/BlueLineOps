## 2026-05-18, Restore repo root after reclone
**What was decided:** Keep the BlueLineOps project root at `D:\Projects\BlueLineOps` and move the accidentally nested cloned repo contents up from `D:\Projects\BlueLineOps\BlueLineOps`.
**Why:** Alexander created `D:\Projects\BlueLineOps` as the intended repo landing folder, and Next.js needs `package.json`, `.git`, and `.env.local` in the same project root for local development.
**What was rejected:** Leaving the repo nested one level deeper was rejected because it would require running commands from the wrong folder and would leave the existing `.env.local` outside the Next.js load path.

## 2026-05-18, Add safe environment template
**What was decided:** Add `.env.example` with placeholder keys for Supabase and the OpenAI agent, and allow that file through `.gitignore`.
**Why:** The fresh clone had no environment-variable template, while the app requires Supabase browser keys and a server-side OpenAI key for the agent route.
**What was rejected:** Committing or printing `.env.local` secrets was rejected because local and Vercel secrets must stay private.

## 2026-05-20, Health check fallback uses live repo gates
**What was decided:** Run the health check against the scripts and files that actually exist in the checkout, extend timeouts for `tsc` and `next build`, and use the compiled `app/api/health` artifact for route smoke verification.
**Why:** The named automation workflow, health-check script, seed script, smoke tests, and database tests are all missing from this repo, while `tsc` and `next build` do complete if given enough time and direct local HTTP smoke is blocked in this automation environment.
**What was rejected:** Reporting the missing contract files as if the full automation passed was rejected because it would hide the real repo state.

## 2026-05-21, Health check uses direct node CLI entrypoints
**What was decided:** Run health-check gates with direct `node` invocations for `typescript`, `next`, and `eslint`, and scope lint to `app components lib types` instead of the bare `npm.cmd run lint` script.
**Why:** In this checkout, `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npx.cmd next build` all timed out under automation, while `node .\node_modules\typescript\bin\tsc --noEmit --pretty false`, `node .\node_modules\next\dist\bin\next build`, and `node .\node_modules\eslint\bin\eslint.js app components lib types --max-warnings=0` completed successfully.
**What was rejected:** Treating the wrapper-command timeouts as code failures was rejected because the direct CLI entrypoints proved the TypeScript, build, and scoped lint surfaces pass.

## Session Summary, 2026-05-22
**Worked on:** Getting BlueLineOps ready for Vercel after Supabase and Vercel billing were restored.
**Completed:** Confirmed the repo root is `D:\Projects\BlueLineOps`, confirmed `.env.local` uses hosted Supabase keys, identified the exact Vercel env var names the app reads, staged `.env.example` and `.gitignore` for a deployment-safe commit, and confirmed the OpenAI key was rotated after exposure.
**In progress:** Vercel redeploy is the active next step. The Vercel CLI path was unreliable from the automation shell, so use the Vercel dashboard or GitHub auto-deploy.
**Decisions made:** Use hosted Supabase for this app, not `supabase start`; Vercel must include `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `OPENAI_AGENT_MODEL`; do not rely on `SUPABASE_URL` or `SUPABASE_ANON_KEY` alone because the current app code does not read those names.
**Next session:** Verify the Vercel production deployment, test `/api/health`, then test Supabase-backed pages and the OpenAI agent route. If deployment has not triggered, commit and push the already staged `.env.example` and `.gitignore` changes from `D:\Projects\BlueLineOps`.

## 2026-05-23, MCP route uses request origin
**What was decided:** Change `app/api/agent/mcp/route.ts` so MCP tool calls derive their base URL from the incoming request instead of hardcoding `https://bluelineopsok.vercel.app`.
**Why:** Supabase branches, Vercel preview deployments, and localhost need MCP calls to stay inside the current environment instead of routing back to production.
**What was rejected:** Keeping the production URL was rejected because it makes branch validation misleading and can hide preview-specific Supabase or deployment issues.

## 2026-05-23, Public Supabase views use security invoker
**What was decided:** Add a Supabase migration that sets public operational views to `security_invoker = true`.
**Why:** Supabase flags public security definer views because they can bypass the invoking role and row-level security; the app's exposed operational views should respect caller permissions.
**What was rejected:** Leaving the views with default security definer behavior was rejected because it keeps the Security Definer View advisor finding active.

## 2026-05-23, Remove empty Supabase pull migration
**What was decided:** Delete the empty `supabase/migrations/20260523011235_remote_schema.sql` file before pushing the security-invoker migration.
**Why:** The file was 0 bytes but still appeared as a pending remote migration, which made the Supabase push broader than the requested security fix.
**What was rejected:** Pushing both pending migration history entries was rejected because only the security-invoker view fix should be applied.

## 2026-05-23, Vercel preview build avoids Supabase prerender
**What was decided:** Make the Supabase client lazy and force live operational pages to dynamic rendering.
**Why:** Vercel preview builds can fail during static prerender when Supabase preview environment variables are missing or branch-scoped differently, while local builds pass because `.env.local` exists.
**What was rejected:** Keeping database-backed operations pages static was rejected because it risks stale KPI data and makes preview deployments fragile.

## 2026-05-24, Restore deleted checkout from remote branch
**What was decided:** Recreate the missing checkout at `C:\alex-sysdev-dev\BlueLineOps` from `origin/working-bluelineops-updates`.
**Why:** The supplied working directory and the prior `D:\Projects\BlueLineOps` checkout were both missing locally, while the remote working branch still existed on GitHub.
**What was rejected:** Rebuilding from another branch or moving the checkout into OneDrive/Documents was rejected because Alexander asked to fix the deleted files from the open remote branch.

## 2026-05-25, Restore F drive local env placeholder
**What was decided:** Create `F:\alex-sysdev-dev\BlueLineOps\.env.local` from `.env.example` without adding secrets.
**Why:** The F drive checkout was missing `.env.local`, and no C: or D: checkout contained BlueLineOps secrets to copy. The app still needs real Supabase and OpenAI values before local runtime is fully configured.
**What was rejected:** Inventing keys, copying ChatterBot secrets, or overwriting an existing env file was rejected because those would create invalid or cross-project configuration.

## 2026-05-25, Grant review proposal branch uses live data plus local interactive demos
**What was decided:** Prepare the `Proposal` branch with production-readiness UI cleanup, interactive Associates, Pick/Pack, and YMS workflows, while keeping Supabase reads intact and using local client state for demo move actions.
**Why:** Grant reviewers need credible operator workflows without risking database schema changes or writing demo move events into production data before Alexander approves that direction.
**What was rejected:** Renaming database tables, adding write-side Supabase mutations, or redesigning the whole app was rejected because the task requires scoped grant-review polish without breaking existing working routes.

## 2026-05-25, Associate PNG photos map by roster order
**What was decided:** Use the `public/associates/Employee 1.png` through `Employee 140.png` files as associate thumbnails by deterministic roster order.
**Why:** The photos are available in the repo, but there is no employee-to-photo mapping file yet. Deterministic assignment makes the grant-review UI look complete without inferring sensitive traits from images.
**What was rejected:** Matching photos to associates by perceived gender was rejected because gender should not be inferred from appearance.

## 2026-05-26, Server-side operational reads use service role key
**What was decided:** Add a server-only Supabase client backed by `SUPABASE_SERVICE_ROLE_KEY` and use it for server-rendered operational query modules that power YMS, Pick/Pack, inbound, QA, layouts, operations, and associates.
**Why:** The browser anon key returned zero rows for the operational and layout tables, while the service role key could read the live Supabase data needed for `/yms/yard` and `/outbound/floor`.
**What was rejected:** Changing RLS policies or writing mover state to Supabase was rejected because this restore only needs live read access and page-session mover behavior.

## 2026-05-26, Session — Globe landing, suppliers, DB seeding, production deploy
**Completed:**
- Replaced static PNG landing page with `globe.gl` interactive WebGL globe (earth-night texture, ~500 city-light nodes on real coordinates, auto-rotate, click node → `/login`). See `components/landing/GlobeScene.tsx`, `LandingHero.tsx`, `LandingHero.module.css`.
- Created `/login` page (`app/login/page.tsx`) — dark enterprise style, routes to `/dashboard` on submit.
- Built Suppliers feature: `types/suppliers.ts`, `lib/queries/suppliers.ts`, `app/(app)/suppliers/page.tsx`, Sidebar link added.
- Seeded all live KPI driver tables (labor_time_entries, safety_incidents, dock_events, orders with CPT risk). Fixed dock type mismatch (DOCK-* spots now typed inbound/outbound). Fixed avg_order_age_hours, pending_pick_orders count.
- Created `pg_cron` job `simulate-order-flow` running `simulate_order_flow(6,6,6,8)` every 10 min to cycle orders.
- Pushed to `main`, deployed to Vercel production (`dpl_45gUb1NwJrX1JC87M9WMgkftQa6n`, state: READY).
**Active working directory:** `F:\alex-sysdev-dev\BlueLineOps` (F drive, not C or D).
**Branch pattern:** work on `Proposal`, merge to `main`, push → Vercel auto-deploys.

## 2026-05-26, Executive dashboard reads use server Supabase client
**What was decided:** Move executive KPI, history, forecast, and CPT risk reads to the server-only Supabase client and keep dashboard copy as `CPT Risk` and `Live`.
**Why:** The executive dashboard is server-rendered operational data and should use the same service-role read path as the restored YMS and Pick/Pack pages; the current dashboard request also requires removing `CPT Exposure` and `Live Flow` copy.
**What was rejected:** Changing RLS policies or exposing the service role key to client components was rejected because server-only reads solve the page data path without weakening browser access.

## 2026-05-26, Supabase magic-link auth uses owner-only enterprise gate
**What was decided:** Add Supabase magic-link signup/login with a public signup mode and a server-side `ENTERPRISE_ACCESS_EMAILS` allowlist for protected BlueLineOps app routes.
**Why:** Users need to be able to sign up, but the Enterprise Login path should only work for Alexander or explicitly allowlisted owner emails.
**What was rejected:** Hardcoding owner email in client code or relying on client-only checks was rejected because enterprise access must be enforced before protected routes render.

## 2026-05-26, Globe nodes use population-weighted light clusters
**What was decided:** Replace the fixed tier globe markers with deterministic population and density weighted light clusters, hub rings, and route arcs in `components/landing/GlobeScene.tsx`.
**Why:** The landing globe needs to look more like a dense global operations network, with small city-light nodes clustered around real high-population metros instead of sparse equal-weight markers.
**What was rejected:** Random marker placement was rejected because it changes on every load and does not visually communicate actual population density.

## 2026-05-26, Supabase magic-link email template is review-only first
**What was decided:** Create `docs/supabase-magic-link-email-template.html` as a review-only Supabase Auth email template with the deployed `Landing.png` image wrapped by `{{ .ConfirmationURL }}`.
**Why:** Alexander needs to inspect and approve the email content before it is copied into Supabase Auth templates.
**What was rejected:** Wiring the template directly into Supabase before approval was rejected because the email copy and visual treatment still need owner review.

## 2026-05-26, Approved BlueLineOps Supabase Auth template applied
**What was decided:** Apply the approved BlueLineOps email HTML to the hosted Supabase Auth confirmation and magic-link templates through the Supabase Management API.
**Why:** Alexander approved the reviewed template and needs production Auth emails to use the branded clickable `Landing.png` magic-link treatment.
**What was rejected:** Using the local service role key for Management API changes was rejected because Supabase requires a personal access token for hosted project Auth config updates.

## 2026-05-26, Remove direct magic-link test user before real signup
**What was decided:** Delete the Supabase Auth user record for `xpertmarxman@gmail.com` that was created by the direct OTP/magic-link test.
**Why:** The direct test proved the hosted email template worked, but it bypassed the app signup form and caused the real signup flow to report the email as an existing account.
**What was rejected:** Removing the email from `ENTERPRISE_ACCESS_EMAILS` was rejected because the signup blocker came from `auth.users`, not the owner allowlist.

## 2026-05-26, Landing globe pauses during pointer interaction
**What was decided:** Pause the landing-page globe rotation when the pointer enters or moves over the globe, show a pointer cursor on nodes, and resume rotation shortly after pointer leave.
**Why:** The spinning globe made node clicks difficult and sometimes felt like it required two clicks; pausing during pointer interaction makes node selection practical without changing the landing-page layout.
**What was rejected:** Replacing the node interaction or making unrelated landing-page design changes was rejected because the requested fix was limited to click usability.
