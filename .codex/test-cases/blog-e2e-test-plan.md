# Blog E2E Test Plan

## Objective

This document defines end-to-end coverage for the full blog feature from a business and user-flow perspective. The goal is to protect public discovery, editorial workflows, permissions, SEO, data integrity, and lifecycle behavior.

This plan is written for this repository's current stack:

- Backend: Laravel 12
- Frontend: Nuxt 3
- Browser E2E: Laravel Dusk
- Supporting setup: `tests/DuskTestCase.php`, `tests/Helpers/BlogTestHelper.php`

## Test Strategy

Use browser E2E for real user journeys and visible outcomes.

Use hybrid E2E where browser alone is not enough:

- Browser + factory setup for deterministic data states
- Browser + direct API setup for role/permission setup
- Browser + Artisan trigger for scheduled publishing and sitemap generation

Not every scenario should create state through the UI. The important rule is that each test verifies the user-visible system outcome end to end.

## Execution Profile

Recommended execution layers:

1. Smoke suite
   Run on every PR and before release.
2. Regression suite
   Run on main branch and release candidates.
3. Nightly deep suite
   Run slow, high-volume, and cache/lifecycle scenarios.

Suggested commands:

```bash
php artisan dusk --group=blog-smoke
php artisan dusk --group=blog-regression
php artisan dusk --group=blog-nightly
```

## Core Test Data

Keep a reusable fixture set for the blog domain.

### Users

- `admin`: full blog permissions
- `author_a`: can manage own posts only
- `author_b`: second author for ownership and cross-author restrictions
- `editor`: optional, only if editor-specific permissions differ from admin
- `guest`: unauthenticated public visitor

### Categories

- `default-category`: default fallback category
- `technology`: standard root category
- `design`: second root category
- `security`: third root category
- `featured-category`: featured public category
- `parent-category`: root category with children
- `child-category`: child under `parent-category`
- `empty-category`: public category with zero posts

### Tags

- `laravel`
- `nuxt`
- `performance`
- `unused-tag`
- `popular-tag`

### Posts

- `published-post`: normal published post
- `featured-post`: published + featured
- `draft-post`
- `pending-post`
- `scheduled-post-future`
- `scheduled-post-due`
- `private-post`
- `deleted-post`
- `multi-category-post`
- `multi-tag-post`
- `attachment-post`
- `xss-post`: content contains unsafe HTML payload
- `author-a-post`
- `author-b-post`

### SEO / Discovery Fixtures

- one published category page with description and SEO metadata
- one published tag page with description and SEO metadata
- one author with profile and social links
- enough published posts to force pagination

## Suggested Test File Split

Recommended suite organization:

- `tests/Browser/Blog/PublicBlogIndexTest.php`
- `tests/Browser/Blog/PublicTaxonomyTest.php`
- `tests/Browser/Blog/PublicPostDetailTest.php`
- `tests/Browser/Blog/PublicAuthorPageTest.php`
- `tests/Browser/Blog/AdminPostsTest.php`
- `tests/Browser/Blog/AdminPostLifecycleTest.php`
- `tests/Browser/Blog/AdminCategoriesTest.php`
- `tests/Browser/Blog/AdminTagsTest.php`
- `tests/Browser/Blog/BlogPermissionsTest.php`
- `tests/Browser/Blog/BlogSeoAndSitemapTest.php`
- `tests/Browser/Blog/BlogContentSafetyTest.php`

## Selector Requirements

Some flows already have stable Dusk selectors. Add or standardize selectors for the rest before building the full suite.

Selectors that already exist and should be reused:

- `@post-title-input`
- `@post-submit-button`
- `@post-tag-picker`
- `@post-tag-search`
- `@post-tag-option-{id}`
- `@post-tag-chip-{id}`
- `@post-detail-breadcrumb`
- `@post-detail-categories`
- `data-slug` on blog cards
- `@blog-category-filter-{slug}`

Selectors that should be added:

- blog search input and submit button
- featured carousel root and slide controls
- pagination next / previous / page buttons
- public tag chips on list and detail pages
- admin post status dropdown
- admin post publish / unpublish / duplicate / toggle-feature buttons
- admin bulk action controls for posts, categories, and tags
- delete / restore / confirm modal buttons
- category reorder drag handles
- category set-default button
- category toggle-featured button
- tag delete-unused button
- public empty-state roots for category/tag/author pages

## Coverage Catalog

## 1. Public Blog Index

### `PUB-LIST-001` Blog index shows only publicly visible posts

- Preconditions: published, draft, pending, scheduled future, private, and deleted posts exist.
- Steps: visit `/blog`.
- Assert:
    - published posts are visible
    - draft, pending, scheduled future, private, and deleted posts are not visible
    - list is ordered by publish date descending
- Priority: smoke

### `PUB-LIST-002` Featured carousel appears only on unfiltered page 1

- Preconditions: at least one featured published post exists.
- Steps: visit `/blog`, then apply search, category, tag, and pagination states.
- Assert:
    - featured carousel is visible only on page 1 with no active filters
    - featured carousel is hidden on filtered states and page > 1
- Priority: regression

### `PUB-LIST-003` Pagination works across multiple pages

- Preconditions: more published posts than one page.
- Steps: visit `/blog`, move to page 2, then back.
- Assert:
    - URL query updates correctly
    - different card set appears on page 2
    - back navigation restores page 1 state
- Priority: smoke

### `PUB-LIST-004` Empty-state messaging is correct

- Preconditions: apply a filter combination that returns no posts.
- Steps: visit a no-result state.
- Assert:
    - empty-state title is shown
    - clear filters action is present when filters are active
    - clearing filters returns to default list state
- Priority: regression

### `PUB-LIST-005` Public cards navigate correctly

- Preconditions: at least one published post with author, categories, and tags.
- Steps: click post title/image, category link, tag link, and author link.
- Assert:
    - post opens detail page
    - category opens canonical category page
    - tag opens canonical tag page
    - author opens author page
- Priority: smoke

## 2. Public Search And Filtering

### `PUB-FILTER-001` Search returns matching posts only

- Preconditions: one post title matches query, others do not.
- Steps: search from `/blog`.
- Assert:
    - matching posts appear
    - non-matching posts do not appear
    - summary text reflects search query
- Priority: smoke

### `PUB-FILTER-002` Multi-category filter uses OR logic

- Preconditions: posts mapped across `technology`, `design`, and `security`.
- Steps: visit `/blog?category=technology,design`.
- Assert:
    - technology and design posts appear
    - unrelated category posts do not appear
- Priority: smoke

### `PUB-FILTER-003` Tag filter works and removable chips update URL

- Preconditions: posts exist for selected tag.
- Steps: apply tag filter, remove active tag chip.
- Assert:
    - filtered results are correct
    - chip disappears
    - URL query removes the tag
    - list resets to expected state
- Priority: regression

### `PUB-FILTER-004` Search combined with taxonomy filter narrows correctly

- Preconditions: same category has multiple posts, only one matching query.
- Steps: search inside category and tag contexts.
- Assert:
    - only posts satisfying both conditions are shown
- Priority: regression

### `PUB-FILTER-005` Search and multi-filter states are non-indexable

- Preconditions: any search result state and multi-filter state.
- Steps: load page source.
- Assert:
    - robots meta indicates noindex where intended
- Priority: regression

### `PUB-FILTER-006` Filter state survives reload and browser navigation

- Preconditions: active category or tag filter.
- Steps: apply filter, reload, navigate back/forward.
- Assert:
    - state is restored from URL
    - visible results remain consistent
- Priority: regression

## 3. Public Taxonomy Pages

### `PUB-TAX-001` Category page loads canonical category content

- Preconditions: published category with description and posts.
- Steps: visit `/blog/category/{slug}`.
- Assert:
    - category title and subtitle render
    - only posts from that category are shown
    - canonical points to `/blog/category/{slug}`
- Priority: smoke

### `PUB-TAX-002` Tag page loads canonical tag content

- Preconditions: published tag with posts.
- Steps: visit `/blog/tag/{slug}`.
- Assert:
    - tag title renders
    - only posts with that tag are shown
    - canonical points to `/blog/tag/{slug}`
- Priority: smoke

### `PUB-TAX-003` Invalid category slug returns 404

- Preconditions: slug does not exist.
- Steps: visit `/blog/category/not-a-real-category`.
- Assert:
    - HTTP 404 or Nuxt error page is shown
    - page does not render a thin empty category page
- Priority: smoke

### `PUB-TAX-004` Invalid tag slug returns 404

- Preconditions: slug does not exist.
- Steps: visit `/blog/tag/not-a-real-tag`.
- Assert:
    - HTTP 404 or Nuxt error page is shown
    - page does not render a thin empty tag page
- Priority: smoke

### `PUB-TAX-005` Category page search stays inside fixed category scope

- Preconditions: category with multiple posts, only one matching query.
- Steps: search from category page.
- Assert:
    - URL remains on `/blog/category/{slug}`
    - results stay within that category
- Priority: regression

### `PUB-TAX-006` Tag page search stays inside fixed tag scope

- Preconditions: tag with multiple posts, only one matching query.
- Steps: search from tag page.
- Assert:
    - URL remains on `/blog/tag/{slug}`
    - results stay within that tag
- Priority: regression

## 4. Public Post Detail

### `PUB-POST-001` Published post detail renders core content

- Preconditions: published post with author, categories, tags, images, and description.
- Steps: visit `/blog/{slug}`.
- Assert:
    - title, description, author, publish date, reading time, and content render
    - hero image renders if present
- Priority: smoke

### `PUB-POST-002` Post detail category and tag navigation works

- Preconditions: post has multiple categories and tags.
- Steps: click each category and tag chip.
- Assert:
    - each link navigates to canonical taxonomy page
- Priority: smoke

### `PUB-POST-003` Breadcrumb shows home > blog > post only

- Preconditions: post belongs to one or more categories.
- Steps: visit post page.
- Assert:
    - breadcrumb contains home and blog
    - breadcrumb does not add category steps unless product explicitly requires that
- Priority: regression

### `PUB-POST-004` Related posts section excludes current post

- Preconditions: related published posts exist through categories or tags.
- Steps: visit post page.
- Assert:
    - related block is visible
    - current post is not included
    - only published posts appear
- Priority: regression

### `PUB-POST-005` Draft, private, pending, scheduled-future, and deleted posts are not public

- Preconditions: posts exist in each non-public lifecycle state.
- Steps: visit each slug directly.
- Assert:
    - each request results in 404 or not-found UI
- Priority: smoke

### `PUB-POST-006` Unsafe HTML is sanitized on public detail page

- Preconditions: post content includes script tag, inline handler, and unsafe URL attempts.
- Steps: visit public post page.
- Assert:
    - malicious scripts do not execute
    - unsafe attributes are not rendered
    - safe formatting still renders
- Priority: smoke

### `PUB-POST-007` Public API response does not expose author email

- Preconditions: published post with author.
- Steps: load detail page and inspect browser network response for `/api/blog/posts/slug/{slug}`.
- Assert:
    - author email is absent from the public payload
- Priority: regression

### `PUB-POST-008` View count behavior is visible and deterministic

- Preconditions: a post with known initial views.
- Steps: visit detail page once, reload.
- Assert:
    - current visible behavior is documented and asserted consistently
    - if views are redesigned later, convert this to unique-view assertions
- Priority: nightly

## 5. Public Author Pages

### `PUB-AUTHOR-001` Author page renders profile and stats

- Preconditions: author has published posts and profile data.
- Steps: visit `/blog/author/{slug}`.
- Assert:
    - author name, avatar, bio, job title, social links, total posts, and featured posts render
- Priority: smoke

### `PUB-AUTHOR-002` Author page lists only that author's published posts

- Preconditions: posts exist for multiple authors and statuses.
- Steps: visit author page.
- Assert:
    - only published posts by that author appear
    - other authors' posts do not appear
- Priority: smoke

### `PUB-AUTHOR-003` Invalid author slug returns 404

- Preconditions: invalid slug.
- Steps: visit `/blog/author/does-not-exist`.
- Assert:
    - proper not-found page is shown
- Priority: regression

## 6. Admin Post Management

### `ADM-POST-001` Admin can create a draft post

- Preconditions: admin logged in.
- Steps: go to `/admin/blog/posts/create`, fill basic fields, submit as draft.
- Assert:
    - success notification appears
    - detail page shows draft status
    - post is not visible on public blog
- Priority: smoke

### `ADM-POST-002` Admin can create a published post with categories, tags, and SEO

- Preconditions: categories and tags exist.
- Steps: create post with description, content, category, tag, SEO fields, and publish status.
- Assert:
    - post is visible on `/blog`
    - taxonomy pages include the post
    - SEO fields appear in page output where relevant
- Priority: smoke

### `ADM-POST-003` Creating without categories attaches the default category

- Preconditions: default category exists.
- Steps: create post without selecting categories.
- Assert:
    - post is saved
    - post is assigned to the default category
- Priority: regression

### `ADM-POST-004` Admin can upload featured image, thumbnail, and attachments

- Preconditions: local fixture files available.
- Steps: create or edit post with file uploads.
- Assert:
    - files render in detail page or attachment section
    - edit page preserves stored files
- Priority: regression

### `ADM-POST-005` Admin can remove uploaded assets

- Preconditions: post has featured image, thumbnail, and attachments.
- Steps: remove each asset and save.
- Assert:
    - removed assets are no longer shown
    - post still saves successfully
- Priority: regression

### `ADM-POST-006` Admin can edit an existing post

- Preconditions: published post exists.
- Steps: edit title, slug, description, content, tags, categories, SEO.
- Assert:
    - changes persist in admin detail
    - public page reflects changes
- Priority: smoke

### `ADM-POST-007` Admin can publish and unpublish a post

- Preconditions: draft post exists.
- Steps: publish the draft, then unpublish it.
- Assert:
    - published post becomes public
    - unpublished post disappears from public surfaces
- Priority: smoke

### `ADM-POST-008` Admin can toggle featured status

- Preconditions: published post exists.
- Steps: toggle featured on and off.
- Assert:
    - featured state persists
    - featured carousel reflects the change after refresh
- Priority: regression

### `ADM-POST-009` Admin can duplicate a post

- Preconditions: published post exists with categories and tags.
- Steps: duplicate from admin.
- Assert:
    - copy is created as draft
    - categories and tags are copied
    - featured flag resets if required by business rule
    - author attribution follows the agreed business rule
- Priority: regression

### `ADM-POST-010` Admin can soft delete and restore a post

- Preconditions: post exists.
- Steps: delete from list/detail, then restore.
- Assert:
    - deleted post disappears from public site
    - restored post reappears according to its lifecycle state
- Priority: smoke

### `ADM-POST-011` Bulk delete works atomically

- Preconditions: multiple posts selected.
- Steps: bulk delete from admin table.
- Assert:
    - selected posts are removed
    - success message reports `affected` correctly
    - no partial mutation occurs on error
- Priority: regression

### `ADM-POST-012` Bulk status update works atomically

- Preconditions: multiple posts selected.
- Steps: bulk change status to draft or published.
- Assert:
    - all selected posts update
    - success message reports `affected` correctly
    - public visibility updates accordingly
- Priority: regression

### `ADM-POST-013` Slug uniqueness and validation errors are shown correctly

- Preconditions: an existing post already owns a slug.
- Steps: attempt create or edit with duplicate slug.
- Assert:
    - save is blocked
    - field error is shown
- Priority: regression

### `ADM-POST-014` Scheduled post validation works

- Preconditions: admin logged in.
- Steps:
    - create scheduled post with future date
    - attempt scheduled post with missing date
    - attempt published post with future date
- Assert:
    - future scheduled post saves
    - missing future date is rejected
    - published + future date is rejected
- Priority: smoke

### `ADM-POST-015` Published-at editing follows business rules

- Preconditions: published post exists.
- Steps: edit published date if UI allows it.
- Assert:
    - backdating and correction work if intended
    - if product forbids editing published date, that rule is explicit in the UI
- Priority: regression

## 7. Admin Category Management

### `ADM-CAT-001` Admin can create a root category

- Preconditions: admin logged in.
- Steps: create category with name, slug, description, sort order.
- Assert:
    - category appears in admin list and public filters if it has posts
- Priority: smoke

### `ADM-CAT-002` Admin can create a child category

- Preconditions: parent category exists.
- Steps: create category with parent.
- Assert:
    - parent-child relationship renders correctly in detail and tree contexts
- Priority: regression

### `ADM-CAT-003` Admin can edit category metadata and SEO

- Preconditions: category exists.
- Steps: update name, slug, description, sort order, featured, SEO.
- Assert:
    - updates persist
    - public category page reflects updates
- Priority: regression

### `ADM-CAT-004` Admin can set a category as default

- Preconditions: another default category already exists.
- Steps: set a different category as default.
- Assert:
    - exactly one category remains default
- Priority: smoke

### `ADM-CAT-005` Default category cannot be deleted

- Preconditions: default category exists.
- Steps: attempt delete from detail or list.
- Assert:
    - action is blocked with clear error
- Priority: smoke

### `ADM-CAT-006` Deleting non-default category reassigns posts and children correctly

- Preconditions: category has posts and child categories.
- Steps: delete category.
- Assert:
    - posts move to default category
    - children move to parent or root according to business rule
    - public discovery still works
- Priority: regression

### `ADM-CAT-007` Bulk delete categories respects default-category rule

- Preconditions: selection includes normal and default categories.
- Steps: bulk delete.
- Assert:
    - default category is protected
    - non-default categories are deleted or reassigned correctly
    - response counts are accurate
- Priority: regression

### `ADM-CAT-008` Category detail page shows accurate posts count and preview

- Preconditions: category with more than 5 posts.
- Steps: visit admin category detail page.
- Assert:
    - `posts_count` is accurate
    - preview shows only latest 5 posts
    - "view all posts" filter link works
- Priority: smoke

### `ADM-CAT-009` Circular parent references are blocked

- Preconditions: parent and child categories exist.
- Steps: attempt to move parent under child.
- Assert:
    - save is rejected
    - hierarchy remains valid
- Priority: regression

### `ADM-CAT-010` Reorder persists and affects public/category sorting where intended

- Preconditions: multiple categories.
- Steps: reorder categories in admin.
- Assert:
    - admin list reflects new order
    - public filter/category ordering reflects business rule
- Priority: nightly

## 8. Admin Tag Management

### `ADM-TAG-001` Admin can create a tag

- Preconditions: admin logged in.
- Steps: create tag with name, slug, description, SEO.
- Assert:
    - tag appears in admin list and public tag flows when attached to posts
- Priority: smoke

### `ADM-TAG-002` Admin can edit a tag

- Preconditions: tag exists.
- Steps: update name, slug, description, SEO.
- Assert:
    - updates persist in admin and public tag page
- Priority: regression

### `ADM-TAG-003` Duplicate tag name and slug are blocked

- Preconditions: tag exists.
- Steps: create or update with duplicate values.
- Assert:
    - validation errors are shown
- Priority: regression

### `ADM-TAG-004` Tag detail page shows accurate posts count and preview

- Preconditions: tag with more than 5 posts.
- Steps: visit admin tag detail page.
- Assert:
    - `posts_count` is accurate
    - preview data is correct
    - "view all posts" link works
- Priority: smoke

### `ADM-TAG-005` Admin can delete and restore a tag

- Preconditions: tag exists.
- Steps: delete then restore.
- Assert:
    - admin flows succeed
    - restored tag reappears
- Priority: smoke

### `ADM-TAG-006` Bulk delete tags reports accurate counts

- Preconditions: multiple tags exist.
- Steps: bulk delete from admin list.
- Assert:
    - success message uses `affected`
    - deleted tags are removed from admin list
- Priority: regression

### `ADM-TAG-007` Delete unused tags only removes tags with zero post relationships

- Preconditions: used and unused tags exist.
- Steps: trigger delete unused.
- Assert:
    - only unused tags are removed
    - response count is accurate
- Priority: regression

## 9. Permissions And Security

### `SEC-001` Guest cannot access any admin blog route

- Preconditions: guest session.
- Steps: visit admin post/category/tag routes.
- Assert:
    - redirected to login or denied
- Priority: smoke

### `SEC-002` Non-admin author can edit only own post

- Preconditions: author A and author B posts exist.
- Steps: log in as author A and attempt actions on both posts.
- Assert:
    - own post actions succeed
    - other author's actions fail
- Priority: smoke

### `SEC-003` Ownership restriction covers all post mutations

- Preconditions: author A and author B posts exist.
- Steps: as author A attempt update, delete, restore, publish, unpublish, toggle featured, duplicate, bulk delete, and bulk status on author B content.
- Assert:
    - all unauthorized mutations are blocked
    - bulk actions fail atomically when mixed ownership is selected
- Priority: smoke

### `SEC-004` Standard post create/update cannot spoof author attribution

- Preconditions: author logged in.
- Steps: attempt create or update with another user's `user_id` via browser-injected payload or direct form manipulation.
- Assert:
    - saved post still belongs to authenticated user
- Priority: regression

### `SEC-005` Category and tag create/update cannot spoof creator attribution

- Preconditions: non-admin or normal admin flow.
- Steps: manipulate request payload to set another user's `user_id`.
- Assert:
    - creator attribution follows server rule, not client input
- Priority: regression

### `SEC-006` Admin post detail sanitizes unsafe HTML

- Preconditions: post content contains malicious HTML.
- Steps: open admin post detail page.
- Assert:
    - script or inline handlers do not execute
    - content remains safely viewable
- Priority: smoke

### `SEC-007` Public content does not leak internal-only user data

- Preconditions: published post and public author profile.
- Steps: inspect blog API responses in the browser network panel or via JS fetch.
- Assert:
    - no internal emails or unnecessary sensitive fields are exposed
- Priority: regression

## 10. SEO, Sitemap, Cache, And Lifecycle

### `SYS-001` Post page emits canonical and structured data correctly

- Preconditions: published post with SEO metadata.
- Steps: visit post detail page and inspect page source.
- Assert:
    - canonical matches post URL
    - article schema is present
    - breadcrumb schema is present
- Priority: regression

### `SYS-002` Blog index canonical behavior matches agreed SEO rules

- Preconditions: default list, single category query, single tag query, multi-filter, and search states.
- Steps: load each state.
- Assert:
    - canonical URL matches agreed canonical route strategy
    - non-indexable states emit correct robots directives
- Priority: regression

### `SYS-003` Category and tag pages are present in sitemap

- Preconditions: published posts, categories, and tags exist.
- Steps: visit sitemap endpoint or frontend sitemap source.
- Assert:
    - published post URLs are present
    - `/blog/category/{slug}` URLs are present
    - `/blog/tag/{slug}` URLs are present
    - sitemap does not silently fall back to a reduced static list
- Priority: smoke

### `SYS-004` XML sitemap endpoint works

- Preconditions: published blog content exists.
- Steps: request `/api/sitemap/xml`.
- Assert:
    - response is 200
    - XML contains published blog URLs
    - no backend fatal error occurs
- Priority: smoke

### `SYS-005` Scheduled publishing becomes public when due

- Preconditions: `scheduled-post-due` and `scheduled-post-future` exist.
- Steps:
    - verify neither is public before promotion
    - run scheduled publish command
    - refresh public pages
- Assert:
    - due scheduled post becomes visible
    - future scheduled post remains hidden
- Priority: regression

### `SYS-006` Featured, recent, and popular widgets react to lifecycle changes

- Preconditions: featured and non-featured posts exist.
- Steps: publish/unpublish/feature/unfeature content, then revisit public pages.
- Assert:
    - lists update correctly after mutation
- Priority: nightly

### `SYS-007` Public caches clear after post changes

- Preconditions: published post exists and is visible publicly.
- Steps: edit title or taxonomy assignment in admin, then revisit public page.
- Assert:
    - updated content appears without stale cached copy
- Priority: smoke

### `SYS-008` Public caches clear after category and tag changes

- Preconditions: published content linked to a category or tag.
- Steps: rename category or tag in admin, then revisit public list/detail/taxonomy pages.
- Assert:
    - public pages reflect new names
    - stale cached names are not shown
- Priority: regression

## 11. Recommended Smoke Subset

This is the minimum release gate.

- `PUB-LIST-001`
- `PUB-LIST-003`
- `PUB-FILTER-001`
- `PUB-TAX-001`
- `PUB-TAX-002`
- `PUB-TAX-003`
- `PUB-TAX-004`
- `PUB-POST-001`
- `PUB-POST-005`
- `PUB-POST-006`
- `PUB-AUTHOR-001`
- `ADM-POST-001`
- `ADM-POST-002`
- `ADM-POST-007`
- `ADM-POST-010`
- `ADM-CAT-001`
- `ADM-CAT-005`
- `ADM-CAT-008`
- `ADM-TAG-001`
- `ADM-TAG-005`
- `SEC-001`
- `SEC-002`
- `SEC-003`
- `SEC-006`
- `SYS-003`
- `SYS-004`
- `SYS-007`

## 12. Known High-Risk Business Rules That Must Stay Covered

These rules are easy to regress and should always remain in the suite.

- Only published posts are public.
- Scheduled posts become public only when due.
- Non-admin users can mutate only their own posts.
- Bulk post mutations fail atomically on unauthorized selections.
- Standard post create/update cannot spoof authorship.
- Category/tag pages must 404 for invalid slugs.
- Public post detail must not leak author email.
- Admin and public post rendering must sanitize unsafe HTML.
- Default category protections must hold.
- Deleting categories must not orphan posts.
- Canonical routes and sitemap URLs must match real pages.
- Public cache invalidation must happen after post/category/tag mutations.

## 13. Implementation Notes

- Prefer factories and `BlogTestHelper` for setup speed and determinism.
- Use Dusk selectors aggressively. Avoid brittle CSS-path selectors.
- Keep admin authentication as a helper because this app uses Nuxt + Sanctum.
- Where possible, assert both browser UI outcome and backend persistence.
- Add browser console capture for SEO and rendering regressions on public pages.
- For security scenarios, keep one browser flow and one network-payload assertion where needed.

## 14. Exit Criteria

The blog E2E suite is considered complete for release gating when:

- smoke coverage is automated and stable
- every critical business rule above has at least one browser test
- public, taxonomy, author, post detail, post admin, category admin, tag admin, permissions, SEO, sitemap, and lifecycle flows are covered
- failures clearly identify whether the regression is public UX, admin workflow, permission logic, lifecycle logic, or SEO/discovery
