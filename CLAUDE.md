# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

Playwright E2E test suite for **mallblitz.com**. There is no application code here — only tests, page objects, fixtures, and helpers. The target site runs at `https://mallblitz.com/`.

## Commands

```bash
# Install dependencies
npm ci

# Run all tests (Chromium, depends on auth setup project)
cmd /c npx playwright test

# Run a single spec
cmd /c npx playwright test E2E/tests/ui/Login-flows.spec.ts

# Run tests matching a grep pattern
cmd /c npx playwright test --grep "login"

# List all tests without running them
cmd /c npx playwright test --list

# View HTML report
cmd /c npx playwright show-report

# Lint (zero warnings allowed)
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Type-check
npm run typecheck

# Format with Prettier
npm run format

# Check formatting
npm run format:check
```

**Windows note:** `npx.ps1` may be blocked by PowerShell execution policy. Always prefix Playwright commands with `cmd /c npx ...`.

## Environment Setup

Copy `.env.example` to `.env` and fill in credentials. Required variables:
- `LOGIN_FULLNAME`, `LOGIN_EMAIL`, `LOGIN_PASSWORD` — preset test user
- `ADMIN_LOGIN_EMAIL`, `ADMIN_LOGIN_PASSWORD` — admin user

Auth state is persisted to `playwright/.auth/` via the `setup` project in `playwright.config.ts`. Tests depend on this setup project running first.

## Architecture

### Page Object Model (POM)

All DOM interaction lives in page objects, never in spec files directly.

- **`E2E/pages/BasePage.ts`** — abstract base with `verifyPage()` contract and navigation helpers
- **`E2E/pages/ManagePage.ts`** — central POM registry (lazy-initialized). Injected into tests as `pomManager` via the fixture. Access any page as `pomManager.loginPage`, `pomManager.brandsPage`, etc.
- **`E2E/pages/components/`** — shared public-site UI components (header, footer)
- **`E2E/pages/Admin/Components/`** — shared admin UI components (sidebar, header, data table, filter modal)
- Page objects organized by area: `LoggedIn/`, `FooterPages/`, `Password/`, `Admin/Brands/`, `Admin/Users/`, etc.

### Fixtures

**`E2E/fixtures/pomManager.ts`** exports three test fixtures:
- `test` — base fixture, provides `pomManager` and `mailHelper`
- `userTest` — extends `test` with logged-in user storage state
- `adminTest` — extends `test` with logged-in admin storage state

Always import `test`, `userTest`, or `adminTest` from this file, not from `@playwright/test` directly.

### Factories

`E2E/factories/` contains faker-backed data generators (`brand.factory.ts`, `register.factory.ts`, `conctactUs.factory.ts`). Use these instead of hardcoding test data.

### Helpers

- `env.helper.ts` — typed env var access and validation for auth credentials
- `auth.helper.ts` — auth state file paths and credential lookup by role
- `mail.helper.ts` — email verification helper (uses `APIRequestContext`)

### Test Organization

- `E2E/tests/ui/` — public-facing UI flows (login, signup, profile, footer, articles)
- `E2E/tests/admin/` — admin panel tests (brands CRUD, users datatable, datatables)
- `E2E/tests/Email-flows.spec.ts` — email-dependent flows
- `E2E/auth/auth.setup.ts` — authentication setup (runs before all other tests)

## Key Conventions

- Locators are `private`/`protected` inside page objects; specs call intent-driven methods
- `data-test-id` is the configured test ID attribute (`testIdAttribute` in playwright config)
- Prefer `getByRole`, `getByLabel`, `getByText`, and `getByTestId` over CSS selectors
- Every page object must implement `verifyPage()` from `BasePage`
- Tests must be independent and safe for parallel execution
- No `waitForTimeout` — use Playwright auto-waiting and meaningful UI state checks
- When adding a new page object, register it in `ManagePage.ts` with a lazy getter

## CI

GitHub Actions workflow (`.github/workflows/playwright.yml`) runs lint, typecheck, and Playwright tests on push/PR to main. Secrets are injected as env vars. Report artifacts are uploaded on every run.
