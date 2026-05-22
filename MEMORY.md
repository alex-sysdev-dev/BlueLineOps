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
