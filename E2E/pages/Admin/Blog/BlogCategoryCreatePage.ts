import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "../../BasePage";

export class BlogCategoryCreatePage extends BasePage {
	protected readonly nameField: Locator;
	protected readonly slugField: Locator;
	protected readonly descriptionField: Locator;
	protected readonly sortOrderField: Locator;
	protected readonly parentCategorySelect: Locator;
	protected readonly defaultCategoryCheckbox: Locator;
	protected readonly featuredCheckbox: Locator;
	protected readonly cancelButton: Locator;
	protected readonly createCategoryButton: Locator;
	protected readonly successToast: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.nameField = this.page.getByLabel("Category Name *");
		this.slugField = this.page.getByLabel("Slug", { exact: true });
		this.descriptionField = this.page.getByPlaceholder("Enter category description");
		this.sortOrderField = this.page.getByLabel("Sort Order", { exact: true });
		this.parentCategorySelect = this.page.locator("select").first();
		this.defaultCategoryCheckbox = this.page.getByLabel("Set as default category");
		this.featuredCheckbox = this.page.getByLabel("Mark as featured category");
		this.cancelButton = this.page.getByRole("button", { name: "Cancel" });
		this.createCategoryButton = this.page.getByRole("button", { name: "Create Category" });
		this.successToast = this.page.getByText("Category created successfully");
	}

	async goToPage(): Promise<void> {
		await this.gotoAndWaitForReady("/admin/blog/categories/create", async () => {
			await this.page.waitForLoadState("networkidle");
			await expect(this.nameField).toBeEditable();
		});
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL("https://mallblitz.com/admin/blog/categories/create");
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

	async selectParentCategory(parentName: string): Promise<void> {
		await this.parentCategorySelect.selectOption({ label: parentName });
	}

	async setAsDefault(): Promise<void> {
		if (!(await this.defaultCategoryCheckbox.isChecked())) {
			await this.defaultCategoryCheckbox.check();
		}
	}

	async clickCreateCategoryButton(): Promise<void> {
		await this.createCategoryButton.click();
	}

	async submitAndWaitForSuccess(): Promise<void> {
		await Promise.all([
			this.page.waitForURL(/https:\/\/mallblitz\.com\/admin\/blog\/categories(\/\d+)?$/, {
				waitUntil: "domcontentloaded",
			}),
			this.createCategoryButton.click(),
		]);
	}

	async verifyCreatedSuccessMessage(): Promise<void> {
		await expect(this.successToast).toBeVisible();
	}
}
