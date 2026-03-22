import { adminTest as test, expect } from "../../fixtures/pomManager";

test.describe("Brands datatable coverage", () => {
	test.beforeEach(async ({ pomManager }) => {
		await pomManager.brandsPage.goToPage();
		await pomManager.brandsPage.verifyPage();
		await pomManager.brandsPage.table.waitForIdle();
	});

	test("Render the shared toolbar and headers", async ({ page, pomManager }) => {
		await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Filter" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Columns" })).toBeVisible();
		await pomManager.brandsPage.table.expectHeaders([
			"ID",
			"Logo",
			"Brand Name",
			"Website",
			"Status",
			"Featured",
			"Products",
			"Order",
			"Created",
			"Actions",
		]);
	});

	test("Show the empty state when search produces no results", async ({ page, pomManager }) => {
		await pomManager.brandsPage.searchBrand("datatable-empty-brand-query");
		await pomManager.brandsPage.verifyNoBrandsFound();
		await expect(
			page.getByRole("textbox", { name: "Search brands by name or description..." }),
		).toBeVisible();
		await expect(page.getByRole("button", { name: "Filter" })).toBeVisible();
	});

	test("Expose the locked ID column toggle and hide pagination on empty results", async ({ pomManager }) => {
		await pomManager.brandsPage.searchBrand("datatable-empty-brand-query");
		await pomManager.brandsPage.table.expectColumnVisibilityToggleDisabled("ID");
		await pomManager.brandsPage.table.expectPagination({ visible: false });
	});
});
