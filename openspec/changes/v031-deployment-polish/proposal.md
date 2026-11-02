# Proposal: v0.3.1 Deployment Readiness & Repository Polish

## Problem Statement
Following the successful v0.3.0 release (Tri-language UI & Onboarding), the repository lacks:
1. Public repository metadata guidelines (About description, website URL, topic tags) for GitHub discovery.
2. A formalized, documented deployment architecture comparing hosting options (GitHub Pages vs Vercel).
3. Polished `README.md` documentation reflecting v0.3.0 capabilities, local run instructions, typing modes, zero-account guarantees, and the future roadmap.
4. Production deployment scaffolding (Vite relative base path and manual GitHub Pages deployment workflow draft).

## Proposed Solution
- Create `docs/GITHUB_ABOUT.md` with concise repository description, recommended Pages URL, and topics.
- Create `docs/DEPLOYMENT_PLAN.md` with trade-off analysis between Vercel and GitHub Pages, recommending Vercel as the preferred initial deployment platform while maintaining GitHub Pages as a supported alternative.
- Polish `README.md` with structured sections: version badge (v0.3.0), How to Run Locally, Typing Modes breakdown, No Account Required privacy guarantee, and Current Status / Roadmap.
- Configure `vite.config.ts` with `base: './'` for universal root and subpath CDN hosting.
- Provide `.github/workflows/deploy-pages.yml.draft` for owner-controlled rollout.

## Invariants & Guardrails
- 100% offline-first execution; zero remote databases; zero analytics trackers.
- Permissive MIT license integrity preserved across all documentation and configurations.
- All quality gates (typecheck, lint, 60 node tests, 49 vitest tests, 11 e2e tests, license audit, security audit) must remain 100% passing.
- Deployment remains in draft / staged mode; no automated production rollout without explicit repository owner approval.
