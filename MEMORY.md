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
