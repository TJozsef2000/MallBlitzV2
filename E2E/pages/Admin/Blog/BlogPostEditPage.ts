import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "../../BasePage";

export class BlogPostEditPage extends BasePage {
	protected readonly titleField: Locator;
	protected readonly slugField: Locator;
	protected readonly excerptField: Locator;
	protected readonly statusSelect: Locator;
	protected readonly featuredCheckbox: Locator;
	protected readonly cancelButton: Locator;
	protected readonly updatePostButton: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.titleField = this.page.getByLabel("Title *");
		this.slugField = this.page.getByLabel("Slug", { exact: true });
		this.excerptField = this.page.getByPlaceholder("Enter post excerpt");
		this.statusSelect = this.page.locator("select");
		this.featuredCheckbox = this.page.getByLabel("Mark as featured post");
		this.cancelButton = this.page.getByRole("button", { name: "Cancel" });
		this.updatePostButton = this.page.getByRole("button", { name: "Update Post" });
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/admin\/blog\/posts\/\d+\/edit/);
		await expect(this.titleField).toBeEditable();
	}

	async expectTitleValue(title: string): Promise<void> {
		await expect(this.titleField).toHaveValue(title);
	}

	async fillTitle(title: string): Promise<void> {
		await this.titleField.fill(title);
	}

	async fillExcerpt(excerpt: string): Promise<void> {
		await this.excerptField.fill(excerpt);
	}

	async selectStatus(
		status: "published" | "draft" | "pending_release" | "scheduled" | "private",
	): Promise<void> {
		await this.statusSelect.selectOption(status);
	}

	async expectStatus(status: string): Promise<void> {
		await expect(this.statusSelect).toHaveValue(status);
	}

	async submitAndWaitForSuccess(): Promise<void> {
		await Promise.all([
			this.page.waitForURL(/https:\/\/mallblitz\.com\/admin\/blog\/posts(\/\d+)?$/, {
				waitUntil: "domcontentloaded",
			}),
			this.updatePostButton.click(),
		]);
	}
}
