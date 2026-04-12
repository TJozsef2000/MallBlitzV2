import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "../../BasePage";

export class BlogPostCreatePage extends BasePage {
	protected readonly titleField: Locator;
	protected readonly slugField: Locator;
	protected readonly excerptField: Locator;
	protected readonly statusSelect: Locator;
	protected readonly featuredCheckbox: Locator;
	protected readonly cancelButton: Locator;
	protected readonly createPostButton: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.titleField = this.page.getByLabel("Title *");
		this.slugField = this.page.getByLabel("Slug", { exact: true });
		this.excerptField = this.page.getByPlaceholder("Enter post excerpt");
		this.statusSelect = this.page.locator("select");
		this.featuredCheckbox = this.page.getByLabel("Mark as featured post");
		this.cancelButton = this.page.getByRole("button", { name: "Cancel" });
		this.createPostButton = this.page.getByRole("button", { name: "Create Post" });
	}

	async goToPage(): Promise<void> {
		await this.gotoAndWaitForReady("/admin/blog/posts/create", async () => {
			await this.page.waitForLoadState("networkidle");
			await expect(this.titleField).toBeEditable();
		});
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL("https://mallblitz.com/admin/blog/posts/create");
	}

	async fillTitle(title: string): Promise<void> {
		await this.titleField.fill(title);
	}

	async fillSlug(slug: string): Promise<void> {
		await this.slugField.fill(slug);
	}

	async fillExcerpt(excerpt: string): Promise<void> {
		await this.excerptField.fill(excerpt);
	}

	async fillContent(content: string): Promise<void> {
		const editor = this.page.locator(".ProseMirror, [contenteditable='true']").first();
		await editor.click();
		await this.page.keyboard.type(content);
	}

	async selectStatus(
		status: "published" | "draft" | "pending_release" | "scheduled" | "private",
	): Promise<void> {
		await this.statusSelect.selectOption(status);
	}

	async clickCreatePostButton(): Promise<void> {
		await this.createPostButton.click();
	}

	async submitAndWaitForSuccess(): Promise<void> {
		await Promise.all([
			this.page.waitForURL(/https:\/\/mallblitz\.com\/admin\/blog\/posts\/\d+$/, {
				waitUntil: "domcontentloaded",
			}),
			this.createPostButton.click(),
		]);
	}

	async verifyCreatedSuccessMessage(): Promise<void> {
		await expect(this.page.getByText("Post created successfully")).toBeVisible();
	}

	async verifySlugDuplicateError(): Promise<void> {
		await expect(this.page.getByText(/already in use/i).first()).toBeVisible();
	}
}
