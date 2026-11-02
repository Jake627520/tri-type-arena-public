# Contributing to TriType Arena

Thank you for your interest in contributing to TriType Arena (中英打字競技場)!

## Code of Conduct

All contributors must adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Development Philosophy

- **SDD (Specification-Driven Development)**: All substantive changes must begin with an OpenSpec proposal and spec update under `openspec/`.
- **TDD (Test-Driven Development)**: Follow the RED → GREEN → REFACTOR cycle. Add or update tests before declaring features complete.
- **Strict Licensing & Intellectual Property**:
  - Do NOT copy code, assets, audio, or copyrighted wordlists from proprietary or copyleft (GPL/AGPL) projects (such as Monkeytype, TypeRacer, Nitro Type, or ZType).
  - Prompt passages and word lists must be independently authored or come from a source whose license permits the proposed use and redistribution. Document the exact source, version, license, attribution and modifications; share-alike data requires separate consideration and must not be represented as MIT-licensed.
  - No secret tokens, API keys, or private user data may be committed.

## Pull Request Guidelines

1. Fork and branch from `main`.
2. Ensure all quality gates pass:
   - Typecheck (`npm run typecheck`)
   - Linting (`npm run lint`)
   - Unit & integration tests (`npm run test`)
   - Browser E2E tests (`npm run test:e2e`)
   - License audit check (`npm run audit:licenses`)
3. Write clear, traceable commit messages adhering to Conventional Commits:
   - `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
4. Update relevant documentation and OpenSpec tracking documents.
