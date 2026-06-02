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

## 2026-05-26, Landing globe pauses only on node hover
**What was decided:** Keep the landing-page globe rotating normally and pause rotation only while `globe.gl` reports that the pointer is directly over a node.
**Why:** Pausing on general pointer entry stopped the globe too aggressively; the intended behavior is motion by default with a stable target only during node hover.
**What was rejected:** Pausing the whole globe whenever the mouse is near the globe and adding a pointer-finger cursor were rejected because they made the interaction feel stuck and visually noisy.

## Session Summary, 2026-05-26
**Worked on:** Supabase Auth login/signup/reset flow, approved magic-link email template, production deployment, and landing globe click usability.
**Completed:** Added real login, signup, reset-password, update-password, auth callback, owner-only Enterprise access, duplicate-email check, and protected-route proxy. Created and approved `docs/supabase-magic-link-email-template.html`, applied it to hosted Supabase confirmation and magic-link templates, and verified the hosted config includes the BlueLineOps subject, `Landing.png`, and `{{ .ConfirmationURL }}`. Deleted the direct OTP test user for `xpertmarxman@gmail.com` so the normal signup flow can create the account with phone, occupation, and password metadata. Pushed production commits through `main`, ending at `fe81726 Pause landing globe only on node hover`.
**In progress:** User should finish real signup testing through `/login?mode=signup` and verify the production landing globe behavior after Vercel finishes deploying `fe81726`.
**Decisions made:** Public users sign up through the app form; Enterprise remains owner-only via `ENTERPRISE_ACCESS_EMAILS`; hosted Supabase Auth email templates use the approved clickable `Landing.png` layout; the landing globe rotates by default and pauses only on direct node hover, with no pointer-finger cursor.
**Next session:** Start by checking `git status`, verifying the latest Vercel deployment for `fe81726`, testing `/login?mode=signup`, and confirming that signup stores email, phone, and occupation in Supabase Auth metadata.

## 2026-05-30, Replace public signup with contact sales
**What was decided:** Change the public-facing signup path into a Contact Sales flow that opens a prefilled email to `xpertmarxman@gmail.com`.
**Why:** BlueLineOps should collect prospect context without creating public app accounts or implying immediate self-serve access.
**What was rejected:** Routing public visitors directly into Supabase signup or Stripe payment was rejected because access should stay controlled until Alexander approves the prospect path.

## 2026-05-30, Contact Sales uses server-side Resend email
**What was decided:** Submit Contact Sales through `/api/contact-sales` and send server-side through Resend to `xpertmarxman@gmail.com`.
**Why:** Browser `mailto:` links can fail when Gmail or Outlook handlers are not configured, so the production path needs a reliable server-side email sender.
**What was rejected:** Relying on client-side `mailto:` was rejected because it produced silent failures for users without a configured mail handler.

## Session Summary, 2026-05-31
**Worked on:** BlueLineOps landing-page positioning, Contact Sales replacement for public signup, and local Resend email validation.
**Completed:** Kept the globe as the main landing-page feature, moved the problem/solution copy into a left sidebar-width panel, routed Request Access, Contact Sales, and globe node clicks to `/login?mode=contact`, removed public login/signup tabs from the Contact Sales view, added `/api/contact-sales`, configured the form to send server-side through Resend, and verified a local test returned `200` with `{"message":"Contact request sent."}`.
**In progress:** The updated landing and Contact Sales work is local and uncommitted in `E:\alex-sysdev-dev\BlueLineOps`; the C: checkout is separate and does not contain this working set.
**Decisions made:** Projects should be saved and worked from the E: drive going forward. BlueLineOps Contact Sales should use server-side email instead of `mailto:`.
**Next session:** Start in `E:\alex-sysdev-dev\BlueLineOps`, verify `git status`, keep the E: checkout as the source of truth, then decide whether to commit/push these local changes or move any remaining C: work into E:.

## 2026-05-31, Contact Sales captures leads in Supabase
**What was decided:** Store Contact Sales submissions in `public.contact_sales_requests` with contact fields, use case, status, source, timestamps, and newsletter opt-in before sending the Resend notification.
**Why:** Email alerts are useful, but BlueLineOps also needs a durable lead list for follow-up, newsletters, and prospect history.
**What was rejected:** Email-only Contact Sales capture was rejected because inbox-only storage is not reliable enough for newsletters or lead management.

## 2026-05-31, Separate Request Access from Contact Sales
**What was decided:** Keep Contact Sales at `/login?mode=contact`, move Request Access to `/request-access`, give it its own form, API route, Supabase table, and Resend email template, and make Contact Sales use case optional.
**Why:** Request Access and Contact Sales are different intents. Access requests need approval context, while Contact Sales should stay focused on sales follow-up and optional operating context.
**What was rejected:** Reusing the Contact Sales form for Request Access was rejected because it makes the product path unclear and mixes prospect intent with access-control workflow.

## 2026-05-31, Request Access confirmation email uses prefilled platform link
**What was decided:** Send a branded Request Access confirmation email to the requester and make its Explore Platform button link to `/login?mode=login` with the requester's name and email in query parameters.
**Why:** The requester should get a polished confirmation and a low-friction return path to the BlueLineOps login page after access review.
**What was rejected:** Sending only the internal Request Access notification was rejected because it leaves the requester without a branded next step.

## 2026-05-31, Request Access options are view-only
**What was decided:** Rename Request Access dropdown options to `View-only demo access`, `View-only executive review`, `View-only operations review`, and `View-only partner review`.
**Why:** Request Access is intended as view-only review access, not edit/admin access or automatic account provisioning.
**What was rejected:** Broader labels such as `Pilot workspace` and `Operations team access` were rejected because they could imply more than view-only access.

## 2026-05-31, View-only role reuses live pages
**What was decided:** Add a `viewer` access role using `VIEW_ONLY_ACCESS_EMAILS`, allow viewer users into existing protected app pages, show view-only UI labels, and disable local move/reassignment controls.
**Why:** Review users should be able to click the live dashboards, tiles, sidebar links, yard, and floor views without changing operational state.
**What was rejected:** Creating separate duplicated review pages was rejected because maintaining two versions of every operational page would create drift and unnecessary work.

## 2026-06-01, Media bundle served from public folder
**What was decided:** Copy the added `BlueLineOps Media` bundle into `public/blue-lineops-media` and link to it from the landing-page CTA panel.
**Why:** Next.js and Vercel only serve static browser files from `public`, so the root-level folder would not be reachable as a public media link.
**What was rejected:** Linking directly to the root-level `BlueLineOps Media` folder was rejected because it would work locally as a file path only, not as a deployed site URL.

## 2026-06-01, Local developer platform bypass
**What was decided:** Add `LOCAL_DEV_PLATFORM_ACCESS=true` as a non-production-only bypass that lets the developer review protected app pages as admin without completing the Supabase magic-link flow.
**Why:** Alexander needs fast local review access while building, and his developer review should not depend on waiting for email auth every time.
**What was rejected:** Removing auth from protected pages or making the bypass work in production was rejected because production access must stay controlled by Supabase session and allowlisted emails.

## 2026-06-02, Associate duplicate names render as generated display names
**What was decided:** Treat repeated associate source names as demo placeholders and generate stable display names from each associate ID for roster, sidebar, and performance panels.
**Why:** The live associate rows can return the same `full_name` for many different associate IDs, which makes different photos appear under one repeated name.
**What was rejected:** Editing the Supabase data directly was rejected because this request only needs the local dashboard display corrected.

## 2026-06-02, Local developer access grants admin on workflow pages
**What was decided:** Make `/outbound/floor` and `/yms/yard` honor `LOCAL_DEV_PLATFORM_ACCESS=true` as an admin role instead of falling back to viewer.
**Why:** The app layout already allowed local developer admin access, but those two workflow pages calculated role separately and kept move controls read-only.
**What was rejected:** Expanding production access was rejected because production should still use Supabase session email allowlists.

## 2026-06-02, Generated floor-plan associate IDs do not open detail pages
**What was decided:** Make demo/generated floor assignments link back to `/associates` and redirect direct `EMP-####` associate URLs to the associates dashboard.
**Why:** The floor plan can create placeholder employee IDs such as `EMP-4100` when no real current-performance associate row is available, and those IDs are not valid detail records.
**What was rejected:** Creating fake detail pages for generated IDs was rejected because the real roster should stay tied to actual associate records.

## 2026-06-02, Media page updated from June press and AI video bundle
**What was decided:** Copy the `press update and video ai june 1` static media bundle into `public/blue-lineops-media`.
**Why:** The deployed media page must use the updated press page, newsroom imagery, and agent workflow video assets from the latest AxiomOpsDocs folder.
**What was rejected:** Linking to the external `AxiomOpsDocs` folder was rejected because Next.js and Vercel only serve the public copy.
