import { expect, Locator, Page } from "@playwright/test";
import { AdminDataTableComponent } from "../Components/AdminDataTableComponent";
import { BasePage } from "../../BasePage";

interface BrandRowExpectations {
	status?: string;
	featured?: string;
	website?: string;
	order?: string;
}

export class BrandsPage extends BasePage {
	readonly table: AdminDataTableComponent;

	protected readonly addBrandButton: Locator;
	protected readonly deleteButton: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.addBrandButton = this.page.getByRole("button", { name: "Add Brand" });
		this.deleteButton = this.page.getByRole("button", { name: "Delete" });
		const tableSearchInput = this.page.getByRole("textbox", {
			name: "Search brands by name or description...",
		});
		const tableRoot = this.page.locator("fieldset").filter({ has: tableSearchInput }).first();
		this.table = new AdminDataTableComponent(this.page, tableRoot, {
			columns: [
				{
					key: "id",
					header: "ID",
					sortTestId: "datatable-sort-trigger-id",
					visibilityTestId: "datatable-column-visibility-id",
				},
				{
					key: "name",
					header: "Brand Name",
					sortTestId: "datatable-sort-trigger-name",
					visibilityTestId: "datatable-column-visibility-name",
				},
				{
					key: "status",
					header: "Status",
					sortTestId: "datatable-sort-trigger-status",
					visibilityTestId: "datatable-column-visibility-status",
				},
				{
					key: "is_featured",
					header: "Featured",
					sortTestId: "datatable-sort-trigger-is_featured",
					visibilityTestId: "datatable-column-visibility-is_featured",
				},
				{
					key: "sort_order",
					header: "Order",
					sortTestId: "datatable-sort-trigger-sort_order",
					visibilityTestId: "datatable-column-visibility-sort_order",
				},
				{
					key: "created_at",
					header: "Created",
					sortTestId: "datatable-sort-trigger-created_at",
					visibilityTestId: "datatable-column-visibility-created_at",
				},
			],
			emptyStateTitle: "No brands found",
			emptyStateDescription: "Try adjusting your search or filter criteria.",
		});
	}

	async goToPage(): Promise<void> {
		await this.gotoAndWaitForReady("/admin/products/brands", async () => {
			await this.page.waitForLoadState("networkidle");
			await this.table.waitForIdle();
		});
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/admin\/products\/brands(?:\?.*)?$/);
	}

	async clickAddBrandButton(): Promise<void> {
		await this.addBrandButton.click();
	}

	async searchBrand(query: string): Promise<void> {
		await this.table.search(query);
	}

	async verifyBrandVisible(name: string): Promise<void> {
		const row = await this.brandRow(name);
		await expect(row).toBeVisible();
	}

	async verifyBrandRowValues(name: string, expected: BrandRowExpectations): Promise<void> {
		const row = await this.brandRow(name);
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
		await this.table.expectEmptyState();
	}

	async deleteBrandIfPresent(name: string): Promise<boolean> {
		await this.searchBrand(name);

		try {
			await this.brandRow(name);
		} catch {
			return false;
		}

		this.page.once("dialog", (dialog) => dialog.accept());
		await this.table.openRowActions("Brand Name", name);
		await this.deleteButton.click();
		await expect
			.poll(async () => {
				try {
					return (await this.brandRow(name)).count();
				} catch {
					return 0;
				}
			})
			.toBe(0);

		return true;
	}

	private async brandRow(name: string): Promise<Locator> {
		await this.table.waitForIdle();
		return await this.table.rowByCell("Brand Name", name);
	}
}
