# AGENTS.md

## Purpose

This repository is a Playwright end-to-end test suite for `mallblitz.com`.
Agents working in this repo should preserve the existing Page Object Model (POM) architecture, keep tests readable, and prefer stable selectors and deterministic flows over clever shortcuts.

## Project Shape

- Playwright config lives in `playwright.config.ts`.
- Tests live in `E2E/tests`.
- Page objects live in `E2E/pages`.
- Shared UI pieces live in `E2E/pages/components` and `E2E/pages/Admin/Components`.
- Shared fixtures live in `E2E/fixtures`.
- Test data factories live in `E2E/factories`.
- Helpers live in `E2E/helpers`.
- Static upload assets live in `E2E/assets`.

## Core Rules For Agents

- Keep the suite in TypeScript and follow the existing file naming style already used in the repo.
- Use Playwright's built-in locators and assertions. Do not introduce Selenium-style patterns.
- Prefer updating or extending existing page objects over placing raw selectors directly in spec files.
- Keep specs focused on behavior and intent. Put DOM details in page objects or components.
- Reuse the shared fixture from `E2E/fixtures/pomManager.ts` unless there is a strong reason not to.
- Do not duplicate page object logic across multiple classes.
- Avoid destructive git commands and never overwrite unrelated user changes.
- Make the smallest change that keeps the suite more maintainable than before.

## POM Architecture Rules

- One page object should represent one page or one meaningful application surface.
- One component object should represent a reusable fragment such as header, footer, sidebar, modal, or table.
- Specs should describe business flows, not locator mechanics.
- Page objects should expose user actions and page-level assertions, not arbitrary internal locators.
- Keep locators `private` or `protected` inside the page object. Expose intent-driven methods instead.
- Prefer methods like `login(email, password)` or `verifyErrorMessage(text)` over exposing fields to tests.
- If a flow spans multiple pages, keep navigation steps in the relevant page or component object rather than building long selector chains in the test.
- If a selector is reused across multiple pages, move it into a shared component or base abstraction only when the reuse is real and stable.
- Do not create inheritance layers unless they remove clear duplication. Favor composition through components first.

## Test Authoring Best Practices

- Write tests with clear Arrange, Act, Assert flow.
- Test names should describe the user-visible outcome.
- Keep each test independent. A test must be able to run alone and in parallel without relying on another test.
- Use `beforeEach` only for repeated setup that improves clarity and does not hide important behavior.
- Use `afterEach` for reliable cleanup when the test creates data that must be removed.
- Avoid testing too many behaviors in a single test.
- When a flow is negative or validation-focused, assert the exact visible outcome.
- Prefer one strong assertion over many weak assertions.

## Locator Best Practices

- Prefer `getByRole`, `getByLabel`, `getByText`, and configured test ids over CSS or XPath.
- Use the most user-facing stable locator available.
- Use `exact: true` only when needed to avoid ambiguous matches.
- Avoid brittle nth-child, deep CSS chains, and text fragments that are likely to change.
- If the application already exposes `data-test-id`, prefer it for unstable UI areas.
- Scope locators to a container when duplicate text exists on the page.

## Assertions And Waiting

- Use Playwright auto-waiting instead of manual sleeps.
- Do not use `waitForTimeout` except as a last-resort debugging aid, and remove it before finishing.
- Wait for meaningful UI states such as visible toast disappearance, navigation completion, or form state changes.
- Keep assertions close to the action they validate.
- When verifying URLs, prefer exact expected paths when the route is stable.

## Data And State Management

- Use faker-backed factories in `E2E/factories` for unique data instead of hardcoded random strings in tests.
- Keep environment-backed credentials and secrets in `.env`, not in test code.
- Reuse `testUserData` only for flows that truly require a preset account.
- When a test creates a new user or other persistent entity, clean it up in the same spec lifecycle when practical.
- Do not make tests depend on preexisting mutable data unless the scenario explicitly requires it.

## Page Object Design Guidelines

- Constructors should only wire locators and dependencies.
- Page object methods should do one meaningful thing each.
- Keep helper methods short and intention-revealing.
- Return created or changed values when that makes downstream assertions clearer.
- Verification methods should assert observable behavior, not implementation details.
- Avoid large "do everything" methods that hide too much flow logic.
- If a page object grows too large, extract a component instead of adding unrelated methods.

## Spec File Guidelines

- Import the shared `test` fixture from `E2E/fixtures/pomManager`.
- Group related scenarios with `test.describe`.
- Keep setup concise and visible.
- Avoid inline test data when a factory or constant already exists.
- Prefer explicit method calls such as `clickLoginButton()` over generic `click()` wrappers in tests.
- When a scenario uses a toast or redirect as a checkpoint, assert it explicitly.

## Maintainability Guidelines

- Follow the existing naming style before introducing a new one.
- Keep comments rare and only where they save reader effort.
- Remove dead code, commented-out experiments, and unused locators when modifying a file.
- If you rename a page method, update all specs that use it in the same change.
- Keep imports tidy and avoid adding dependencies unless they solve a real project need.

## Reliability Guidelines

- Design for parallel execution. Avoid shared mutable state between tests.
- Prefer creating fresh accounts or data for tests that modify profile, settings, or permissions.
- Make cleanup robust enough that a failed assertion does not leave excessive residue.
- When a test is flaky because of timing, fix the synchronization point instead of adding sleeps.
- If a selector is flaky, improve its semantic anchor before retrying the action.

## Commands

- List tests: `cmd /c npx playwright test --list`
- Run all tests: `cmd /c npx playwright test`
- Run one spec: `cmd /c npx playwright test E2E/tests/ui/Profile-flows.spec.ts`
- Show report: `cmd /c npx playwright show-report`

## PowerShell Note

- In this environment, `npx.ps1` may be blocked by PowerShell execution policy.
- When that happens, run Playwright commands through `cmd /c npx ...`.

## When Agents Make Changes

- Prefer extending existing page objects and fixtures over creating parallel patterns.
- Verify the smallest relevant scope after changes, such as a single spec or `--list` for discovery.
- Call out any assumptions, especially around environment variables, test accounts, or external email flows.
- If a change touches shared abstractions such as `ManagePage`, `BasePage`, fixtures, or shared components, review downstream impact before finishing.
