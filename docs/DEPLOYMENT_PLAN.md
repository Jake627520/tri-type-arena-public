# TriType Arena — Deployment Plan

**Document Version:** 1.0  
**Application Version:** v0.3.0  
**Target Release:** v0.3.1 Deployment Readiness  
**Repository:** Jake627520/tri-type-arena  
**Owner Approval:** Required  
**Deployment Status:** Not Started

---

## 1. Executive Summary

TriType Arena is an offline-first React and TypeScript typing practice game built with Vite.

The application currently runs locally and does not require a backend server, user authentication, or database.

The deployment objective is to make the application accessible through a browser-hosted HTTPS website while maintaining source-code security, test quality, and owner-controlled release approval.

**Recommended initial platform: Vercel.**

GitHub Pages remains a supported alternative, subject to repository visibility, GitHub plan availability, and approval to make the website publicly accessible.

No production deployment should occur automatically without explicit owner approval.

## 2. Deployment Goals

1. Host the existing Vite application as a static website.
2. Preserve all three typing modes.
3. Preserve Traditional Chinese, Simplified Chinese, and English interfaces.
4. Support desktop and mobile browser access.
5. Avoid introducing an unnecessary backend.
6. Preserve the existing 120-test release baseline.
7. Maintain MIT compliance and security checks.
8. Keep the GitHub repository Private unless the owner approves a change.
9. Separate deployment approval from repository visibility approval.

## 3. Platform Comparison

| Criteria | GitHub Pages | Vercel |
|---|---|---|
| Static Vite App | Supported | Supported |
| GitHub Integration | Native GitHub Actions | Native Git Integration |
| Private GitHub Source | Plan-dependent | Supported subject to account/team rules |
| HTTPS | Supported | Supported |
| Custom Domain | Supported | Supported |
| Preview Deployments | Requires additional workflow design | Built-in workflow |
| Vite Build Configuration | Requires build/deploy setup | Generally auto-detected |
| Repository Path Base | Must configure for project subpath | Usually `/` |
| Private Website Access | Not automatically guaranteed | Deployment Protection, plan-dependent |
| Recommended Use | Public open-source static site | Initial controlled development and deployment |

### GitHub Pages Considerations

GitHub Free generally requires a public repository for GitHub Pages. Private repository Pages support depends on the GitHub plan.

GitHub Pages websites may be publicly accessible even when their source repositories are private.

For a project site such as:

`https://Jake627520.github.io/tri-type-arena/`

Vite generally requires:

```ts
base: '/tri-type-arena/'
```

### Vercel Considerations

Vercel can host the Vite production output using:

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

Private GitHub repository deployment depends on Git ownership and Vercel account/team permissions.

On Vercel Hobby, standard deployment protection does not make the production domain private. If production access must remain restricted, confirm an appropriate protection mechanism and plan before deployment.

## 4. Recommended Architecture

```text
Developer / Antigravity
        |
        v
Feature Branch
        |
        v
Pull Request
        |
        v
GitHub Actions Quality Gates
        |
        v
Owner Review & Merge
        |
        v
main (Private GitHub Repository)
        |
        v
Approved Vercel Deployment
        |
        v
Static Production Site (HTTPS)
        |
        v
User Browser
        |
        +-- React / TypeScript UI
        +-- English Typing
        +-- Hanyu Pinyin
        +-- Zhuyin Daqian
        +-- Local Browser Preferences
```

Application architecture remains frontend-only for this version.

There is no backend database, API service, session authentication server, or cloud synchronization component.

## 5. Environment Strategy

### Local Development

- Environment: Local Mac development environment
- Command: `npm run dev`
- Purpose: Implementation and debugging
- Accessibility: Local only, unless explicitly configured otherwise

### Local Production Validation

- Command: `npm run build`
- Command: `npm run preview`
- Purpose: Validate compiled production artifacts
- Accessibility: Local

### Preview Deployment

- Platform: Vercel
- Source: Feature branch or Pull Request
- Purpose: Owner acceptance testing
- Protection: Prefer authenticated, restricted preview access
- Production traffic: None

### Production Deployment

- Platform: Vercel
- Source: Approved `main` branch or release commit
- Build output: `dist`
- HTTPS: Required
- Public access: Requires explicit owner approval

Production deployment and repository publication are separate decisions.

## 6. Build Configuration

Current project:

- React 18
- TypeScript Strict
- Vite 6
- Node.js 22 recommended for CI/deployment consistency
- npm with package-lock.json

Recommended commands:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run test:vitest
npm run test:e2e
npm audit
npm run audit:licenses
npm run audit:security
npm run build
```

Vercel configuration:

| Setting | Value |
|---|---|
| Framework | Vite |
| Root Directory | `./` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | Compatible Node 22 runtime |
| Environment Variables | None required for current app |

Do not introduce secret environment variables unless a future feature explicitly requires them.

No Vercel configuration file is required unless repository inspection identifies a specific routing or build requirement.

## 7. CI/CD Quality Gates

Deployment should be conditional on successful verification.

Required checks:

- TypeScript strict typecheck
- ESLint
- Node tests
- Vitest / React Testing Library
- Playwright Chromium E2E
- SPDX dependency license audit
- npm vulnerability audit
- Gitleaks secret scanning
- Vite production build

For v0.3.1, add deployment smoke tests:

1. The website returns HTTP 200.
2. JavaScript and CSS assets load.
3. The application renders successfully.
4. English UI loads.
5. Simplified Chinese UI loads.
6. Traditional Chinese UI loads.
7. First-time onboarding opens.
8. The onboarding guide can be dismissed.
9. Typing can start without an account.
10. No browser console errors are detected.

A successful CI workflow must not be treated as permission to make the website publicly accessible.

## 8. Release and Deployment Workflow

### Phase A — Prepare

- Confirm clean working tree.
- Confirm correct repository and branch.
- Verify GitHub `main` release baseline.
- Confirm v0.3.0 release exists.
- Create `feat/v0.3.1-deployment-polish`.
- Prepare OpenSpec specification.

### Phase B — Configure

- Add deployment documentation.
- Confirm Vite build output.
- Review asset paths.
- Review offline-first behavior.
- Configure preview deployment if allowed.
- Do not expose secrets in client-side JavaScript.

### Phase C — Verify

- Run existing automated tests.
- Run production build.
- Validate generated assets.
- Perform preview browser tests.
- Test desktop and mobile layouts.
- Perform the three-language acceptance matrix.

### Phase D — Owner Approval

Owner reviews:

- Preview URL
- UI correctness
- Security scan results
- Deployment configuration
- Visibility and access requirements
- Known limitations

The deployment must remain pending until explicit approval.

### Phase E — Release

After approval:

- Deploy the approved commit.
- Record the deployed Commit SHA.
- Record the deployment URL.
- Perform production smoke tests.
- Update documentation.
- Add the verified URL to GitHub About.

## 9. Security and Privacy

### Repository Visibility

The GitHub repository remains Private by default.

Changing deployment configuration does not authorize changing repository visibility.

### Website Access

A private Git repository does not guarantee a private production website.

Verify site accessibility from a logged-out or incognito browser before publishing or sharing the URL.

### Browser Data and Privacy Policy

TriType Arena follows a strict local-first privacy architecture:

1. **Game Data Stays Local (遊戲資料不主動上傳)**: User preferences, typing session metrics, and progress are processed and retained exclusively within the browser (`localStorage`). The frontend application does not actively transmit or upload gameplay data to external servers.
2. **No Accounts or Cloud Sync (無帳號及雲端同步功能)**: The application requires no sign-up, login, or user profiles. There are no backend database services or cloud synchronization mechanisms.
3. **Hosting Infrastructure Access Logs (部署主機必要存取日誌)**: While client-side game logic performs no external data reporting, static asset hosting platforms and edge CDNs (such as Vercel or GitHub Pages) inherently record standard HTTP web server access logs (including visitor IP addresses, access timestamps, and request headers) for content delivery, traffic management, and infrastructure security defense.
4. **No Third-Party Analytics (零第三方追蹤與廣告)**: No third-party tracking scripts, advertising beacons, or telemetry SDKs are embedded in the client bundle. Users can purge all local records at any time by clearing browser site data.

### Secret Management

Never commit:

- API keys
- Access tokens
- Credentials
- Private keys
- Production environment files

All environment variables exposed through Vite's `VITE_` prefix must be treated as public client-side data.

### Dependencies

Dependency updates require automated regression validation.

Any known Critical or High vulnerability must be investigated before deployment approval.

## 10. Rollback Plan

If a deployment introduces regressions:

1. Stop additional promotion of changes.
2. Identify the last verified successful deployment.
3. Reassign or restore the production deployment to that known-good version using Vercel's supported rollback mechanism.
4. Confirm the restored website passes smoke tests.
5. Open a bug report.
6. Correct the problem on a feature branch.
7. Re-run quality gates before redeploying.

Never force-push or rewrite Git history as a routine deployment rollback.

Record every rollback with its original and restored Commit SHA.

## 11. Definition of Done

Deployment readiness is achieved when:

- [ ] Build configuration reviewed
- [ ] Deployment protection and visibility confirmed
- [ ] CI fully passing
- [ ] License audit passing
- [ ] Security audit passing
- [ ] Desktop acceptance completed
- [ ] Mobile acceptance completed
- [ ] All three UI languages verified
- [ ] All three typing modes verified
- [ ] First-time onboarding verified
- [ ] Preview URL reviewed by owner
- [ ] Owner explicitly approves deployment
- [ ] Deployment smoke tests passing
- [ ] Verified Website URL added to GitHub About

Until the owner approves and the required deployment steps are complete, the status remains **NOT DEPLOYED**.

## 12. Recommendation

Proceed with Vercel as the preferred initial deployment platform because of its straightforward Vite integration and preview deployment workflow.

Keep GitHub Pages as a future option, especially if TriType Arena becomes a fully public open-source project.

Do not add user authentication, backend infrastructure, or a database solely for deployment.

The next development milestone is **v0.3.1 — Deployment Readiness & Documentation Polish**.

---

**Decision Status:** Recommended, not yet approved  
**Repository Visibility:** Private  
**Production Deployment:** Requires owner approval
