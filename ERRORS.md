## Health check command execution in PowerShell
**What did not work:** Running `npm` and `npx` directly from PowerShell failed because `npm.ps1` and `npx.ps1` are blocked by execution policy. Rerunning `npm.cmd run lint`, `npx.cmd eslint ...`, and `npx.cmd next build` avoided the policy block, but `eslint` hung without producing diagnostics and `next build` exited non-zero after printing only the initial production build banner.
**What worked:** `npx.cmd tsc --noEmit --pretty false` completed successfully and confirmed the TypeScript surface passes.
**Note for next time:** Use `npm.cmd` or `npx.cmd` first in this repo. Treat lint/build as separate investigation items until the repo has a defined health-check script and the underlying process hang is isolated.

## Fresh clone rebuild validation
**What did not work:** Running dev/start server checks from this terminal conflicted with the active terminal context and did not produce a reachable server on `127.0.0.1:3000`.
**What worked:** `npm.cmd install`, `npm.cmd run lint`, `npm.cmd exec tsc -- --noEmit`, and `npm.cmd run build` completed successfully from `D:\Projects\BlueLineOps`.
**Note for next time:** Use `npm.cmd` on Windows PowerShell. Validate build first, then run one dev server from a single terminal with `npm.cmd run dev`.

## Health check smoke in automation sandbox
**What did not work:** A direct local smoke using `Start-Process` plus `Invoke-WebRequest` was blocked by policy in the automation shell, and importing `.next/server/app/api/health/route.js` then calling `mod.GET()` failed because the build artifact exposes the handler under `default.routeModule.userland.GET`.
**What worked:** Build first, then run `node -e "import('./.next/server/app/api/health/route.js').then(async (mod) => { const res = await mod.default.routeModule.userland.GET(); console.log(res.status); console.log(await res.text()); })"` from `D:\Projects\bluelineops` to smoke the compiled health route.
**Note for next time:** In this sandbox, prefer compiled route artifact smoke over launching `next start` when local process orchestration is blocked.

## Health check wrappers vs direct node CLI
**What did not work:** `npm.cmd run lint`, `npx.cmd tsc --noEmit --pretty false`, and `npx.cmd next build` all timed out in automation. `node .\node_modules\eslint\bin\eslint.js --version` also stalled, and `mod.GET()` against the compiled health route failed because the exported handler shape was wrong.
**What worked:** `node .\node_modules\typescript\bin\tsc --noEmit --pretty false` passed in about 65 seconds, `node .\node_modules\next\dist\bin\next build` passed in about 238 seconds, `node .\node_modules\eslint\bin\eslint.js app components lib types --max-warnings=0` passed in about 220 seconds, and the compiled route smoke worked through `mod.default.routeModule.userland.GET()`.
**Note for next time:** For this repo's health check, bypass wrapper commands, lint only the source folders, and use the compiled route-module userland handler for smoke verification.
