import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "../../BasePage";

export class TagEditPage extends BasePage {
	protected readonly tagNameField: Locator;
	protected readonly slugField: Locator;
	protected readonly descriptionField: Locator;
	protected readonly cancelButton: Locator;
	protected readonly updateTagButton: Locator;
	protected readonly successToast: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.tagNameField = this.page.getByLabel("Tag Name *");
		this.slugField = this.page.getByLabel("Slug", { exact: true });
		this.descriptionField = this.page.getByPlaceholder("Enter tag description");
		this.cancelButton = this.page.getByRole("button", { name: "Cancel" });
		this.updateTagButton = this.page.getByRole("button", { name: /Update Tag|Save/i });
		this.successToast = this.page.getByText("Tag updated successfully");
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/admin\/blog\/tags\/\d+\/edit/);
		await expect(this.tagNameField).toBeEditable();
	}

	async fillTagName(name: string): Promise<void> {
		await this.tagNameField.fill(name);
	}

	async fillDescription(description: string): Promise<void> {
		await this.descriptionField.fill(description);
	}

	async expectTagNameValue(name: string): Promise<void> {
		await expect(this.tagNameField).toHaveValue(name);
	}

	async submitAndWaitForSuccess(): Promise<void> {
		await Promise.all([
			this.page.waitForURL(/https:\/\/mallblitz\.com\/admin\/blog\/tags(\/\d+)?$/, {
				waitUntil: "domcontentloaded",
			}),
			this.updateTagButton.click(),
		]);
	}

	async verifyUpdatedSuccessMessage(): Promise<void> {
		await expect(this.successToast).toBeVisible();
	}
}
