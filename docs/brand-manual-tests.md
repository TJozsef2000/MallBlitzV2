# Brands Manual E2E Tests

## Scope
This document defines manual end-to-end test cases for the admin-panel Brands feature across:

- Laravel API endpoints under `/api/ecommerce/brands`
- Nuxt admin pages under `/admin/brands`
- Frontend/backend integration
- Validation, async, permissions, race conditions, and regression risks

These cases are written to be easy to convert into Playwright later.

## Global Success Assertions
Apply these checks to every successful create, update, or delete case unless the case says otherwise.

- The expected network request is sent once.
- The HTTP status is correct: `201` for create, `200` for update/delete/read.
- The API response body contains `success: true`.
- The UI shows the correct success toast.
- The user lands on the expected page.
- A hard refresh preserves the new state.
- The list page, detail page, and any dependent UI show the same persisted data.

## Global Failure Assertions
Apply these checks to every failed mutation unless the case says otherwise.

- The API response uses the expected status code such as `401`, `403`, `404`, `422`, or `500`.
- The UI does not falsely show a success toast.
- The user is not redirected as if the action succeeded.
- No unintended data is created, modified, or deleted.
- Validation errors appear inline when the API returns `422`.
- Non-validation failures appear as a user-visible error toast.

## Recommended Test Data
Use stable seed data where possible, and unique brand names with a timestamp suffix for mutation tests.

- `Brand Minimal`: no logo, no website, draft, not featured, no linked products.
- `Brand Rich`: published, featured, website set, description set, logo uploaded, no linked products.
- `Brand Linked`: published, not featured, linked to products.
- `Brand Duplicate Source`: existing brand used to verify uniqueness validation.
- `Brand Stats Fixture`: linked to 3 products:
  - Product 1: published, featured, in stock
  - Product 2: published, not featured, out of stock
  - Product 3: draft, not featured, in stock

Recommended accounts:

- `Admin Full`: has `admin_panel_access`, `brands_view`, `brands_create`, `brands_edit`, `brands_delete`, and product permissions.
- `Admin View Only`: has `admin_panel_access`, `brands_view`.
- `Admin No Brand Perms`: has `admin_panel_access` but no brand-specific permissions.
- `Admin Create Only`, `Admin Edit Only`, `Admin Delete Only`: optional targeted permission accounts.

Recommended files:

- Valid logo files: small `.png`, `.jpg`, 
- Invalid file: `.txt` or `.pdf`, `.webp`, `.svg`, `.gif`
- Oversized file: image larger than `2 MB`

## Implementation-Risk Checklist
These are high-value areas to verify because the current code suggests possible defects.

- Bulk publish/draft/feature/unfeature actions appear to call the update API with partial payloads, while the update request requires `name` and `status`.
- Product forms fetch brands from the brands index endpoint as if it returns a flat array, but the index endpoint returns DataTable-shaped data.
- Admin brand pages use `auth` middleware but do not declare page-level `requiredPermissions`, so users may reach pages and only fail at API time.
- `featured`, `published`, and `search` brand endpoints are authenticated but do not appear to enforce `brands_view`.
- Brand deletion is blocked when products exist, even though the product foreign key is set to `onDelete('set null')`.

## Test Cases

## A. Access, Navigation, and Basic Load

### BR-001 Admin can open the Brands list page
- Priority: P0
- Covers: UI, API, integration
- Preconditions: Log in as `Admin Full`.
- Steps:
  1. Open `/admin/brands`.
  2. Observe the initial page load and network traffic.
- Expected:
  1. The page loads without redirecting away.
  2. The list header, search box, filters button, refresh button, and create button are visible.
  3. `GET /api/ecommerce/brands` returns `200`.
  4. The response shape is DataTable-like with `data.items` and pagination metadata.

### BR-002 Unauthenticated user is redirected away from admin brand routes
- Priority: P0
- Covers: UI, auth, integration
- Preconditions: Logged out.
- Steps:
  1. Open `/admin/brands`.
  2. Open `/admin/brands/create`.
  3. Open `/admin/brands/{existingId}` directly.
- Expected:
  1. Each route redirects to `/login`.
  2. The original target is preserved in the redirect query where applicable.
  3. No brand data is rendered before redirect completes.

### BR-003 User without `brands_view` cannot successfully use the list page
- Priority: P0
- Covers: permissions, UI, API
- Preconditions: Log in as `Admin No Brand Perms`.
- Steps:
  1. Open `/admin/brands`.
  2. Observe page content and network results.
- Expected:
  1. The user must not gain access to brand data.
  2. The underlying list request returns `403`.
  3. The UI should show a clear failure state or redirect instead of silently appearing empty.
  4. No brand rows are leaked in the DOM or network payloads.

### BR-004 User without `brands_create` cannot create a brand
- Priority: P0
- Covers: permissions, UI, API
- Preconditions: Log in as a user with `brands_view` but without `brands_create`.
- Steps:
  1. Open `/admin/brands/create`.
  2. Submit a valid brand.
- Expected:
  1. The brand is not created.
  2. The create request returns `403`.
  3. The UI surfaces the error clearly.
  4. If the create page or button is visible, treat that as a UX/security regression risk.

### BR-005 User without `brands_edit` cannot update a brand
- Priority: P0
- Covers: permissions, UI, API
- Preconditions: Log in as a user with `brands_view` but without `brands_edit`.
- Steps:
  1. Open `/admin/brands/{existingId}/edit`.
  2. Change a field and submit.
- Expected:
  1. The update request returns `403`.
  2. No data changes persist.
  3. The UI shows an error rather than a false success state.

### BR-006 User without `brands_delete` cannot delete a brand
- Priority: P0
- Covers: permissions, UI, API
- Preconditions: Log in as a user with `brands_view` but without `brands_delete`.
- Steps:
  1. From the list page, attempt single delete on a deletable brand.
  2. If bulk delete is visible, attempt bulk delete.
- Expected:
  1. Delete requests return `403`.
  2. The brand remains present after refresh.
  3. The UI shows an error.

## B. List, Search, Sort, Filter, and Table State

### BR-007 List page uses the expected default sort
- Priority: P1
- Covers: UI, API
- Preconditions: At least 3 brands with different `sort_order`.
- Steps:
  1. Open `/admin/brands`.
  2. Compare row order with seed data.
- Expected:
  1. Brands are ordered by `sort_order` ascending by default.
  2. The order matches the API response.

### BR-008 Search finds brands by name
- Priority: P0
- Covers: UI, API, integration
- Preconditions: At least one unique brand name exists.
- Steps:
  1. Enter a full unique brand name in the table search box.
  2. Repeat with a partial name.
- Expected:
  1. Debounced search triggers the list request with the search parameter.
  2. Matching rows remain visible.
  3. Non-matching rows disappear.

### BR-009 Search finds brands by description
- Priority: P1
- Covers: UI, API, integration
- Preconditions: At least one brand has a unique description phrase.
- Steps:
  1. Search for a phrase present only in the description.
- Expected:
  1. The correct brand is returned even if the phrase is not in the name.

### BR-010 Empty search/filter state is rendered correctly
- Priority: P1
- Covers: UI
- Preconditions: None.
- Steps:
  1. Search for a guaranteed non-existent string.
- Expected:
  1. The table shows the configured empty state.
  2. No stale rows remain visible.
  3. Clearing the search restores results.

### BR-011 Status filter works
- Priority: P1
- Covers: UI, API
- Preconditions: At least one draft and one published brand exist.
- Steps:
  1. Apply the `published` filter.
  2. Apply the `draft` filter.
- Expected:
  1. Only matching brands are shown.
  2. The request includes the correct `filter[status]`.

### BR-012 Featured filter works
- Priority: P1
- Covers: UI, API
- Preconditions: At least one featured and one non-featured brand exist.
- Steps:
  1. Apply the `featured` filter.
  2. Apply the `not featured` filter.
- Expected:
  1. Results match the selected filter.

### BR-013 Has-products filter works
- Priority: P1
- Covers: UI, API, integration
- Preconditions: One brand with products and one brand without products exist.
- Steps:
  1. Apply `with products`.
  2. Apply `without products`.
- Expected:
  1. Results correctly separate linked and unlinked brands.

### BR-014 Sort by name and created date works
- Priority: P1
- Covers: UI, API
- Preconditions: Multiple brands with different names and timestamps.
- Steps:
  1. Sort by `name` ascending and descending.
  2. Sort by `created_at` ascending and descending.
- Expected:
  1. Row order matches the selected sort direction.
  2. Sort icons and returned order stay in sync.

### BR-015 Pagination works without losing filters/search
- Priority: P1
- Covers: UI, API
- Preconditions: More brands than one page.
- Steps:
  1. Search or filter the list.
  2. Move to page 2.
  3. Refresh the page.
- Expected:
  1. Search, filters, sort, and page state persist correctly.
  2. Returned rows still match the active query state.

### BR-016 Row click opens the detail page
- Priority: P2
- Covers: UI, navigation
- Preconditions: At least one visible brand row exists.
- Steps:
  1. Click a non-action area of a brand row.
- Expected:
  1. The app navigates to `/admin/brands/{id}` for the clicked brand.

## C. Create Brand

### BR-017 Create a minimal draft brand
- Priority: P0
- Covers: UI, API, integration
- Preconditions: Log in as `Admin Full`.
- Steps:
  1. Open `/admin/brands/create`.
  2. Enter only a unique name.
  3. Leave description, website, and logo empty.
  4. Keep status as draft and submit.
- Expected:
  1. `POST /api/ecommerce/brands` returns `201`.
  2. A success toast is shown.
  3. The app redirects to the new brand detail page.
  4. The persisted brand has `sort_order = 0`, `is_featured = false`, and no logo.

### BR-018 Create a published, featured brand with all fields
- Priority: P0
- Covers: UI, API, integration
- Preconditions: Valid logo file available.
- Steps:
  1. Fill name, description, website, status, sort order, and featured toggle.
  2. Upload a valid logo.
  3. Submit.
- Expected:
  1. The request succeeds.
  2. The detail page shows the uploaded logo, website link, status badge, and featured badge.
  3. Reloading the detail page preserves all values.

### BR-019 Client-side required-name validation blocks submit
- Priority: P0
- Covers: UI validation
- Preconditions: Open create page.
- Steps:
  1. Leave name empty.
  2. Try to submit.
- Expected:
  1. Submission is blocked on the client.
  2. An inline name error is shown.
  3. No create request is sent.

### BR-020 Client-side invalid website validation blocks submit
- Priority: P0
- Covers: UI validation
- Preconditions: Open create page.
- Steps:
  1. Enter a valid name.
  2. Enter an invalid website such as `example.com` without protocol.
  3. Submit.
- Expected:
  1. Submission is blocked on the client.
  2. The website field shows an inline validation error.
  3. No create request is sent.

### BR-021 Server-side uniqueness validation is surfaced inline
- Priority: P0
- Covers: API validation, integration
- Preconditions: A brand with the same name already exists.
- Steps:
  1. Create a new brand using the duplicate name.
  2. Use otherwise valid values.
- Expected:
  1. The request returns `422`.
  2. The name field shows the server validation error inline.
  3. The user remains on the create page.

### BR-022 Server-side validation rejects oversized or invalid logo files
- Priority: P0
- Covers: API validation, file upload
- Preconditions: Oversized image and invalid non-image file are available.
- Steps:
  1. Try uploading a non-image file.
  2. Try uploading an image larger than `2 MB`.
  3. Submit valid surrounding form data each time.
- Expected:
  1. Each invalid upload path returns `422`.
  2. The logo error is shown inline.
  3. No brand is created.

### BR-023 Server-side validation rejects overly long values
- Priority: P1
- Covers: API validation
- Preconditions: None.
- Steps:
  1. Submit a name longer than 255 characters.
  2. Submit a description longer than 1000 characters.
  3. Submit a website longer than 255 characters.
- Expected:
  1. Each invalid field is rejected with `422`.
  2. Errors are mapped to the correct fields.

### BR-024 Double submit does not create duplicates
- Priority: P0
- Covers: async, race condition, integration
- Preconditions: Use a unique brand name.
- Steps:
  1. Fill a valid create form.
  2. Double-click submit quickly or press Enter repeatedly.
- Expected:
  1. At most one brand is created.
  2. The button enters a loading/disabled state.
  3. Only one success redirect occurs.

### BR-025 Cancel from create does not save anything
- Priority: P2
- Covers: UI
- Preconditions: Open create page and fill unsaved data.
- Steps:
  1. Click `Cancel`.
  2. Return to the brands list.
  3. Search for the unsaved brand name.
- Expected:
  1. The app returns to the list page.
  2. No new brand exists.

## D. Brand Detail Page

### BR-026 Detail page shows persisted brand information
- Priority: P0
- Covers: UI, API
- Preconditions: Existing brand with full data.
- Steps:
  1. Open `/admin/brands/{id}`.
- Expected:
  1. The page shows name, description, website, status, featured state, sort order, created date, updated date, and creator when available.
  2. If a logo exists, it is rendered correctly.

### BR-027 Detail page shows products and stats correctly
- Priority: P0
- Covers: UI, API, integration
- Preconditions: Use `Brand Stats Fixture`.
- Steps:
  1. Open the brand detail page.
  2. Observe the products section and stats card.
- Expected:
  1. The products section lists up to five linked products.
  2. The stats request returns `200`.
  3. Stats match the fixture exactly:
     - total products = 3
     - published products = 2
     - featured products = 1
     - in-stock products = 2

### BR-028 Detail page handles missing or forbidden brand cleanly
- Priority: P0
- Covers: UI, API, permissions
- Preconditions: Use an invalid brand ID or a user lacking `brands_view`.
- Steps:
  1. Open `/admin/brands/{badOrForbiddenId}` directly.
- Expected:
  1. The request fails with `404` or `403`.
  2. The page shows the failure state and back-to-brands action.
  3. No stale brand details remain visible.

## E. Edit Brand

### BR-029 Edit text and toggle fields successfully
- Priority: P0
- Covers: UI, API, integration
- Preconditions: Existing editable brand.
- Steps:
  1. Open `/admin/brands/{id}/edit`.
  2. Change name, description, website, status, sort order, and featured toggle.
  3. Submit.
- Expected:
  1. The update request succeeds.
  2. The app redirects to the detail page.
  3. The detail page and list page show updated values after refresh.

### BR-030 Editing with the same existing name succeeds
- Priority: P1
- Covers: API validation
- Preconditions: Existing brand.
- Steps:
  1. Open edit page.
  2. Keep the name unchanged.
  3. Modify another field and submit.
- Expected:
  1. The update succeeds.
  2. No false uniqueness validation is triggered.

### BR-031 Editing to a duplicate brand name is rejected inline
- Priority: P0
- Covers: API validation, integration
- Preconditions: Two existing brands with different names.
- Steps:
  1. Edit Brand A.
  2. Change its name to Brand B's name.
  3. Submit.
- Expected:
  1. The request returns `422`.
  2. The duplicate-name validation error appears inline on the name field.
  3. Brand A remains unchanged after refresh.

### BR-032 Replace an existing logo
- Priority: P0
- Covers: file upload, API, integration
- Preconditions: Brand already has a logo and a new valid logo file is available.
- Steps:
  1. Open edit page.
  2. Replace the current logo with a new valid image.
  3. Submit.
- Expected:
  1. The request is sent as multipart form data with `_method=PUT`.
  2. The detail page shows the new logo, not the old one.
  3. Refresh does not restore the old logo.

### BR-033 Remove an existing logo without replacing it
- Priority: P0
- Covers: file handling, API, integration
- Preconditions: Brand already has a logo.
- Steps:
  1. Open edit page.
  2. Use the file reset/remove control so no logo remains selected.
  3. Submit.
- Expected:
  1. The request includes the logo removal flag.
  2. The detail page no longer shows a logo.
  3. Refresh preserves the no-logo state.

### BR-034 Cancel from edit discards unsaved changes
- Priority: P2
- Covers: UI
- Preconditions: Existing brand.
- Steps:
  1. Open edit page.
  2. Change fields but do not submit.
  3. Click `Cancel`.
  4. Reopen the brand.
- Expected:
  1. The app returns to the brands list.
  2. Unsaved values are not persisted.

### BR-035 Update request survives page refresh without stale state
- Priority: P1
- Covers: async, cache/state handling
- Preconditions: Existing brand.
- Steps:
  1. Edit and save a brand.
  2. Refresh the detail page immediately.
  3. Return to the edit page.
- Expected:
  1. All pages show the latest persisted values.
  2. Old values do not reappear from local state or cached async data.

## F. Delete Brand

### BR-036 Single delete succeeds for a brand with no linked products
- Priority: P0
- Covers: UI, API, integration
- Preconditions: A deletable brand with no products exists.
- Steps:
  1. Delete the brand from the list page.
  2. Confirm the browser confirmation dialog.
- Expected:
  1. The delete request returns `200`.
  2. A success toast is shown.
  3. The brand disappears from the list after refresh.
  4. Opening its detail URL now fails cleanly.

### BR-037 Delete is blocked for a brand with linked products
- Priority: P0
- Covers: business rule, API, integration
- Preconditions: Use `Brand Linked`.
- Steps:
  1. Attempt to delete the linked brand from the list page.
- Expected:
  1. The request fails.
  2. The UI shows an error toast.
  3. The brand remains in the list.
  4. Linked products remain unchanged.

### BR-038 Canceling the delete confirmation performs no action
- Priority: P2
- Covers: UI
- Preconditions: Deletable brand exists.
- Steps:
  1. Click delete.
  2. Cancel the browser confirmation dialog.
- Expected:
  1. No delete request is sent.
  2. The brand remains visible.

## G. Bulk Actions and Advanced Admin Actions

### BR-039 Bulk delete succeeds when all selected brands are deletable
- Priority: P1
- Covers: UI, API, async integration
- Preconditions: At least 2 brands with no products exist.
- Steps:
  1. Select multiple deletable brands.
  2. Trigger bulk delete and confirm.
- Expected:
  1. A delete request is sent for each selected brand.
  2. All selected brands are removed.
  3. The success message count matches the number actually deleted.

### BR-040 Bulk delete reports partial success when the selection is mixed
- Priority: P0
- Covers: UI, API, partial failure handling
- Preconditions: Select a mix of deletable and linked brands.
- Steps:
  1. Trigger bulk delete and confirm.
- Expected:
  1. Successful deletions still complete.
  2. Failed deletions remain.
  3. The UI shows both success and partial-failure feedback accurately.

### BR-041 Bulk publish works
- Priority: P0
- Covers: UI, API, regression risk
- Preconditions: At least 2 draft brands exist.
- Steps:
  1. Select multiple draft brands.
  2. Trigger bulk publish.
  3. Refresh the list and open one detail page.
- Expected:
  1. All selected brands become `published`.
  2. No validation error occurs.
  3. If the action fails with `422`, log it as a likely implementation defect in partial-update handling.

### BR-042 Bulk move-to-draft works
- Priority: P0
- Covers: UI, API, regression risk
- Preconditions: At least 2 published brands exist.
- Steps:
  1. Select multiple published brands.
  2. Trigger bulk move-to-draft.
- Expected:
  1. All selected brands become `draft`.
  2. No unrelated fields are cleared.

### BR-043 Bulk feature and unfeature work
- Priority: P0
- Covers: UI, API, regression risk
- Preconditions: A mix of featured and non-featured brands exists.
- Steps:
  1. Bulk mark selected brands as featured.
  2. Bulk unfeature them.
- Expected:
  1. Feature state updates persist correctly in both list and detail views.
  2. No validation error occurs.
  3. If the action fails with `422`, treat it as a strong defect signal.

## H. Cross-Feature Integration With Products

### BR-044 Newly created brand appears in product create form
- Priority: P0
- Covers: frontend/backend integration, regression risk
- Preconditions: `Admin Full` also has product permissions.
- Steps:
  1. Create a new brand successfully.
  2. Open `/admin/products/create`.
  3. Open the brand dropdown.
- Expected:
  1. The new brand is available for selection.
  2. No brand-loading error is visible in the product form.
  3. If the dropdown is empty or malformed, log it as an integration defect.

### BR-045 Updated brand name propagates to product forms
- Priority: P1
- Covers: integration
- Preconditions: An existing brand is selectable in product forms.
- Steps:
  1. Rename the brand from the Brands feature.
  2. Open product create or edit.
  3. Open the brand dropdown.
- Expected:
  1. The updated brand name appears.
  2. The old name does not linger after refresh.

### BR-046 Brand detail products section links correctly into Products
- Priority: P1
- Covers: integration, navigation
- Preconditions: Brand linked to products.
- Steps:
  1. Open the brand detail page.
  2. Click a listed product.
  3. If available, click the `view all products` link.
- Expected:
  1. Product links open the expected product detail pages.
  2. The filtered products link opens the products page with the brand filter applied.

### BR-047 Deleting a brand does not corrupt product data
- Priority: P0
- Covers: integration, data integrity
- Preconditions: Use both a deletable unlinked brand and a linked brand.
- Steps:
  1. Delete the unlinked brand and check products.
  2. Attempt to delete the linked brand and check products again.
- Expected:
  1. Unrelated products remain unaffected.
  2. The linked-brand delete attempt does not detach or corrupt product data unless the delete truly succeeds.

## I. Hidden/API-Focused Cases That Still Matter for E2E

### BR-048 `GET /api/ecommerce/brands/search` requires a query and behaves correctly
- Priority: P1
- Covers: API, integration
- Preconditions: Logged in.
- Steps:
  1. Call `/api/ecommerce/brands/search?q=KnownBrand`.
  2. Call `/api/ecommerce/brands/search` without `q`.
- Expected:
  1. Valid query returns `200` with matching brands.
  2. Missing query returns `400`.

### BR-049 Brand API auxiliary endpoints respect permissions
- Priority: P0
- Covers: API security
- Preconditions: Logged in as `Admin No Brand Perms`.
- Steps:
  1. Call `/api/ecommerce/brands/featured`.
  2. Call `/api/ecommerce/brands/published`.
  3. Call `/api/ecommerce/brands/search?q=test`.
  4. Call `/api/ecommerce/brands/summary`.
  5. Call `/api/ecommerce/brands/{id}/stats`.
- Expected:
  1. No endpoint should leak brand data to unauthorized users.
  2. Any endpoint returning `200` here is a permission-gap defect.

### BR-050 Reorder endpoint works if exposed later or tested via API
- Priority: P2
- Covers: API, regression
- Preconditions: At least 3 brands exist.
- Steps:
  1. Send a reorder payload with changed `sort_order` values.
  2. Reload the brands list.
- Expected:
  1. The API returns success.
  2. The list order changes accordingly.

## J. Failure, Resilience, and Async Behavior

### BR-051 Create handles network/server failure safely
- Priority: P0
- Covers: UI resilience, async
- Preconditions: Simulate network failure or `500` during create.
- Steps:
  1. Fill a valid create form.
  2. Submit while forcing the create request to fail.
- Expected:
  1. No false success toast appears.
  2. No redirect occurs.
  3. The user sees an error toast.
  4. Retrying after recovery succeeds once.

### BR-052 Edit handles network/server failure safely
- Priority: P0
- Covers: UI resilience, async
- Preconditions: Existing brand.
- Steps:
  1. Change fields on edit.
  2. Force the update request to fail.
- Expected:
  1. The user remains on the edit page.
  2. Entered values remain available so the user can retry.
  3. No partial success state is shown.

### BR-053 Delete handles server failure safely
- Priority: P1
- Covers: UI resilience, integration
- Preconditions: Deletable brand exists.
- Steps:
  1. Force the delete request to fail after confirmation.
- Expected:
  1. The brand remains visible after refresh.
  2. The UI shows an error toast.
  3. The table does not permanently remove the row optimistically.

### BR-054 Session expiry during a brand mutation is handled cleanly
- Priority: P1
- Covers: auth, async
- Preconditions: Authenticated session that can be expired manually.
- Steps:
  1. Open create or edit.
  2. Expire the session before submit.
  3. Submit valid data.
- Expected:
  1. The request fails with `401`.
  2. The user sees a session/auth error.
  3. No mutation is applied.

### BR-055 Fast repeated navigation does not show stale brand detail data
- Priority: P2
- Covers: async, state handling
- Preconditions: At least 2 brands with clearly different data.
- Steps:
  1. Open Brand A detail.
  2. Quickly switch to Brand B detail.
  3. Repeat between detail and edit pages.
- Expected:
  1. Brand names, logos, products, and stats always match the current route.
  2. No stale flash of the previous brand remains once loading finishes.

## Suggested First Playwright Automation Slice
Start with these first because they cover the most business risk and likely defects.

- BR-001
- BR-017
- BR-018
- BR-021
- BR-024
- BR-027
- BR-029
- BR-032
- BR-033
- BR-036
- BR-037
- BR-040
- BR-041
- BR-043
- BR-044
- BR-049
