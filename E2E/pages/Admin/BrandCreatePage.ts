import { expect, Locator, Page, Response } from "@playwright/test";
import { BasePage } from "../BasePage";

type BrandStatus = "Published" | "Draft";

export class BrandCreatePage extends BasePage {
	protected readonly brandNameField: Locator;
	protected readonly brandNameErrorMessage: Locator;
	protected readonly statusDropdown: Locator;
	protected readonly descriptionField: Locator;
	protected readonly websiteUrlField: Locator;
	protected readonly websiteUrlErrorMessage: Locator;
	protected readonly sortOrderField: Locator;
	protected readonly sortOrderErrorMessage: Locator;
	protected readonly featuredBrandToggle: Locator;
	protected readonly logoFileInput: Locator;
	protected readonly cancelButton: Locator;
	protected readonly createBrandButton: Locator;
	protected readonly successToast: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.brandNameField = this.page.getByRole("textbox", { name: "Brand Name *" });
		this.brandNameErrorMessage = this.page.getByText("Brand name is required");
		this.statusDropdown = this.page.getByRole("combobox");
		this.descriptionField = this.page.getByRole("textbox", { name: "Enter brand description" });
		this.websiteUrlField = this.page.getByRole("textbox", { name: "Website URL" });
		this.websiteUrlErrorMessage = this.page.getByText(
			"Please enter a valid URL starting with http:// or https://",
		);
		this.sortOrderField = this.page.getByRole("spinbutton", { name: "Sort Order" });
		this.sortOrderErrorMessage = this.page.getByText("Sort order must be 0 or greater");
		this.featuredBrandToggle = this.page.getByRole("switch", { name: "Toggle switch" });
		this.logoFileInput = this.page.locator('input[type="file"]');
		this.cancelButton = this.page.getByRole("button", { name: "Cancel" });
		this.createBrandButton = this.page.getByRole("button", { name: "Create Brand" });
		this.successToast = this.page.getByText("Brand created successfully");
	}

	async goToPage(): Promise<void> {
		await this.gotoAndWaitForReady("/admin/products/brands/create", async () => {
			// This Nuxt form can still reset fields until the initial client-side requests settle.
			await this.page.waitForLoadState("networkidle");
			await expect(this.brandNameField).toBeEditable();
			await expect(this.createBrandButton).toBeDisabled();
		});
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL("https://mallblitz.com/admin/products/brands/create");
	}

	async fillBrandName(name: string): Promise<void> {
		await this.brandNameField.fill(name);
	}

	async fillDescription(description: string): Promise<void> {
		await this.descriptionField.fill(description);
	}

	async fillWebsiteUrl(url: string): Promise<void> {
		await this.websiteUrlField.fill(url);
	}

	async fillSortOrder(order: string): Promise<void> {
		await this.sortOrderField.fill(order);
	}

	async selectStatus(status: BrandStatus): Promise<void> {
		await this.statusDropdown.selectOption({ label: status });
	}

	async clickFeaturedBrandToggle(): Promise<void> {
		await this.featuredBrandToggle.click();
	}

	async uploadBrandLogo(filePath: string): Promise<void> {
		await this.logoFileInput.setInputFiles(filePath);
	}

	async clickCancelButton(): Promise<void> {
		await this.cancelButton.click();
	}

	async clickCreateBrandButton(): Promise<void> {
		await this.createBrandButton.click();
	}

	async submitAndWaitForSuccess(): Promise<void> {
		await Promise.all([
			this.page.waitForURL(/https:\/\/mallblitz\.com\/admin\/products\/brands(\/\d+)?$/, {
				waitUntil: "domcontentloaded",
			}),
			this.createBrandButton.click(),
		]);
	}

	async submitAndWaitForCreateResponse(): Promise<Response> {
		const createResponse = this.page.waitForResponse(
			(response) =>
				response.url().includes("/api/ecommerce/brands") && response.request().method() === "POST",
		);
		await this.createBrandButton.click();
		return await createResponse;
	}

	async verifyCreateButtonDisabled(): Promise<void> {
		await expect(this.createBrandButton).toBeDisabled();
	}

	async verifyCreateButtonEnabled(): Promise<void> {
		await expect(this.createBrandButton).toBeEnabled();
	}

	async verifyBrandNameRequiredError(): Promise<void> {
		await expect(this.brandNameErrorMessage).toBeVisible();
	}

	async verifyInvalidWebsiteUrlError(): Promise<void> {
		await expect(this.websiteUrlErrorMessage).toBeVisible();
	}

	async verifyInvalidSortOrderError(): Promise<void> {
		await expect(this.sortOrderErrorMessage).toBeVisible();
	}

	async verifyDuplicateBrandError(): Promise<void> {
		await expect(this.page.getByText("A brand with this name already exists.")).toBeVisible();
	}

	async verifyInvalidLogoError(message = "Logo must be an image file"): Promise<void> {
		await expect(this.page.getByText(message, { exact: false })).toBeVisible();
	}

	async verifyUploadedLogoFileName(fileName: string): Promise<void> {
		await expect(this.page.getByText(fileName, { exact: true })).toBeVisible();
	}

	async verifyCreatedSuccessMessage(): Promise<void> {
		await expect(this.successToast).toBeVisible();
	}
}
