import { expect, Locator, Page } from "@playwright/test";
import { AdminDataTableComponent } from "./Components/AdminDataTableComponent";
import { AdminDataTableFilterModalComponent } from "./Components/AdminDataTableFilterModalComponent";
import { BasePage } from "../BasePage";

export enum FilterSelectOperator {
	Equals = "Equals",
	Contains = "Contains",
	DoesNotContain = "Does not contain",
	StartsWith = "Starts with",
	EndsWith = "Ends with",
	IsEmpty = "Is empty",
	IsNotEmpty = "Is not empty",
	Between = "Between",
	IsToday = "Is today",
	IsThisWeek = "Is this week",
	IsThisMonth = "Is this month",
	IsThisYear = "Is this year",
	LastNDays = "Last N days",
}

export enum FilterSelectField {
	Name = "Name",
	Email = "Email",
	VerificationStatus = "Verification Status",
	Role = "Role",
	CreatedDate = "Created Date",
}

export class UsersPage extends BasePage {
	readonly table: AdminDataTableComponent;

	// === User Management ===
	protected readonly exportButton: Locator;
	protected readonly exportAsExcel: Locator;
	protected readonly exportAsCSV: Locator;
	protected readonly downloadImportTemplate: Locator;
	protected readonly importButton: Locator;
	protected readonly addUserButton: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		// === User Management ===
		this.exportButton = this.page.getByRole("button", { name: "Export" });
		this.exportAsExcel = this.page.getByRole("menuitem", { name: "Export as Excel (.xlsx)" });
		this.exportAsCSV = this.page.getByRole("menuitem", { name: "Export as CSV" });
		this.downloadImportTemplate = this.page.getByRole("menuitem", { name: "Download import template" });
		this.importButton = this.page.getByRole("button", { name: "Import" });
		this.addUserButton = this.page.getByRole("button", { name: "Add User" });
		const tableSearchInput = this.page.getByRole("textbox", { name: "Search users by name or email..." });
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
					header: "User",
					sortTestId: "datatable-sort-trigger-name",
					visibilityTestId: "datatable-column-visibility-name",
				},
				{
					key: "email",
					header: "Email",
					sortTestId: "datatable-sort-trigger-email",
					visibilityTestId: "datatable-column-visibility-email",
				},
				{
					key: "email_verified_at",
					header: "Status",
					sortTestId: "datatable-sort-trigger-email_verified_at",
					visibilityTestId: "datatable-column-visibility-email_verified_at",
				},
				{
					key: "roles",
					header: "Role",
					visibilityTestId: "datatable-column-visibility-roles",
				},
				{
					key: "created_at",
					header: "Joined",
					sortTestId: "datatable-sort-trigger-created_at",
					visibilityTestId: "datatable-column-visibility-created_at",
				},
			],
		});
	}

	async goToPage(): Promise<void> {
		await this.page.goto("/admin/users", { waitUntil: "domcontentloaded" });
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/admin\/users(?:\?.*)?$/);
	}

	async enterSearchQuery(query: string): Promise<void> {
		await this.table.search(query);
	}

	async performUserAction(
		action: "Mark as verified" | "Mark as unverified" | "Delete Selected",
	): Promise<void> {
		await this.table.openBulkActions();
		if (action === "Mark as verified") {
			await this.page.getByRole("button", { name: /^Mark as Verified/ }).click();
		} else if (action === "Mark as unverified") {
			await this.page.getByRole("button", { name: /^Mark as Unverified/ }).click();
		} else if (action === "Delete Selected") {
			await this.page.getByRole("button", { name: /^Delete Selected/ }).click();
		}
	}

	async openFilters(): Promise<AdminDataTableFilterModalComponent> {
		return await this.table.openFilters();
	}

	async applyFilter(
		field: FilterSelectField,
		operator: FilterSelectOperator,
		value?: boolean | number | string,
		singleDate?: string, // MM-DD-YYYY
		dateMin?: string,
		dateMax?: string,
	): Promise<void> {
		const modal = await this.openFilters();
		await modal.setField(field);
		await modal.setOperator(operator);

		if (dateMin && dateMax) {
			await modal.setValue([dateMin, dateMax]);
		} else if (singleDate) {
			await modal.setValue(singleDate);
		} else if (value !== undefined) {
			await modal.setValue(value);
		}

		await modal.apply();
	}
}
