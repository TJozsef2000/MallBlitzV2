import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "../BasePage";

type BrandRowExpectations = {
	status?: string;
	featured?: string;
	website?: string;
	order?: string;
};

export class BrandsPage extends BasePage {
	protected readonly searchField: Locator;
	protected readonly addBrandButton: Locator;
	protected readonly table: Locator;
	protected readonly loadingMessage: Locator;
	protected readonly noBrandsFoundMessage: Locator;
	protected readonly deleteButton: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.searchField = this.page.getByRole("textbox", { name: "Search brands by name or description..." });
		this.addBrandButton = this.page.getByRole("button", { name: "Add Brand" });
		this.table = this.page.getByRole("table");
		this.loadingMessage = this.page.getByText("Loading...");
		this.noBrandsFoundMessage = this.page.getByText("No brands found");
		this.deleteButton = this.page.getByRole("button", { name: "Delete" });
	}

	async goToPage(): Promise<void> {
		await this.page.goto("/admin/products/brands", { waitUntil: "domcontentloaded" });
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL("https://mallblitz.com/admin/products/brands");
	}

	async clickAddBrandButton(): Promise<void> {
		await this.addBrandButton.click();
	}

	async searchBrand(query: string): Promise<void> {
		await this.waitForTableToFinishLoading();
		await expect(this.searchField).toBeVisible();
		await this.searchField.fill(query);
		await this.waitForTableToFinishLoading();
	}

	async verifyBrandVisible(name: string): Promise<void> {
		await this.waitForTableToFinishLoading();
		await expect.poll(async () => await this.brandRow(name).count()).toBe(1);
		await expect(this.brandRow(name)).toBeVisible();
	}

	async verifyBrandRowValues(name: string, expected: BrandRowExpectations): Promise<void> {
		const row = this.brandRow(name);
		await expect(row).toContainText(name);

		if (expected.status) {
			await expect(row).toContainText(expected.status);
		}

		if (expected.featured) {
			await expect(row).toContainText(expected.featured);
		}

		if (expected.website) {
			await expect(row).toContainText(expected.website);
		}

		if (expected.order) {
			await expect(row).toContainText(expected.order);
		}
	}

	async verifyNoBrandsFound(): Promise<void> {
		await this.waitForTableToFinishLoading();
		await expect(this.noBrandsFoundMessage).toBeVisible();
	}

	async deleteBrandIfPresent(name: string): Promise<boolean> {
		await this.searchBrand(name);

		const row = this.brandRow(name);
		const rowCount = await row.count();
		if (!rowCount) {
			return false;
		}

		this.page.once("dialog", (dialog) => dialog.accept());
		await row.getByRole("button").click();
		await this.deleteButton.click();
		await expect.poll(async () => await this.brandRow(name).count()).toBe(0);

		return true;
	}

	private brandRow(name: string): Locator {
		return this.table.getByRole("row").filter({
			has: this.page.getByRole("cell", { name, exact: true }),
		});
	}

	private async waitForTableToFinishLoading(): Promise<void> {
		await expect(this.loadingMessage).toBeHidden({ timeout: 15000 });
	}
}
