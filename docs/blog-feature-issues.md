# Blog Feature — Known Issues, Gaps, and Open Questions

Consolidated inventory of everything problematic identified in the Blog feature during E2E test implementation (batches 1–4). Organized by category, with evidence, impact, and references to the workaround code where applicable.

Source material:
- [.codex/test-cases/blog-e2e-test-plan.md](../.codex/test-cases/blog-e2e-test-plan.md) — the single source of truth for coverage
- [E2E/tests/admin/Blog-post-create.spec.ts](../E2E/tests/admin/Blog-post-create.spec.ts), [E2E/tests/admin/Blog-category-create.spec.ts](../E2E/tests/admin/Blog-category-create.spec.ts), [E2E/tests/admin/Blog-tag-create.spec.ts](../E2E/tests/admin/Blog-tag-create.spec.ts), [E2E/tests/admin/Blog-posts-datatable.spec.ts](../E2E/tests/admin/Blog-posts-datatable.spec.ts)
- [E2E/tests/ui/Blog-public-coverage.spec.ts](../E2E/tests/ui/Blog-public-coverage.spec.ts)
- [E2E/pages/Admin/Blog/](../E2E/pages/Admin/Blog/), [E2E/pages/BlogPage.ts](../E2E/pages/BlogPage.ts), [E2E/pages/BlogPostDetailPage.ts](../E2E/pages/BlogPostDetailPage.ts), [E2E/pages/BlogCategoryPage.ts](../E2E/pages/BlogCategoryPage.ts), [E2E/pages/BlogTagPage.ts](../E2E/pages/BlogTagPage.ts)

---

## 1. Confirmed product bugs

### BUG-01 — Delete confirmation modal renders literal `<name></name>` text
**Where:** Blog delete-confirm dialog for posts, categories, and tags.
**Symptom:** The modal body shows the literal string `<name></name>` instead of the entity name being deleted. Template interpolation placeholder is emitted as visible text.
**Impact:** User-facing. An admin clicking Delete on "Technology" sees a dialog that doesn't tell them what they are about to delete.
**Test workaround:** All delete flows match on the dialog *heading* ("Delete Post" / "Delete Category" / "Delete Tag") and then click the last `Delete` button to avoid the broken body text.
  - [E2E/pages/Admin/Blog/BlogPostsPage.ts:88-90](../E2E/pages/Admin/Blog/BlogPostsPage.ts#L88-L90)
  - [E2E/pages/Admin/Blog/BlogCategoriesPage.ts:123-125](../E2E/pages/Admin/Blog/BlogCategoriesPage.ts#L123-L125)
  - [E2E/pages/Admin/Blog/TagsPage.ts:90-92](../E2E/pages/Admin/Blog/TagsPage.ts#L90-L92)

### BUG-02 — Post detail canonical URL points to the API, not the public page
**Where:** `/blog/{slug}` — `<link rel="canonical">` element.
**Symptom:** Canonical `href` is `https://api.mallblitz.com/blog/posts/{slug}` instead of `https://mallblitz.com/blog/{slug}`.
**Impact:** SEO-critical. Google can index the API endpoint as the canonical URL. Every published post is affected.
**Test workaround:** PUB-POST-001 does NOT assert canonical — otherwise it would fail permanently.

### BUG-03 — Invalid blog slugs return HTTP 200 instead of 404
**Where:** `/blog/{slug}`, `/blog/category/{slug}`, `/blog/tag/{slug}`, `/blog/author/{slug}`.
**Symptom:** Requesting a non-existent slug returns HTTP 200 with an empty-ish body or "No articles found" text. No HTTP 404, no Nuxt error page.
**Impact:**
- SEO: search engines can index unlimited junk URLs.
- Monitoring: 404 rate is a standard SRE signal; impossible to distinguish real traffic from broken links.
- Blocks PUB-TAX-003, PUB-TAX-004, PUB-POST-005, PUB-AUTHOR-003 entirely.

### BUG-04 — Site brand `MallBlitz` is the `<h1>` on every blog page
**Where:** `/blog`, `/blog/{slug}`, `/blog/category/{slug}`, `/blog/tag/{slug}`, `/blog/author/{slug}`.
**Symptom:** The global header's brand text is marked as `<h1>`. The actual page title (post title, category label, tag label) renders as a lower heading level (h2/h3).
**Impact:**
- SEO: every blog sub-page has the identical h1, so none of the pages have a unique top-level heading from a crawler's perspective.
- Accessibility: screen readers land on "MallBlitz" as the primary heading on every page.
**Test workaround:** [BlogPostDetailPage.verifyTitle](../E2E/pages/BlogPostDetailPage.ts#L27) scopes the heading lookup to `<main>` rather than page-wide to avoid matching the brand h1.

### BUG-05 — Blog post detail page has two `<h1>` elements
**Where:** `/blog/{slug}`.
**Symptom:** Both the site brand "MallBlitz" *and* the post title render as h1 simultaneously.
**Impact:** Accessibility + SEO violation — HTML should have one h1 per document. Related to but distinct from BUG-04 (BUG-04 affects all blog pages; BUG-05 is the additional duplicate h1 specifically on post detail).

### BUG-06 — Admin category datatable search is broken
**Where:** `/admin/blog/categories` — the "Search categories..." textbox.
**Symptom:** Typing a query does not filter the rows. The search field accepts input but the table returns all rows or unchanged rows.
**Impact:** Admins cannot filter large category lists. Directly affects usability in production.
**Test workaround:** [Blog-category-create.spec.ts:148-151](../E2E/tests/admin/Blog-category-create.spec.ts#L148-L151) — ADM-CAT-007 bypasses the search entirely, bumping rows-per-page to 50 to show all categories on one page and selecting by name.

### BUG-07 — Seeded category slugs are faker gibberish
**Where:** Blog category seeder.
**Symptom:** Seeded slugs are phrases like `voluptatem-deserunt`, `veniam-veniam` — random Latin filler from faker. The test plan's example `/blog/category/technology` does not exist as a live URL.
**Impact:**
- Manual QA can't use the example URLs in the plan.
- SEO: real-world category URLs are unreadable.
- Test brittleness: PUB-TAX-001 cannot hardcode a slug and must dynamically scrape one from the DOM instead ([Blog-public-coverage.spec.ts:74-81](../E2E/tests/ui/Blog-public-coverage.spec.ts#L74-L81)).

### BUG-08 — Blog search uses full-page navigation instead of XHR
**Where:** `/blog` search box.
**Symptom:** Entering a query triggers a full page reload (URL changes, scroll position resets) rather than an in-place DOM update.
**Impact:**
- UX: slower, loses scroll context, flashes the page.
- Accessibility: focus is lost on reload.
- Performance: unnecessary bandwidth for what should be a client-side filter.

---

## 2. Functional gaps — features the plan assumes but the UI does not expose

### GAP-01 — No scheduled-publish date field in the admin post form
**Where:** [BlogPostCreatePage](../E2E/pages/Admin/Blog/BlogPostCreatePage.ts) / [BlogPostEditPage](../E2E/pages/Admin/Blog/BlogPostEditPage.ts).
**What's missing:** The status selector offers draft/published but there is no date/time picker for scheduled publishing.
**Blocks:** ADM-POST-014 (scheduled post validation), ADM-POST-015 (published-at editing business rules), SYS-005 (scheduled publishing becomes public when due).
**Question:** Was scheduled publishing ever shipped, or is it behind a feature flag?

### GAP-02 — No "delete unused tags" bulk action
**Where:** [TagsPage](../E2E/pages/Admin/Blog/TagsPage.ts).
**What's missing:** The plan's ADM-TAG-007 assumes a button that purges tags with zero associated posts. No such control in the live admin.
**Blocks:** ADM-TAG-007.

### GAP-03 — No category reorder / sort-order UI
**Where:** [BlogCategoriesPage](../E2E/pages/Admin/Blog/BlogCategoriesPage.ts).
**What's missing:** ADM-CAT-010 assumes drag-to-reorder or a sortable column. Sort order can only be set via the create/edit form numeric field — there's no UI to bulk-reorder or to verify the order is reflected on the public side.
**Blocks:** ADM-CAT-010.

### GAP-04 — No restore (undelete) flow visible in admin
**Where:** Posts, categories, and tags datatables.
**What's missing:** Row actions do not expose "Restore" and there is no trash/deleted-items filter in any of the three blog datatables.
**Blocks:** The restore half of ADM-POST-010 and ADM-TAG-005.
**Evidence:** [Blog-tag-create.spec.ts:96-97](../E2E/tests/admin/Blog-tag-create.spec.ts#L96-L97) — "The 'restore' half of ADM-TAG-005 is deferred — there is no Restore row action."

### GAP-05 — Featured-image / media upload picker is ambiguous
**Where:** [BlogPostCreatePage](../E2E/pages/Admin/Blog/BlogPostCreatePage.ts) / [BlogPostEditPage](../E2E/pages/Admin/Blog/BlogPostEditPage.ts).
**What's missing:** ADM-POST-004/005 describe upload flows with assertions about stored path, dimensions, alt text. It's unclear whether the upload widget exists, what library it uses, and where the resulting URL surfaces on the form.
**Blocks:** ADM-POST-004, ADM-POST-005.

### GAP-06 — No non-admin author role / author-facing admin UI
**Where:** Auth + `/admin/blog/*`.
**What's missing:** The entire SEC section assumes a "non-admin author" role exists — a user who can create/edit their own posts but not others'. The project has admin-only auth fixtures today. No author login, no author storage state, no author-scoped admin views to test against.
**Blocks:** SEC-001, SEC-002, SEC-003, SEC-004, SEC-005 (the full permissions section, 5 of 7 tests).

### GAP-07 — No sitemap URL or structured-data markers confirmed
**Where:** Public site SEO surface.
**What's missing:** The plan references `sitemap.xml` and JSON-LD structured data for posts, but neither has been verified as present and the exact URLs/attributes are not documented.
**Blocks:** SYS-001, SYS-003, SYS-004 until we confirm what exists.

### GAP-08 — No cache-invalidation signal exposed
**Where:** Public pages + admin mutations.
**What's missing:** SYS-007/008 want to prove that public caches refresh after admin edits. Without a cache-status response header or a visible cache version marker in the DOM, we can only wait-and-reload, which is flaky and slow.
**Blocks:** SYS-007, SYS-008.

---

## 3. Incomplete / partially implemented behavior

### INC-01 — View count behavior is underspecified (and the plan admits it)
**Where:** PUB-POST-008.
**Symptom:** The plan entry literally says "current visible behavior is documented and asserted consistently" — no rule is defined.
**Open questions:** Increment on every GET? Debounce per session? Exclude authenticated admins? Exclude bots? Is the number cached?
**Blocks:** PUB-POST-008.

### INC-02 — Related posts widget is not test-markered
**Where:** `/blog/{slug}` — related posts section.
**Symptom:** PUB-POST-004 wants to verify related posts exclude the current post and drafts. The widget has no `data-test` attributes and the DOM structure is not obvious.
**Blocks:** PUB-POST-004 without further UI instrumentation.

### INC-03 — Category/tag taxonomy breadcrumbs not verified
**Where:** `/blog/category/{slug}`, `/blog/tag/{slug}`.
**Symptom:** Only post detail breadcrumbs are covered (PUB-POST-003). Taxonomy breadcrumbs were not attempted because the DOM shape was unclear during discovery.
**Status:** Not a bug, just uncovered.

### INC-04 — Category parent picker coverage for circular references is partial
**Where:** ADM-CAT-009.
**Symptom:** Test asserts server-side rejection ([Blog-category-create.spec.ts:168-175](../E2E/tests/admin/Blog-category-create.spec.ts#L168-L175)) but does not cover whether the parent dropdown *should* hide descendants from its options list. If the UI should pre-filter invalid choices, that's an additional assertion we haven't written.

### INC-05 — Bulk action atomicity on partial failure is not provable from the UI
**Where:** ADM-POST-011, ADM-POST-012.
**Symptom:** The plan says "no partial mutation occurs on error," but there is no way to provoke a partial-failure scenario from the admin UI — the happy path is all we can verify.
**Status:** Covered happy path only; true atomicity claim is untested.

---

## 4. Technical weaknesses / risky design decisions

### TECH-01 — Single `[data-test="blog-card"]` marker, no sub-markers
**Where:** Public blog card component.
**Problem:** Title link, category link, tag link, and author link inside a card share DOM but have no distinguishing test markers. Tests must use CSS attribute selectors (`a[href^="/blog/"]:not([href*="/category/"])`) and `.last()` chains to disambiguate.
**Suggested fix:** Add `data-test="blog-card-title-link"`, `-category-link`, `-tag-link`, `-author-link`.
**Affected files:** [BlogPage.ts](../E2E/pages/BlogPage.ts) — `clickFirstCardTitle`, `clickFirstCardCategoryLink`, etc.

### TECH-02 — No data-test markers on public blog pagination
**Where:** Public blog listing.
**Problem:** Pagination buttons rely on `getByRole("link", { name: /next/i })` — fragile to any copy change.
**Suggested fix:** `data-test="blog-pagination-next"` / `-prev` / `-page-{n}`.

### TECH-03 — `networkidle` used in public blog POM navigation helpers
**Where:** [BlogPostDetailPage.goToPostBySlug](../E2E/pages/BlogPostDetailPage.ts#L19-L23), [BlogCategoryPage.goToCategoryBySlug](../E2E/pages/BlogCategoryPage.ts#L13-L17), [BlogTagPage.goToTagBySlug](../E2E/pages/BlogTagPage.ts#L13-L17).
**Problem:** Playwright discourages `networkidle` because third-party widgets (analytics, ads) can keep the network active indefinitely. Works today because the site has no persistent trackers, but brittle if any analytics tag is added.
**Suggested fix:** Replace with a meaningful DOM-ready signal (e.g., blog card visible, main heading visible).

### TECH-04 — Admin post edit URL shape not verified stable
**Where:** [BlogPostsPage.openEditForPost](../E2E/pages/Admin/Blog/BlogPostsPage.ts) via table row action.
**Problem:** Edit row action uses table action click rather than hardcoded URL — fine today, but if edit routes change from id-based to slug-based (or vice versa) silently, tests break only on actions that try to deep-link.

### TECH-05 — Date.now()-based uniqueness suffixes can collide in fast serial runs
**Where:** [blog-post.factory.ts](../E2E/factories/blog-post.factory.ts), `BulkDel-${Date.now()}`, `BulkStat-${Date.now()}` prefixes in [Blog-post-create.spec.ts:197](../E2E/tests/admin/Blog-post-create.spec.ts#L197).
**Problem:** Two tests launched in the same millisecond share a prefix. Random-int suffix mitigates but does not eliminate collisions across parallel workers.
**Suggested fix:** Use `crypto.randomUUID().slice(0, 8)` consistently.

### TECH-06 — Status column match is string-exact ("Draft" / "Published")
**Where:** [BlogPostsPage.verifyPostStatus](../E2E/pages/Admin/Blog/BlogPostsPage.ts).
**Problem:** Any i18n or casing change in the status badge breaks every post lifecycle test. There is no status code / test id on the badge.
**Suggested fix:** `data-test="post-status-badge"` with `data-status="draft"` attribute.

### TECH-07 — Post detail `verifyAuthorRendered` matches "min read" text, not a specific author marker
**Where:** [BlogPostDetailPage.verifyAuthorRendered](../E2E/pages/BlogPostDetailPage.ts#L47-L50).
**Problem:** The assertion is a loose regex on "min read" to confirm the author/meta block rendered. We do not actually verify the author name renders — we just verify the reading-time line (which sits next to the author block) is visible.
**Cause:** The author section has no test marker.

---

## 5. Blockers for untouched test batches

### BLOCK-01 — SEC-* blocked on non-admin author fixture
Every permissions test needs a non-admin author role (GAP-06). Without it, SEC-001 through SEC-007 cannot be written.

### BLOCK-02 — SYS-005 (scheduled publishing) blocked on scheduler trigger
No way to force the scheduler to run from a test. Need either a test-only endpoint, an artisan command bridge, or a clock-override mechanism. Plus GAP-01 (no schedule date field).

### BLOCK-03 — SYS-007/008 (cache invalidation) blocked on cache signal
GAP-08 — no way to prove cache refreshed except wait-and-reload.

### BLOCK-04 — SYS-001/003/004 (canonical + sitemap) blocked on confirmation of endpoints
GAP-07 — need to confirm sitemap URL, JSON-LD presence, and structured data shape before writing assertions.

### BLOCK-05 — ADM-POST-004/005 blocked on upload widget clarity
GAP-05 — need a walkthrough of how uploads actually work in the admin before automating.

---

## 6. Business logic that needs clarification

Each item below blocks its named test(s) until a product/engineering decision is recorded.

### CLARIFY-01 — ADM-POST-009 Duplicate: author and featured flag on copy
When admin A duplicates admin B's post:
- Who is the author of the copy — A or B?
- Is the featured flag reset to false?
- Is the slug auto-suffixed (e.g., `-copy`, `-1`) or must the user edit it manually?
- Is the status forced to draft regardless of the original's status?

The plan says "follows the agreed business rule" but no rule is recorded. Current test just asserts that two rows with matching title exist ([Blog-post-create.spec.ts:145-172](../E2E/tests/admin/Blog-post-create.spec.ts#L145-L172)) — nothing about author, featured, or status.

### CLARIFY-02 — ADM-CAT-006 Delete parent category: children reparenting
When a category with children is deleted:
- Do children move to the deleted category's parent?
- Do they move to the root?
- Do they move to the default category?
- What if the deleted category's parent is itself root — same as root?
- What if the deleted category is also the default — is delete blocked (ADM-CAT-005)?

Plan says "children move to parent or root according to business rule." Rule not defined. ADM-CAT-006 deferred.

### CLARIFY-03 — ADM-CAT-005 vs. ADM-CAT-006 interaction with Uncategorized
If "Uncategorized" is both the default category and has children, can it still be deleted by a non-default rule? Is default category protection absolute or context-dependent?

### CLARIFY-04 — Category deletion with associated posts
If I delete a non-default category whose posts are attached:
- Do posts migrate to the default category?
- Do they become uncategorized in a different sense?
- Is the delete blocked?

No rule in the plan. Not tested.

### CLARIFY-05 — Tag deletion with associated posts
If I delete a tag that is assigned to posts:
- Do posts lose the tag silently?
- Is there a tombstone?
- Is the delete blocked?

Not specified. Not tested.

### CLARIFY-06 — ADM-POST-015 Published-at editing rules
Can I set a published post's `published_at` into the future (effectively unpublishing it)?
Can I set it into the past (backdating)?
Does editing `published_at` reorder the public listing immediately?

No business rules given. ADM-POST-015 deferred.

### CLARIFY-07 — ADM-POST-011/012 Bulk action atomicity contract
Should bulk actions be:
- Transactional (all-or-nothing — one failure rolls back the set)?
- Best-effort (success set + failure set reported separately)?

This affects both the backend contract and what partial-failure assertions to write. Currently only happy path is covered.

### CLARIFY-08 — PUB-POST-008 View count ownership
Is view count part of the post entity (admin-editable, seedable, resettable)?
Or is it a read-only analytics projection that admin can only observe?

Affects whether admin tests need to reset it between runs.

### CLARIFY-09 — ADM-CAT-009 Where is circular reference enforced?
Server-side, client-side (parent dropdown hides descendants), or both?
Current test only proves server rejection exists. If the dropdown should also pre-filter, that's an additional assertion to add.

---

## 7. Plan inconsistencies (errors in the test plan itself)

### PLAN-01 — Test plan targets Laravel Dusk, repo is Playwright
[.codex/test-cases/blog-e2e-test-plan.md](../.codex/test-cases/blog-e2e-test-plan.md) references `php artisan dusk`, `tests/Browser/Blog/...`, and `@dusk-selector` syntax. This is a Playwright repo with `data-test-id` attributes. All selector-level guidance in the plan needs translation.

### PLAN-02 — Plan example URLs reference slugs that don't exist
`/blog/category/technology` is listed as an example; live site has faker-generated slugs (BUG-07). Plan should either be updated to the real slugs or the seeder should be fixed.

### PLAN-03 — PUB-POST-008 is explicitly vague
The plan admits this test is "documented and asserted consistently" without defining the behavior. Not actionable as written.

### PLAN-04 — Tests assume features that aren't shipped
ADM-POST-014/015 (scheduled dates), ADM-TAG-007 (delete unused), ADM-CAT-010 (reorder UI) all assume features that don't exist in the live admin (GAP-01, GAP-02, GAP-03).

---

## 8. Quick reference — what's blocked by what

| Blocker | Blocks (test IDs) |
|---|---|
| BUG-01 delete modal | None (workaround in POMs) |
| BUG-02 canonical API URL | PUB-POST-001 canonical assertion |
| BUG-03 invalid slugs = 200 | PUB-TAX-003, PUB-TAX-004, PUB-POST-005, PUB-AUTHOR-003 |
| BUG-06 broken category search | Workaround in ADM-CAT-007 |
| GAP-01 no schedule field | ADM-POST-014, ADM-POST-015, SYS-005 |
| GAP-02 no delete-unused | ADM-TAG-007 |
| GAP-03 no reorder UI | ADM-CAT-010 |
| GAP-04 no restore flow | ADM-POST-010 (restore half), ADM-TAG-005 (restore half) |
| GAP-05 upload widget unclear | ADM-POST-004, ADM-POST-005 |
| GAP-06 no author role | SEC-001…SEC-007 |
| GAP-07 sitemap/JSON-LD | SYS-001, SYS-003, SYS-004 |
| GAP-08 no cache signal | SYS-007, SYS-008 |
| CLARIFY-01 | ADM-POST-009 (full assertions) |
| CLARIFY-02 | ADM-CAT-006 |
| CLARIFY-06 | ADM-POST-015 |
| INC-01 | PUB-POST-008 |
| INC-02 | PUB-POST-004 |

---

## 9. Highest-leverage unblocks

Ranked by how many tests each unlocks:

1. **Create a non-admin author fixture (GAP-06)** → unlocks 7 SEC-* tests.
2. **Add a scheduler test-trigger + schedule date field (GAP-01, BLOCK-02)** → unlocks 3 tests (ADM-POST-014, ADM-POST-015, SYS-005) and validates a major feature.
3. **Add `data-test` markers to blog cards and pagination (TECH-01, TECH-02)** → removes the most fragile selectors, reduces flake risk across the entire public PUB-* section.
4. **Fix BUG-02 (canonical URL)** → unblocks canonical assertions in PUB-POST-001 and enables SYS-001/002.
5. **Fix BUG-01 (delete modal interpolation)** → small code fix, removes user confusion, lets tests match on body text like any normal modal.

---

## 10. Confidence levels

Items in this doc come from three sources with different confidence:

- **Directly observed during test runs** (high confidence): BUG-01, BUG-04, BUG-05, BUG-06, BUG-07, BUG-08, GAP-01, GAP-02, GAP-03, GAP-04, GAP-05.
- **Inferred from test failures or curl checks** (medium confidence): BUG-02, BUG-03.
- **Plan-reading, not live-verified** (lower confidence — should be re-verified before acting): GAP-06, GAP-07, GAP-08, every CLARIFY-* item, SEC-*/SYS-* blockers.

Before any of the medium/lower-confidence items drives a fix, re-verify against the live site or confirm with the product owner.
