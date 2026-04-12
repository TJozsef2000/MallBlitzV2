import { expect, Locator, Page } from "@playwright/test";
import { AdminConfirmationModalComponent } from "../Components/AdminConfirmationModalComponent";
import { AdminDataTableComponent } from "../Components/AdminDataTableComponent";
import { BasePage } from "../../BasePage";

export class BlogPostsPage extends BasePage {
	readonly table: AdminDataTableComponent;
	private readonly deleteConfirmationModal: AdminConfirmationModalComponent;

	protected readonly createPostButton: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.createPostButton = this.page.getByRole("button", { name: "Create Post" });
		this.deleteConfirmationModal = new AdminConfirmationModalComponent(this.page);
		const tableSearchInput = this.page.getByRole("textbox", { name: "Search posts..." });
		const tableRoot = this.page.locator("fieldset").filter({ has: tableSearchInput }).first();
		this.table = new AdminDataTableComponent(this.page, tableRoot, {
			columns: [
				{ key: "id", header: "ID", sortTestId: "datatable-sort-trigger-id" },
				{ key: "thumbnail", header: "Thumbnail" },
				{ key: "title", header: "Title", sortTestId: "datatable-sort-trigger-title" },
				{ key: "categories", header: "Categories" },
				{ key: "status", header: "Status", sortTestId: "datatable-sort-trigger-status" },
				{ key: "featured", header: "Featured", sortTestId: "datatable-sort-trigger-is_featured" },
				{ key: "views", header: "Views", sortTestId: "datatable-sort-trigger-views" },
				{ key: "author", header: "Author" },
				{ key: "published_at", header: "Published Date", sortTestId: "datatable-sort-trigger-published_at" },
			],
			emptyStateTitle: "No posts found",
		});
	}

	async goToPage(): Promise<void> {
		await this.gotoAndWaitForReady("/admin/blog/posts", async () => {
			await this.page.waitForLoadState("networkidle");
			await this.table.waitForIdle();
		});
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/admin\/blog\/posts(?:\?.*)?$/);
	}

	async clickCreatePostButton(): Promise<void> {
		await this.createPostButton.click();
	}

	async searchPost(query: string): Promise<void> {
		await this.table.search(query);
	}

	async verifyPostVisible(title: string): Promise<void> {
		const row = await this.postRow(title);
		await expect(row).toBeVisible();
	}

	async verifyPostAbsent(title: string): Promise<void> {
		await this.table.waitForIdle();
		const row = this.page.locator("tbody tr").filter({ hasText: title });
		await expect(row).toHaveCount(0);
	}

	async verifyPostStatus(title: string, expectedStatus: string): Promise<void> {
		const row = await this.postRow(title);
		await expect(row).toContainText(expectedStatus);
	}

	async openEditForPost(title: string): Promise<void> {
		await this.searchPost(title);
		await this.table.clickRowAction("Title", title, "Edit");
	}

	async publishPost(title: string): Promise<void> {
		await this.searchPost(title);
		await this.table.clickRowAction("Title", title, "Publish");
	}

	async deletePostIfPresent(title: string): Promise<boolean> {
		await this.searchPost(title);

		try {
			await this.postRow(title);
		} catch {
			return false;
		}

		await this.table.clickRowAction("Title", title, "Delete");
		await this.deleteConfirmationModal.confirm({ heading: "Delete Post" });

		await expect
			.poll(async () => {
				try {
					return (await this.postRow(title)).count();
				} catch {
					return 0;
				}
			})
			.toBe(0);

		return true;
	}

	async verifyPostCategory(title: string, category: string): Promise<void> {
		const row = await this.postRow(title);
		await expect(row).toContainText(category);
	}

	async verifyPostFeatured(title: string, expected: "Yes" | "No"): Promise<void> {
		const row = await this.postRow(title);
		// Featured column shows "Yes" or "No"
		await expect(row).toContainText(expected);
	}

	async toggleFeatured(title: string): Promise<void> {
		await this.searchPost(title);
		await this.table.clickRowAction("Title", title, "Toggle Featured");
		await expect(this.page.getByText("Featured status updated successfully")).toBeVisible();
	}

	async duplicatePost(title: string): Promise<void> {
		await this.searchPost(title);
		await this.table.clickRowAction("Title", title, "Duplicate");
		await expect(this.page.getByText("Post duplicated successfully")).toBeVisible();
	}

	async bulkDeleteSelected(): Promise<void> {
		await this.table.clickBulkAction("Delete selected");
		await this.deleteConfirmationModal.confirm();
	}

	async bulkChangeStatus(action: string): Promise<void> {
		await this.table.clickBulkAction(action);
	}

	private async postRow(title: string): Promise<Locator> {
		await this.table.waitForIdle();
		return await this.table.rowByCell("Title", title);
	}
}
