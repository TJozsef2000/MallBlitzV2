import { expect, Locator, Page } from "@playwright/test";
import { AdminConfirmationModalComponent } from "../Components/AdminConfirmationModalComponent";
import { AdminDataTableComponent } from "../Components/AdminDataTableComponent";
import { BasePage } from "../../BasePage";

interface CategoryRowExpectations {
	slug?: string;
	parent?: string;
	posts?: string;
	sortOrder?: string;
}

export class BlogCategoriesPage extends BasePage {
	readonly table: AdminDataTableComponent;
	private readonly deleteConfirmationModal: AdminConfirmationModalComponent;

	protected readonly addCategoryButton: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.addCategoryButton = this.page.getByRole("button", { name: "Add Category" });
		this.deleteConfirmationModal = new AdminConfirmationModalComponent(this.page);
		const tableSearchInput = this.page.getByRole("textbox", { name: "Search categories..." });
		const tableRoot = this.page.locator("fieldset").filter({ has: tableSearchInput }).first();
		this.table = new AdminDataTableComponent(this.page, tableRoot, {
			columns: [
				{ key: "id", header: "ID", sortTestId: "datatable-sort-trigger-id" },
				{ key: "name", header: "Name", sortTestId: "datatable-sort-trigger-name" },
				{ key: "slug", header: "Slug", sortTestId: "datatable-sort-trigger-slug" },
				{ key: "parent", header: "Parent Category" },
				{ key: "posts_count", header: "Posts", sortTestId: "datatable-sort-trigger-posts_count" },
				{ key: "featured", header: "Featured" },
				{ key: "default", header: "Default" },
				{ key: "sort_order", header: "Sort Order", sortTestId: "datatable-sort-trigger-sort_order" },
				{ key: "created_at", header: "Created at", sortTestId: "datatable-sort-trigger-created_at" },
			],
			emptyStateTitle: "No categories found",
		});
	}

	async goToPage(): Promise<void> {
		await this.gotoAndWaitForReady("/admin/blog/categories", async () => {
			await this.page.waitForLoadState("networkidle");
			await this.table.waitForIdle();
		});
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/admin\/blog\/categories(?:\?.*)?$/);
	}

	async clickAddCategoryButton(): Promise<void> {
		await this.addCategoryButton.click();
	}

	async searchCategory(query: string): Promise<void> {
		await this.table.search(query);
	}

	async verifyCategoryVisible(name: string): Promise<void> {
		const row = await this.categoryRow(name);
		await expect(row).toBeVisible();
	}

	async verifyCategoryRowValues(name: string, expected: CategoryRowExpectations): Promise<void> {
		const row = await this.categoryRow(name);
		await expect(row).toContainText(name);

		if (expected.slug) {
			await expect(row).toContainText(expected.slug);
		}

		if (expected.parent) {
			await expect(row).toContainText(expected.parent);
		}

		if (expected.posts) {
			await expect(row).toContainText(expected.posts);
		}

		if (expected.sortOrder) {
			await expect(row).toContainText(expected.sortOrder);
		}
	}

	async verifyNoCategoriesFound(): Promise<void> {
		await this.table.expectEmptyState();
	}

	async verifyCategoryAbsent(name: string): Promise<void> {
		await this.table.waitForIdle();
		const row = this.page.locator("tbody tr").filter({ hasText: name });
		await expect(row).toHaveCount(0);
	}

	async openEditForCategory(name: string): Promise<void> {
		await this.searchCategory(name);
		await this.table.clickRowAction("Name", name, "Edit");
	}

	async verifyCategoryIsDefault(name: string): Promise<void> {
		await this.searchCategory(name);
		const row = await this.categoryRow(name);
		await expect(row).toContainText("Default");
	}

	async verifyCategoryIsNotDefault(name: string): Promise<void> {
		await this.searchCategory(name);
		const row = await this.categoryRow(name);
		// Default column shows literal "Default" badge or "-" placeholder for non-default
		await expect(row).not.toContainText(/\bDefault\b/);
	}

	async deleteCategoryIfPresent(name: string): Promise<boolean> {
		await this.searchCategory(name);

		try {
			await this.categoryRow(name);
		} catch {
			return false;
		}

		await this.table.clickRowAction("Name", name, "Delete");
		await this.deleteConfirmationModal.confirm({ heading: "Delete Category" });

		await expect
			.poll(async () => {
				try {
					return (await this.categoryRow(name)).count();
				} catch {
					return 0;
				}
			})
			.toBe(0);

		return true;
	}

	async attemptDeleteDefaultCategory(name: string): Promise<void> {
		await this.searchCategory(name);
		await this.table.clickRowAction("Name", name, "Delete");
		await this.deleteConfirmationModal.confirm({ heading: "Delete Category", waitForClose: false });
	}

	async verifyDefaultCategoryProtectionError(): Promise<void> {
		await expect(this.page.getByText("Cannot delete the default category")).toBeVisible();
	}

	async getPostsCountFromRow(name: string): Promise<number> {
		const row = await this.categoryRow(name);
		const cells = row.locator("td");
		// Columns: checkbox, ID, Name, Slug, Parent, Posts, Featured, Default, Sort Order, Created at, Actions
		// "Posts" is index 5 (0-based) when checkbox column is present.
		const postsCellText = (await cells.nth(5).innerText()).trim();
		const parsed = Number.parseInt(postsCellText, 10);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	async openViewForCategory(name: string): Promise<void> {
		await this.searchCategory(name);
		await this.table.clickRowAction("Name", name, "View");
	}

	async selectCategoryRow(name: string): Promise<void> {
		await this.table.selectRow("Name", name);
	}

	async bulkDeleteSelected(): Promise<void> {
		await this.table.clickBulkAction("Delete selected");
		await this.deleteConfirmationModal.confirm();
	}

	private async categoryRow(name: string): Promise<Locator> {
		await this.table.waitForIdle();
		return await this.table.rowByCell("Name", name);
	}
}
