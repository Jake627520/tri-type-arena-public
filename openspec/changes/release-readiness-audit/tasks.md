# Tasks — Release Readiness Audit (Round 3)

## 1. Traceability & Authoritative Domain
- [x] Unify authoritative domain in `src/domain/` TypeScript definitions
- [x] Generate Requirement -> Test -> Implementation Traceability Matrix
- [x] Verify no unchecked PASS declarations

## 2. Testing Frameworks & New Test Suites
- [ ] Install Vitest, React Testing Library, ESLint, Playwright
- [ ] Add Vitest React component tests (`tests/components/TypingArena.test.tsx`, `tests/components/App.test.tsx`)
- [ ] Add Playwright E2E tests (`tests/e2e/gameplay.spec.ts`)
- [ ] Retain existing 22 passing unit tests without deletion

## 3. License & Transitive Dependency Audit
- [ ] Run automated direct & transitive dependency audit tool
- [ ] Record license, version, source, and redistribution obligations for all packages
- [ ] Verify zero copyleft (GPL/AGPL) and zero unknown licenses

## 4. Git History Secret & Vulnerability Scan
- [ ] Perform full git commit history scan across all revisions
- [ ] Confirm zero committed keys, tokens, or credentials

## 5. CI Workflow & Final Deliverables
- [ ] Create `.github/workflows/ci.yml` with discrete status jobs
- [ ] Generate `docs/RELEASE_READINESS.md`
- [ ] Update `docs/LICENSE_AUDIT.md`, `docs/SECURITY_AUDIT.md`, `docs/TEST_RESULTS.md`
- [ ] Present status as `READY_FOR_OWNER_APPROVAL`
