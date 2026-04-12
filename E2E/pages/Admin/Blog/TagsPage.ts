import { expect, Locator, Page } from "@playwright/test";
import { AdminConfirmationModalComponent } from "../Components/AdminConfirmationModalComponent";
import { AdminDataTableComponent } from "../Components/AdminDataTableComponent";
import { BasePage } from "../../BasePage";

interface TagRowExpectations {
	slug?: string;
	posts?: string;
}

export class TagsPage extends BasePage {
	readonly table: AdminDataTableComponent;
	private readonly deleteConfirmationModal: AdminConfirmationModalComponent;

	protected readonly addTagButton: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.addTagButton = this.page.getByRole("button", { name: "Create Tag" });
		this.deleteConfirmationModal = new AdminConfirmationModalComponent(this.page);
		const tableSearchInput = this.page.getByRole("textbox", { name: "Search tags..." });
		const tableRoot = this.page.locator("fieldset").filter({ has: tableSearchInput }).first();
		this.table = new AdminDataTableComponent(this.page, tableRoot, {
			columns: [
				{ key: "id", header: "ID", sortTestId: "datatable-sort-trigger-id" },
				{ key: "name", header: "Name", sortTestId: "datatable-sort-trigger-name" },
				{ key: "slug", header: "Slug", sortTestId: "datatable-sort-trigger-slug" },
				{ key: "posts_count", header: "Posts", sortTestId: "datatable-sort-trigger-posts_count" },
				{ key: "created_at", header: "Created at", sortTestId: "datatable-sort-trigger-created_at" },
			],
			emptyStateTitle: "No tags found",
		});
	}

	async goToPage(): Promise<void> {
		await this.gotoAndWaitForReady("/admin/blog/tags", async () => {
			await this.page.waitForLoadState("networkidle");
			await this.table.waitForIdle();
		});
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/admin\/blog\/tags(?:\?.*)?$/);
	}

	async clickAddTagButton(): Promise<void> {
		await this.addTagButton.click();
	}

	async searchTag(query: string): Promise<void> {
		await this.table.search(query);
	}

	async verifyTagVisible(name: string): Promise<void> {
		const row = await this.tagRow(name);
		await expect(row).toBeVisible();
	}

	async verifyTagRowValues(name: string, expected: TagRowExpectations): Promise<void> {
		const row = await this.tagRow(name);
		await expect(row).toContainText(name);

		if (expected.slug) {
			await expect(row).toContainText(expected.slug);
		}

		if (expected.posts) {
			await expect(row).toContainText(expected.posts);
		}
	}

	async verifyNoTagsFound(): Promise<void> {
		await this.table.expectEmptyState();
	}

	async openEditForTag(name: string): Promise<void> {
		await this.searchTag(name);
		await this.table.clickRowAction("Name", name, "Edit");
	}

	async deleteTagIfPresent(name: string): Promise<boolean> {
		await this.searchTag(name);

		try {
			await this.tagRow(name);
		} catch {
			return false;
		}

		await this.table.clickRowAction("Name", name, "Delete");
		await this.deleteConfirmationModal.confirm({ heading: "Delete Tag" });

		await expect
			.poll(async () => {
				try {
					return (await this.tagRow(name)).count();
				} catch {
					return 0;
				}
			})
			.toBe(0);

		return true;
	}

	async getPostsCountFromRow(name: string): Promise<number> {
		const row = await this.tagRow(name);
		const cells = row.locator("td");
		// Columns: checkbox, ID, Name, Slug, Posts, Created at, Actions
		// "Posts" is index 4 (0-based)
		const postsCellText = (await cells.nth(4).innerText()).trim();
		const parsed = Number.parseInt(postsCellText, 10);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	async openViewForTag(name: string): Promise<void> {
		await this.searchTag(name);
		await this.table.clickRowAction("Name", name, "View");
	}

	async selectTagRow(name: string): Promise<void> {
		await this.table.selectRow("Name", name);
	}

	async bulkDeleteSelected(): Promise<void> {
		await this.table.clickBulkAction("Delete selected");
		await this.deleteConfirmationModal.confirm();
	}

	private async tagRow(name: string): Promise<Locator> {
		await this.table.waitForIdle();
		return await this.table.rowByCell("Name", name);
	}
}
