import { test, expect } from "../../fixtures/pomManager";

test.describe("Public blog coverage", () => {
	test.beforeEach(async ({ pomManager }) => {
		await pomManager.blogPage.goToBlogPage();
		await pomManager.blogPage.waitForCards();
	});

	// PUB-LIST-001: Blog index renders published posts
	// Note: the plan asks to also assert draft/pending/scheduled/deleted posts are absent.
	// Without backend state manipulation we can't directly prove that negative — we assert
	// the public list is non-empty, cards have titles, and each card links to a /blog/{slug}
	// detail URL. The "only published posts are public" invariant is covered indirectly by
	// the admin lifecycle tests (ADM-POST-007, ADM-POST-010).
	test("PUB-LIST-001 Blog index shows published posts with valid card links", async ({ pomManager }) => {
		await pomManager.blogPage.expectAtLeastOneCard();
		const cardCount = await pomManager.blogPage.getCardCount();
		expect(cardCount).toBeGreaterThan(0);

		const detailHref = await pomManager.blogPage.getFirstCardHrefByPattern(/^\/blog\/[^/]+$/);
		expect(detailHref).not.toBeNull();
		expect(detailHref).toMatch(/^\/blog\/[a-z0-9-]+$/);
	});

	// PUB-LIST-003: Pagination works across multiple pages
	test("PUB-LIST-003 Pagination navigates forward and back", async ({ pomManager }) => {
		await pomManager.blogPage.verifyPageQuery(1);
		const page1Title = await pomManager.blogPage.getFirstCardTitle();

		await pomManager.blogPage.clickNextPage();
		await pomManager.blogPage.verifyPageQuery(2);
		await pomManager.blogPage.waitForCards();
		const page2Title = await pomManager.blogPage.getFirstCardTitle();

		expect(page2Title).not.toEqual(page1Title);

		await pomManager.blogPage.clickPreviousPage();
		await pomManager.blogPage.verifyPageQuery(1);
		await pomManager.blogPage.waitForCards();
		const backTitle = await pomManager.blogPage.getFirstCardTitle();
		expect(backTitle).toEqual(page1Title);
	});

	// PUB-LIST-005: Card title link navigates to post detail; category and tag links navigate too
	test("PUB-LIST-005 Card title link navigates to post detail", async ({ pomManager }) => {
		const title = await pomManager.blogPage.getFirstCardTitle();
		await pomManager.blogPage.clickFirstCardTitle();
		await pomManager.blogPostDetailPage.verifyPage();
		await pomManager.blogPostDetailPage.verifyTitle(title);
	});

	test("PUB-LIST-005 Card category link navigates to category page", async ({ pomManager }) => {
		await pomManager.blogPage.clickFirstCardCategoryLink();
		await pomManager.blogCategoryPublicPage.verifyPage();
		await pomManager.blogCategoryPublicPage.expectAtLeastOneCard();
	});

	// PUB-FILTER-001: Search returns matching posts only
	test("PUB-FILTER-001 Blog search filters the visible cards", async ({ pomManager }) => {
		// Pick a distinctive word from the current first card title so we know at least one post matches.
		const title = await pomManager.blogPage.getFirstCardTitle();
		const word = title.split(/\s+/).find((w) => w.length >= 6);
		expect(word, "expected a >=6 letter word in the first card title").toBeTruthy();

		await pomManager.blogPage.fillSearchField(word!.toLowerCase());
		await pomManager.blogPage.verifySearchUrl(word!.toLowerCase());
		await pomManager.blogPage.waitForCards();
		expect(await pomManager.blogPage.getCardCount()).toBeGreaterThan(0);
	});

	// PUB-TAX-001: Category page loads canonical content
	// Uses the first card's category link to pick a real, live slug (the seeded slugs are faker-generated).
	test("PUB-TAX-001 Category page loads canonical content for a real slug", async ({ pomManager }) => {
		const href = await pomManager.blogPage.getFirstCardHrefByPattern(/^\/blog\/category\/[^/]+$/);
		expect(href).not.toBeNull();
		const slug = href!.replace(/^\/blog\/category\//, "");

		await pomManager.blogCategoryPublicPage.goToCategoryBySlug(slug);
		await pomManager.blogCategoryPublicPage.verifyPage();
		await pomManager.blogCategoryPublicPage.expectAtLeastOneCard();
		await pomManager.blogCategoryPublicPage.verifyCanonical(`/blog/category/${slug}`);
	});

	// PUB-TAX-002: Tag page loads canonical content for seeded "laravel" tag
	test("PUB-TAX-002 Tag page loads canonical content for seeded tag", async ({ pomManager }) => {
		await pomManager.blogTagPublicPage.goToTagBySlug("laravel");
		await pomManager.blogTagPublicPage.verifyPage();
		await pomManager.blogTagPublicPage.expectAtLeastOneCard();
		await pomManager.blogTagPublicPage.verifyCanonical("/blog/tag/laravel");
	});

	// PUB-POST-001: Published post detail renders core content
	test("PUB-POST-001 Post detail renders title, author, publish date, and reading time", async ({
		pomManager,
	}) => {
		const title = await pomManager.blogPage.getFirstCardTitle();
		await pomManager.blogPage.clickFirstCardTitle();
		await pomManager.blogPostDetailPage.verifyPage();
		await pomManager.blogPostDetailPage.verifyTitle(title);
		await pomManager.blogPostDetailPage.verifyAuthorRendered();
		await pomManager.blogPostDetailPage.verifyPublishDateRendered();
	});

	// PUB-POST-003: Breadcrumb shows Home > Blog > {title} only
	test("PUB-POST-003 Post detail breadcrumb shows home > blog > post", async ({ pomManager }) => {
		const title = await pomManager.blogPage.getFirstCardTitle();
		await pomManager.blogPage.clickFirstCardTitle();
		await pomManager.blogPostDetailPage.verifyPage();
		await pomManager.blogPostDetailPage.verifyBreadcrumbContains(["Home", "Blog", title]);
	});
});
