import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "../../BasePage";

export class BlogCategoryEditPage extends BasePage {
	protected readonly nameField: Locator;
	protected readonly slugField: Locator;
	protected readonly descriptionField: Locator;
	protected readonly sortOrderField: Locator;
	protected readonly defaultCategoryCheckbox: Locator;
	protected readonly featuredCheckbox: Locator;
	protected readonly cancelButton: Locator;
	protected readonly updateCategoryButton: Locator;
	protected readonly successToast: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.nameField = this.page.getByLabel("Category Name *");
		this.slugField = this.page.getByLabel("Slug", { exact: true });
		this.descriptionField = this.page.getByPlaceholder("Enter category description");
		this.sortOrderField = this.page.getByLabel("Sort Order", { exact: true });
		this.defaultCategoryCheckbox = this.page.getByLabel("Set as default category");
		this.featuredCheckbox = this.page.getByLabel("Mark as featured category");
		this.cancelButton = this.page.getByRole("button", { name: "Cancel" });
		this.updateCategoryButton = this.page.getByRole("button", { name: "Update Category" });
		this.successToast = this.page.getByText("Category updated successfully");
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/admin\/blog\/categories\/\d+\/edit/);
		await expect(this.nameField).toBeEditable();
	}

	async expectNameValue(name: string): Promise<void> {
		await expect(this.nameField).toHaveValue(name);
	}

	async fillName(name: string): Promise<void> {
		await this.nameField.fill(name);
	}

	async fillDescription(description: string): Promise<void> {
		await this.descriptionField.fill(description);
	}

	async fillSortOrder(sortOrder: string): Promise<void> {
		await this.sortOrderField.fill(sortOrder);
	}

	async setAsDefault(): Promise<void> {
		if (!(await this.defaultCategoryCheckbox.isChecked())) {
			await this.defaultCategoryCheckbox.check();
		}
	}

	async expectIsDefault(checked: boolean): Promise<void> {
		if (checked) {
			await expect(this.defaultCategoryCheckbox).toBeChecked();
		} else {
			await expect(this.defaultCategoryCheckbox).not.toBeChecked();
		}
	}

	async submitAndWaitForSuccess(): Promise<void> {
		await Promise.all([
			this.page.waitForURL(/https:\/\/mallblitz\.com\/admin\/blog\/categories(\/\d+)?$/, {
				waitUntil: "domcontentloaded",
			}),
			this.updateCategoryButton.click(),
		]);
	}

	async setParent(parentLabel: string): Promise<void> {
		await this.page.locator("select").first().selectOption({ label: parentLabel });
	}

	async submitExpectingValidationError(): Promise<void> {
		await this.updateCategoryButton.click();
	}

	async verifyCircularParentError(): Promise<void> {
		await expect(
			this.page.getByText("Cannot set parent: would create circular reference").first(),
		).toBeVisible();
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/admin\/blog\/categories\/\d+\/edit/);
	}
}
