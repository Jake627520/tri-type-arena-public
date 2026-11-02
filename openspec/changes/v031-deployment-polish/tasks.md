# Tasks: v0.3.1 Deployment Readiness & Repository Polish

- [x] Phase A: Clean up v0.3.0 GitHub Release notes to eliminate duplicated H1 title
- [x] Phase A: Persist versioned release notes in-repo at `docs/releases/v0.3.0.md`
- [x] Phase A: Sync cleaned release notes to GitHub Release v0.3.0 via `gh release edit`
- [x] Phase B: Create branch `feat/v0.3.1-deployment-polish`
- [x] Phase B: Author `docs/GITHUB_ABOUT.md` with description, website, and topics
- [x] Phase B: Author `docs/DEPLOYMENT_PLAN.md` with GitHub Pages vs Vercel comparison and rollout plan
- [x] Phase B: Configure relative base path `base: './'` in `vite.config.ts`
- [x] Phase B: Create deployment workflow draft at `.github/workflows/deploy-pages.yml.draft`
- [x] Phase B: Polish `README.md` with v0.3.0 versioning, How to Run Locally, Typing Modes, No Account Required, and Roadmap
- [x] Phase B: OpenSpec change documentation (`proposal.md`, `spec.md`, `tasks.md`)
- [x] PR Review: Update privacy wording across README.md, DEPLOYMENT_PLAN.md, and GITHUB_ABOUT.md (zh-TW, zh-CN, en; clarify local data, no accounts, hosting access logs)
- [x] PR Review: Add Gitleaks installation and fetch-depth: 0 to `.github/workflows/deploy-pages.yml.draft`
- [x] Verify: Run `npm run check`, `npm test`, `npm audit`, `git diff --check`, `npm run test:e2e`
- [x] Verify: Commit and push changes to `feat/v0.3.1-deployment-polish`
