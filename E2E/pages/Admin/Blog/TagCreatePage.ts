import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "../../BasePage";

export class TagCreatePage extends BasePage {
	protected readonly tagNameField: Locator;
	protected readonly slugField: Locator;
	protected readonly descriptionField: Locator;
	protected readonly cancelButton: Locator;
	protected readonly createTagButton: Locator;
	protected readonly successToast: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.tagNameField = this.page.getByLabel("Tag Name *");
		this.slugField = this.page.getByLabel("Slug", { exact: true });
		this.descriptionField = this.page.getByPlaceholder("Enter tag description");
		this.cancelButton = this.page.getByRole("button", { name: "Cancel" });
		this.createTagButton = this.page.getByRole("button", { name: "Create Tag" });
		this.successToast = this.page.getByText("Tag created successfully");
	}

	async goToPage(): Promise<void> {
		await this.gotoAndWaitForReady("/admin/blog/tags/create", async () => {
			await this.page.waitForLoadState("networkidle");
			await expect(this.tagNameField).toBeEditable();
		});
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL("https://mallblitz.com/admin/blog/tags/create");
	}

	async fillTagName(name: string): Promise<void> {
		await this.tagNameField.fill(name);
	}

	async fillSlug(slug: string): Promise<void> {
		await this.slugField.fill(slug);
	}

	async fillDescription(description: string): Promise<void> {
		await this.descriptionField.fill(description);
	}

	async clickCancelButton(): Promise<void> {
		await this.cancelButton.click();
	}

	async clickCreateTagButton(): Promise<void> {
		await this.createTagButton.click();
	}

	async submitAndWaitForSuccess(): Promise<void> {
		await Promise.all([
			this.page.waitForURL(/https:\/\/mallblitz\.com\/admin\/blog\/tags(\/\d+)?$/, {
				waitUntil: "domcontentloaded",
			}),
			this.createTagButton.click(),
		]);
	}

	async verifyCreatedSuccessMessage(): Promise<void> {
		await expect(this.successToast).toBeVisible();
	}

	async verifyDuplicateTagError(): Promise<void> {
		await expect(
			this.page.getByText(/already in use|already exists|has already been taken/i).first(),
		).toBeVisible();
	}
}
