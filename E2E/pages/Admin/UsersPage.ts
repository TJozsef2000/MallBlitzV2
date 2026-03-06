import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "../BasePage";

enum FilterSelectOperator {
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

enum FilterSelectField {
	Name = "Name",
	Email = "Email",
	VerificationStatus = "Verification Status",
	Role = "Role",
	CreatedDate = "Created Date",
}

export class UsersPage extends BasePage {
	// === User Management ===
	protected readonly exportButton: Locator;
	protected readonly exportAsExcel: Locator;
	protected readonly exportAsCSV: Locator;
	protected readonly downloadImportTemplate: Locator;
	protected readonly importButton: Locator;
	protected readonly addUserButton: Locator;

	// === Table management ===
	protected readonly searchField: Locator;

	// - Table actions -
	protected readonly actionsButton: Locator;
	protected readonly markAsVerifiedButton: Locator;
	protected readonly markAsUnverifiedButton: Locator;
	protected readonly deleteSelectedButton: Locator;

	// - Filter -
	protected readonly filterWrapper: Locator;
	protected readonly filterButton: Locator;
	protected readonly filterSelectFieldDropdown: Locator;
	protected readonly filterSelectOperatorDropdown: Locator;
	protected readonly filterValueField: Locator;
	protected readonly filterSingleDateField: Locator;
	protected readonly filterMinDateField: Locator;
	protected readonly filterMaxDateField: Locator;
	protected readonly filterAddNewFilter: Locator;
	protected readonly filterClear: Locator;
	protected readonly filterApply: Locator;

	// - Refresh -
	protected readonly refreshButton: Locator;

	// - Columns view -
	protected readonly colViewButton: Locator;
	protected readonly userCheckbox: Locator;
	protected readonly emailCheckbox: Locator;
	protected readonly statusCheckbox: Locator;
	protected readonly roleCheckbox: Locator;
	protected readonly joinedCheckbox;

	// === Table ===

	// -- Table sort --
	protected readonly selectAll: Locator;
	protected readonly sortByID: Locator;
	protected readonly sortByUser: Locator;
	protected readonly sortByEmail: Locator;
	protected readonly sortByStatus: Locator;
	protected readonly sortByJoined: Locator;

	// -- Row locators --
	protected readonly tableBody: Locator;
	protected readonly tableRows: Locator;

	// === Pagination ===
	protected readonly paginationWrapper: Locator;
	protected readonly rowsPerPageCombo: Locator;
	protected readonly paginationFirstPageButton: Locator;
	protected readonly paginationLastPageButton: Locator;
	protected readonly paginationNextPageButton: Locator;
	protected readonly paginationPreviousPageButton: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		// === User Management ===
		this.exportButton = this.page.getByRole("button", { name: "Export" });
		this.exportAsExcel = this.page.getByRole("menuitem", { name: "Export as Excel (.xlsx)" });
		this.exportAsCSV = this.page.getByRole("menuitem", { name: "Export as CSV" });
		this.downloadImportTemplate = this.page.getByRole("menuitem", { name: "Export as CSV" });
		this.importButton = this.page.getByRole("button", { name: "Import" });
		this.addUserButton = this.page.getByRole("button", { name: "Add User" });

		// === Table management ===
		this.searchField = this.page.getByRole("textbox", { name: "Search users by name or email" });

		// - Table actions -
		this.actionsButton = this.page.getByRole("button", { name: "Actions" });
		this.markAsVerifiedButton = this.page.locator("#headlessui-menu-item-v-1-355").getByRole("button");
		this.markAsUnverifiedButton = this.page.locator("#headlessui-menu-item-v-1-356").getByRole("button");
		this.deleteSelectedButton = this.page.locator("#headlessui-menu-item-v-1-357").getByRole("button");

		// - Filter -
		this.filterWrapper = this.page.locator(".w-full max-w-4xl");
		this.filterButton = this.page.getByRole("button", { name: "Filter" });
		this.filterSelectFieldDropdown = this.filterWrapper.getByRole("combobox").first();
		this.filterSelectOperatorDropdown = this.filterWrapper.getByRole("combobox").nth(1);
		this.filterValueField = this.filterWrapper.getByRole("textbox").first();
		this.filterSingleDateField = this.filterWrapper.locator(
			".w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100",
		);
		this.filterMinDateField = this.filterWrapper.locator('[placeholder="Min"]');
		this.filterMaxDateField = this.filterWrapper.locator('[placeholder="Max"]');
		this.filterAddNewFilter = this.filterWrapper.getByRole("button", { name: "Add additional filter" });
		this.filterClear = this.filterWrapper.getByRole("button", { name: "Clear" });
		this.filterApply = this.filterWrapper.getByRole("button", { name: "Apply" });

		// - Refresh -
		this.refreshButton = this.page.getByRole("button", { name: "Refresh" });

		// - Columns view -
		this.colViewButton = this.page.getByRole("button", { name: "Columns" });
		this.userCheckbox = this.page.getByRole("checkbox", { name: "User" });
		this.emailCheckbox = this.page.getByRole("checkbox", { name: "Email" });
		this.statusCheckbox = this.page.getByRole("checkbox", { name: "Status" });
		this.roleCheckbox = this.page.getByRole("checkbox", { name: "Role" });
		this.joinedCheckbox = this.page.getByRole("checkbox", { name: "Joined" });

		// === Table ===
		this.tableBody = this.page.locator("tbody");
		this.tableRows = this.tableBody.locator("tr");

		// -- Table sort --
		this.selectAll = this.page.getByTestId("datatable-select-all-checkbox");
		this.sortByID = this.page.getByTestId("datatable-sort-trigger-id");
		this.sortByUser = this.page.getByTestId("datatable-sort-trigger-name");
		this.sortByEmail = this.page.getByTestId("datatable-sort-trigger-email");
		this.sortByStatus = this.page.getByTestId("datatable-sort-trigger-email_verified_at");
		this.sortByJoined = this.page.getByTestId("datatable-sort-trigger-created_at");

		// === Pagination ===
		this.paginationWrapper = this.page.locator(".flex items-center justify-between pt-4");
		this.rowsPerPageCombo = this.paginationWrapper.getByRole("combobox");
		this.paginationFirstPageButton = this.paginationWrapper.getByRole("button", { name: "Go to first page" });
		this.paginationNextPageButton = this.paginationWrapper.getByRole("button", { name: "Go to previous page" });
		this.paginationPreviousPageButton = this.paginationWrapper.getByRole("button", { name: "Go to next page" });
		this.paginationLastPageButton = this.paginationWrapper.getByRole("button", { name: "Go to last page" });
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL("https://mallblitz.com/admin/users");
	}

	async enterSearchQuery(query: string): Promise<void> {
		await this.searchField.fill(query);
	}

	async performUserAction(action: "Mark as verified" | "Mark as unverified" | "Delete Selected"): Promise<void> {
		await this.actionsButton.click();
		if (action === "Mark as verified") {
			await this.markAsUnverifiedButton.click();
		} else if (action === "Mark as unverified") {
			await this.markAsUnverifiedButton.click();
		} else if (action === "Delete Selected") {
			await this.deleteSelectedButton.click();
		}
	}

	private async filterSelectField(field: FilterSelectField): Promise<void> {
		await this.filterSelectFieldDropdown.selectOption(field);
	}

	private async filterSelectOperator(operator: FilterSelectOperator): Promise<void> {
		await this.filterSelectOperatorDropdown.selectOption(operator);
	}

	async applyFilter(
		field: FilterSelectField,
		operator: FilterSelectOperator,
		value?: any,
		singleDate?: string, // MM-DD-YYYY
		dateMin?: string,
		dateMax?: string,
	): Promise<void> {
		await this.filterSelectField(field);
		await this.filterSelectOperator(operator);
		if ((await this.filterValueField.isVisible()) === true) {
			await this.filterValueField.fill(value);
		} else if (
			(await this.filterMinDateField.isVisible()) === true ||
			(await this.filterMaxDateField.isVisible()) === true
		) {
			await this.filterMinDateField.fill(dateMin!);
			await this.filterMaxDateField.fill(dateMax!);
		} else if ((await this.filterSingleDateField.isVisible()) === true) {
			await this.filterSingleDateField.fill(singleDate!);
		} else {
			return;
		}
	}
}
