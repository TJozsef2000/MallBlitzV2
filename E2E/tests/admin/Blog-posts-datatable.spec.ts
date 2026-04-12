import { adminTest as test, expect } from "../../fixtures/pomManager";

test.describe("Blog posts datatable coverage", () => {
	test.beforeEach(async ({ pomManager }) => {
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.verifyPage();
		await pomManager.blogPostsPage.table.waitForIdle();
	});

	test("Render toolbar and column headers", async ({ page, pomManager }) => {
		await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Filter" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Columns" })).toBeVisible();
		await pomManager.blogPostsPage.table.expectHeaders([
			"ID",
			"Thumbnail",
			"Title",
			"Categories",
			"Status",
			"Featured",
			"Views",
			"Author",
			"Published Date",
			"Actions",
		]);
	});

	test("Search filters results and empty state shows correctly", async ({ pomManager }) => {
		// Search for something that won't match
		await pomManager.blogPostsPage.searchPost("xyznonexistent999");
		await pomManager.blogPostsPage.table.expectEmptyState();

		// Clear and verify data returns
		await pomManager.blogPostsPage.table.clearSearch();
		await pomManager.blogPostsPage.table.waitForIdle();
		await pomManager.blogPostsPage.table.expectRowCount(10);
	});

	test("Sort by title column", async ({ pomManager }) => {
		await pomManager.blogPostsPage.table.sortBy("Title", "asc");
		await pomManager.blogPostsPage.table.expectColumnOrdered("Title", "asc", (v) => v.toLowerCase());

		await pomManager.blogPostsPage.table.sortBy("Title", "desc");
		await pomManager.blogPostsPage.table.expectColumnOrdered("Title", "desc", (v) => v.toLowerCase());
	});

	test("Pagination controls are visible", async ({ pomManager }) => {
		await pomManager.blogPostsPage.table.expectPagination({ visible: true });
	});

	test("Page size selector changes visible row count", async ({ pomManager }) => {
		// Default is 10 rows per page
		await pomManager.blogPostsPage.table.expectRowCount(10);

		// Change to 25
		await pomManager.blogPostsPage.table.setRowsPerPage(25);
		await pomManager.blogPostsPage.table.waitForIdle();

		// Verify more rows are visible now (seeded data has >10 posts)
		const snapshot = await pomManager.blogPostsPage.table.paginationSnapshot();
		expect(snapshot.end - snapshot.start + 1).toBeGreaterThan(10);
	});
});
