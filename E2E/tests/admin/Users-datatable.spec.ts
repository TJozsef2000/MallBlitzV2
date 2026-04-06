import { adminTest as test, expect } from "../../fixtures/pomManager";
import { testUserData } from "../../helpers/env.helper";
import { FilterSelectField, FilterSelectOperator } from "../../pages/Admin/Users/UsersPage";

test.describe("Users datatable coverage", () => {
	const presetUserEmail = testUserData.email;
	const presetUserName = testUserData.fullName;

	test.beforeEach(async ({ pomManager }) => {
		await pomManager.usersPage.goToPage();
		await pomManager.usersPage.verifyPage();
		await pomManager.usersPage.table.waitForIdle();
		await pomManager.usersPage.table.expectRowCount(10);
	});

	test("Render headers and default rows", async ({ pomManager }) => {
		await pomManager.usersPage.table.expectHeaders([
			"ID",
			"User",
			"Email",
			"Status",
			"Role",
			"Joined",
			"Actions",
		]);
		await pomManager.usersPage.table.expectRowCount(10);
	});

	test("Search, clear, and sort rows", async ({ pomManager }) => {
		await pomManager.usersPage.table.search(presetUserName);
		await pomManager.usersPage.table.expectRowCount(1);

		const row = await pomManager.usersPage.table.rowByCell("Email", presetUserEmail);
		await expect(row).toBeVisible();

		await pomManager.usersPage.table.clearSearch();
		await pomManager.usersPage.table.expectRowCount(10);

		await pomManager.usersPage.table.sortBy("ID", "asc");
		await pomManager.usersPage.table.expectColumnOrdered("ID", "asc", (value) => Number(value));

		await pomManager.usersPage.table.sortBy("ID", "desc");
		await pomManager.usersPage.table.expectColumnOrdered("ID", "desc", (value) => Number(value));
	});

	test("Checkbox and row action clicks do not navigate but row click does", async ({ page, pomManager }) => {
		const startUrl = page.url();
		const [visibleEmail] = await pomManager.usersPage.table.visibleRowCellValues("Email");
		expect(visibleEmail).toBeTruthy();

		await pomManager.usersPage.table.selectRow("Email", visibleEmail);
		await expect(page).toHaveURL(startUrl);

		await pomManager.usersPage.table.openRowActions("Email", visibleEmail);
		await expect(page).toHaveURL(startUrl);
		await pomManager.usersPage.table.expectRowActionState("Email", visibleEmail, {
			action: "View",
			enabled: true,
		});

		await pomManager.usersPage.table.clickRow("Email", visibleEmail);
		await expect(page).toHaveURL(/\/admin\/users\/\d+$/);
	});

	test("Bulk actions, filter rules, and restoration work", async ({ pomManager }) => {
		const [visibleEmail] = await pomManager.usersPage.table.visibleRowCellValues("Email");
		expect(visibleEmail).toBeTruthy();

		await pomManager.usersPage.table.expectSelectedCount(0);
		await pomManager.usersPage.table.expectBulkActionState({ action: "Mark as Verified", enabled: false });
		await pomManager.usersPage.table.expectBulkActionState({ action: "Mark as Unverified", enabled: false });
		await pomManager.usersPage.table.expectBulkActionState({ action: "Delete Selected", enabled: false });

		await pomManager.usersPage.table.selectRow("Email", visibleEmail);
		await pomManager.usersPage.table.expectSelectedCount(1);
		await pomManager.usersPage.table.expectBulkActionState({ action: "Mark as Verified", enabled: true });
		await pomManager.usersPage.table.expectBulkActionState({ action: "Mark as Unverified", enabled: true });
		await pomManager.usersPage.table.expectBulkActionState({ action: "Delete Selected", enabled: true });

		const modal = await pomManager.usersPage.openFilters();
		await modal.setField(FilterSelectField.Name);
		await modal.expectInputMode("text");
		await modal.setField(FilterSelectField.VerificationStatus);
		await modal.expectInputMode("none");
		await modal.setField(FilterSelectField.CreatedDate);
		await modal.expectInputMode("range-date");

		await modal.setField(FilterSelectField.Name);
		await modal.setOperator(FilterSelectOperator.Contains);
		await modal.setValue(presetUserName);
		await modal.apply();
		await pomManager.usersPage.table.expectRowCount(1);
		await expect(await pomManager.usersPage.table.rowByCell("Email", presetUserEmail)).toBeVisible();

		const restoredModal = await pomManager.usersPage.openFilters();
		await restoredModal.expectRuleRestored({
			field: FilterSelectField.Name,
			operator: FilterSelectOperator.Contains,
			value: presetUserName,
		});
		await restoredModal.clear();
		await pomManager.usersPage.table.expectRowCount(10);
	});

	test("Columns, refresh, and pagination controls behave correctly", async ({ pomManager }) => {
		const initialPagination = await pomManager.usersPage.table.paginationSnapshot();
		const totalUsers = initialPagination.total;

		await pomManager.usersPage.table.expectColumnVisible("Email", true);
		await pomManager.usersPage.table.toggleColumnVisibility("Email", false);
		await pomManager.usersPage.table.expectColumnVisible("Email", false);
		await pomManager.usersPage.table.toggleColumnVisibility("Email", true);
		await pomManager.usersPage.table.expectColumnVisible("Email", true);
		await pomManager.usersPage.table.expectColumnVisibilityToggleDisabled("ID");

		await pomManager.usersPage.table.refresh();
		await pomManager.usersPage.table.setRowsPerPage(25);
		await pomManager.usersPage.table.expectRowCount(Math.min(25, totalUsers));
		await pomManager.usersPage.table.expectPagination({
			rangeText: `Show 1 to ${Math.min(25, totalUsers)} of ${totalUsers} records`,
			pageText: `Page 1 of ${Math.max(1, Math.ceil(totalUsers / 25))}`,
		});

		await pomManager.usersPage.table.setRowsPerPage(10);
		await pomManager.usersPage.table.expectPagination({
			rangeText: `Show 1 to ${Math.min(10, totalUsers)} of ${totalUsers} records`,
			pageText: `Page 1 of ${Math.max(1, Math.ceil(totalUsers / 10))}`,
		});

		if (totalUsers > 10) {
			await pomManager.usersPage.table.goToNextPage();
			await pomManager.usersPage.table.expectPagination({
				rangeText: `Show 11 to ${Math.min(20, totalUsers)} of ${totalUsers} records`,
				pageText: `Page 2 of ${Math.ceil(totalUsers / 10)}`,
			});
			await pomManager.usersPage.table.goToPreviousPage();
			await pomManager.usersPage.table.expectPagination({
				rangeText: `Show 1 to ${Math.min(10, totalUsers)} of ${totalUsers} records`,
				pageText: `Page 1 of ${Math.max(1, Math.ceil(totalUsers / 10))}`,
			});
		}
	});
});
