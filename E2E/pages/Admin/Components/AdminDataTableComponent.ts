import { expect, Locator, Page } from "@playwright/test";
import { AdminDataTableFilterModalComponent } from "./AdminDataTableFilterModalComponent";

export type DataTableColumnConfig = {
	header: string;
	key: string;
	sortTestId?: string;
	visibilityTestId?: string;
};

export type DataTableConfig = {
	columns: DataTableColumnConfig[];
	emptyStateDescription?: string;
	emptyStateTitle?: string;
	loadingText?: string;
};

export type DataTablePaginationExpectation = {
	pageText?: string;
	rangeText?: string;
	visible?: boolean;
};

export type DataTablePaginationSnapshot = {
	end: number;
	page: number;
	start: number;
	total: number;
	totalPages: number;
};

export type DataTableSortDirection = "asc" | "desc";

type ActionExpectation = {
	action: string;
	enabled: boolean;
};

export class AdminDataTableComponent {
	private readonly table: Locator;
	private readonly searchInput: Locator;
	private readonly actionsButton: Locator;
	private readonly filterButton: Locator;
	private readonly refreshButton: Locator;
	private readonly columnsButton: Locator;
	private readonly loadingText: Locator;
	private readonly selectedCountLabel: Locator;
	private currentSort?: { column: string; direction: DataTableSortDirection };

	constructor(
		private readonly page: Page,
		private readonly root: Locator,
		private readonly config: DataTableConfig,
	) {
		this.table = this.root.getByRole("table");
		this.searchInput = this.root.getByRole("textbox").first();
		this.actionsButton = this.root.getByRole("button", { name: /^Actions/ });
		this.filterButton = this.root.getByRole("button", { name: "Filter" });
		this.refreshButton = this.root.getByRole("button", { name: "Refresh" });
		this.columnsButton = this.root.getByRole("button", { name: "Columns" });
		this.loadingText = this.table.getByText(this.config.loadingText ?? "Loading...", { exact: false });
		this.selectedCountLabel = this.root.getByText(/^\d+ row\(s\) selected$/);
	}

	async waitForIdle(): Promise<void> {
		await expect(this.table).toBeVisible({ timeout: 15000 });
		if (await this.loadingText.count()) {
			await expect(this.loadingText).toBeHidden({ timeout: 15000 });
		}
	}

	async search(query: string): Promise<void> {
		await this.waitForIdle();
		const previousSnapshot = await this.bodySnapshot();
		await expect(this.searchInput).toBeVisible();
		await this.searchInput.click();
		await this.searchInput.fill("");
		if (query) {
			await this.searchInput.pressSequentially(query);
		}
		await expect(this.searchInput).toHaveValue(query);
		await this.page.waitForLoadState("networkidle").catch(() => undefined);
		await expect
			.poll(async () => await this.bodySnapshot(), { timeout: 15000 })
			.not.toBe(previousSnapshot)
			.catch(() => undefined);
		await this.waitForIdle();
	}

	async clearSearch(): Promise<void> {
		await this.search("");
	}

	async expectHeaders(headers: string[]): Promise<void> {
		await expect.poll(async () => await this.visibleHeaders(), { timeout: 15000 }).toEqual(headers);
	}

	async expectRowCount(count: number): Promise<void> {
		await expect.poll(async () => await this.dataRowCount(), { timeout: 15000 }).toBe(count);
	}

	async rowByCell(column: string, value: string): Promise<Locator> {
		const columnIndex = await this.getColumnIndex(column);
		const rowIndex = await this.findRowDomIndexByCellValue(columnIndex, value);
		return this.bodyRows().nth(rowIndex);
	}

	async visibleRowCellValues(column: string): Promise<string[]> {
		const columnIndex = await this.getColumnIndex(column);
		return await this.bodyRows().evaluateAll((rows, targetIndex) =>
			rows
				.filter((row) => row.querySelectorAll("td").length > 1)
				.map((row) => row.querySelectorAll("td")[Number(targetIndex) - 1]?.textContent?.replace(/\s+/g, " ").trim() ?? ""),
			columnIndex,
		);
	}

	async expectColumnOrdered(
		column: string,
		direction: DataTableSortDirection,
		normalizer: (value: string) => number | string,
	): Promise<void> {
		const values = (await this.visibleRowCellValues(column)).map(normalizer);

		for (let i = 0; i < values.length - 1; i++) {
			const current = values[i];
			const next = values[i + 1];

			if (direction === "asc") {
				expect(current <= next).toBeTruthy();
			} else {
				expect(current >= next).toBeTruthy();
			}
		}
	}

	async clickRow(column: string, value: string): Promise<void> {
		const row = await this.rowByCell(column, value);
		await row.click();
	}

	async sortBy(column: string, direction: DataTableSortDirection = "asc"): Promise<void> {
		const sortTrigger = await this.sortTrigger(column);
		const needsDoubleClick =
			direction === "desc" &&
			(!this.currentSort || this.currentSort.column !== column || this.currentSort.direction !== "asc");

		await sortTrigger.click();
		await this.waitForIdle();

		if (needsDoubleClick) {
			await sortTrigger.click();
			await this.waitForIdle();
		}

		this.currentSort = { column, direction };
	}

	async selectRow(column: string, value: string, checked = true): Promise<void> {
		const row = await this.rowByCell(column, value);
		const checkbox = row.getByRole("checkbox").first();
		const isChecked = await checkbox.isChecked();
		if (isChecked !== checked) {
			await checkbox.click();
		}
	}

	async selectAllVisible(checked = true): Promise<void> {
		const checkbox = this.selectAllCheckbox();
		const isChecked = await checkbox.isChecked();
		if (isChecked !== checked) {
			await this.selectAllControl().click();
		}
	}

	async expectSelectedCount(count: number): Promise<void> {
		if (count === 0) {
			await expect(this.selectedCountLabel).toBeHidden();
			return;
		}

		await expect(this.selectedCountLabel).toHaveText(`${count} row(s) selected`);
	}

	async openBulkActions(): Promise<void> {
		await this.actionsButton.click();
	}

	async clickBulkAction(action: string): Promise<void> {
		await this.ensureBulkActionsMenu(action);
		await this.bulkMenuButton(action).click();
	}

	async expectBulkActionState(expectation: ActionExpectation): Promise<void> {
		await this.ensureBulkActionsMenu(expectation.action);
		const actionButton = this.bulkMenuButton(expectation.action);
		if (expectation.enabled) {
			await expect(actionButton).toBeEnabled();
		} else {
			await expect(actionButton).toBeDisabled();
		}
	}

	async openRowActions(column: string, value: string): Promise<void> {
		const row = await this.rowByCell(column, value);
		await row.getByRole("button").last().click();
	}

	async clickRowAction(column: string, value: string, action: string): Promise<void> {
		await this.ensureRowActionMenu(column, value, action);
		await this.rowMenuButton(action).click();
	}

	async expectRowActionState(column: string, value: string, expectation: ActionExpectation): Promise<void> {
		await this.ensureRowActionMenu(column, value, expectation.action);
		const actionButton = this.rowMenuButton(expectation.action);
		if (expectation.enabled) {
			await expect(actionButton).toBeEnabled();
		} else {
			await expect(actionButton).toBeDisabled();
		}
	}

	async openFilters(): Promise<AdminDataTableFilterModalComponent> {
		await this.filterButton.click();
		const modal = new AdminDataTableFilterModalComponent(this.page);
		await modal.open();
		return modal;
	}

	async openColumns(): Promise<void> {
		const firstColumn = this.config.columns.find((column) => column.visibilityTestId);
		if (!firstColumn?.visibilityTestId) {
			await this.columnsButton.click();
			return;
		}

		const firstToggleContainer = this.page.locator(`[data-test-id="${firstColumn.visibilityTestId}"]`);
		if (!(await firstToggleContainer.isVisible().catch(() => false))) {
			await this.columnsButton.click();
			await expect(firstToggleContainer).toBeVisible({ timeout: 10000 });
		}
	}

	async toggleColumnVisibility(column: string, visible: boolean): Promise<void> {
		await this.openColumns();
		const toggle = this.columnVisibilityToggle(column);
		const isChecked = await toggle.isChecked();
		if (isChecked !== visible) {
			await toggle.locator("xpath=ancestor::*[@data-test-id][1]").click();
		}
	}

	async expectColumnVisible(column: string, visible = true): Promise<void> {
		const headers = await this.visibleHeaders();
		expect(headers.includes(column)).toBe(visible);
	}

	async expectColumnVisibilityToggleDisabled(column: string): Promise<void> {
		await this.openColumns();
		await expect(this.columnVisibilityToggle(column)).toBeDisabled();
	}

	async refresh(): Promise<void> {
		await this.refreshButton.click();
		await expect(this.refreshButton).toBeDisabled();
		await this.waitForIdle();
	}

	async expectRefreshDisabled(): Promise<void> {
		await expect(this.refreshButton).toBeDisabled();
	}

	async setRowsPerPage(rowsPerPage: 10 | 25 | 50 | 100): Promise<void> {
		await this.pageSizeSelect().selectOption(String(rowsPerPage));
		await this.waitForIdle();
	}

	async goToFirstPage(): Promise<void> {
		await this.paginationButton("datatable-pagination-first").click();
		await this.waitForIdle();
	}

	async goToPreviousPage(): Promise<void> {
		await this.paginationButton("datatable-pagination-prev").click();
		await this.waitForIdle();
	}

	async goToNextPage(): Promise<void> {
		await this.paginationButton("datatable-pagination-next").click();
		await this.waitForIdle();
	}

	async goToLastPage(): Promise<void> {
		await this.paginationButton("datatable-pagination-last").click();
		await this.waitForIdle();
	}

	async expectEmptyState(title = this.config.emptyStateTitle, description = this.config.emptyStateDescription): Promise<void> {
		if (title) {
			await expect(this.table.getByText(title, { exact: true })).toBeVisible();
		}

		if (description) {
			await expect(this.table.getByText(description, { exact: true })).toBeVisible();
		}
	}

	async expectLoadingState(text = this.config.loadingText ?? "Loading..."): Promise<void> {
		await expect(this.table.getByText(text, { exact: false })).toBeVisible();
	}

	async expectPagination(expectation: DataTablePaginationExpectation): Promise<void> {
		const paginationText = this.root.getByText(/Show \d+ to \d+ of \d+ records/);
		const pageText = this.root.getByText(/Page \d+ of \d+/);

		if (expectation.visible === false) {
			await expect(paginationText).toBeHidden();
			await expect(pageText).toBeHidden();
			return;
		}

		if (expectation.rangeText) {
			await expect(paginationText).toHaveText(expectation.rangeText);
		}

		if (expectation.pageText) {
			await expect(pageText).toHaveText(expectation.pageText);
		}
	}

	async paginationSnapshot(): Promise<DataTablePaginationSnapshot> {
		const paginationText = this.root.getByText(/Show \d+ to \d+ of \d+ records/);
		const pageText = this.root.getByText(/Page \d+ of \d+/);

		await expect(paginationText).toBeVisible();
		await expect(pageText).toBeVisible();

		const rangeText = (await paginationText.textContent()) ?? "";
		const pageLabel = (await pageText.textContent()) ?? "";
		const rangeMatch = rangeText.match(/Show (\d+) to (\d+) of (\d+) records/);
		const pageMatch = pageLabel.match(/Page (\d+) of (\d+)/);

		if (!rangeMatch || !pageMatch) {
			throw new Error("Unable to parse datatable pagination text.");
		}

		return {
			start: Number(rangeMatch[1]),
			end: Number(rangeMatch[2]),
			total: Number(rangeMatch[3]),
			page: Number(pageMatch[1]),
			totalPages: Number(pageMatch[2]),
		};
	}

	private async visibleHeaders(): Promise<string[]> {
		return await this.table.locator("thead th").evaluateAll((nodes) =>
			nodes
				.map((node) => {
					const button = node.querySelector("button");
					const rawText = (button?.textContent ?? node.textContent ?? "").replace(/^Sort by\s+/i, "");
					return rawText.replace(/\s+/g, " ").trim();
				})
				.filter((value) => value.length > 0),
		);
	}

	private async getColumnIndex(column: string): Promise<number> {
		const labels = await this.table.locator("thead th").evaluateAll((nodes) =>
			nodes.map((node) => {
				const button = node.querySelector("button");
				const rawText = (button?.textContent ?? node.textContent ?? "").replace(/^Sort by\s+/i, "");
				return rawText.replace(/\s+/g, " ").trim();
			}),
		);

		const index = labels.findIndex((label) => label === column);
		if (index === -1) {
			throw new Error(`Visible table column "${column}" was not found.`);
		}

		return index + 1;
	}

	private async dataRowCount(): Promise<number> {
		return await this.bodyRows().evaluateAll((rows) => rows.filter((row) => row.querySelectorAll("td").length > 1).length);
	}

	private bodyRows(): Locator {
		return this.table.locator("tbody tr");
	}

	private async bodySnapshot(): Promise<string> {
		return JSON.stringify(
			await this.bodyRows().evaluateAll((rows) =>
				rows.map((row) => ({
					cells: row.querySelectorAll("td").length,
					text: row.textContent?.replace(/\s+/g, " ").trim() ?? "",
				})),
			),
		);
	}

	private async findRowDomIndexByCellValue(columnIndex: number, value: string): Promise<number> {
		const normalizedValue = this.normalizeText(value);
		const rowIndex = await this.bodyRows().evaluateAll(
			(rows, payload) =>
				rows.findIndex((row) => {
					const cells = row.querySelectorAll("td");
					if (cells.length <= 1) {
						return false;
					}

					const cell = cells[Number(payload.columnIndex) - 1] as HTMLElement | undefined;
					const cellText = cell?.innerText?.replace(/\s+/g, " ").trim() ?? "";
					return cellText === String(payload.value);
				}),
			{ columnIndex, value: normalizedValue },
		);

		if (rowIndex === -1) {
			throw new Error(`No row was found where column ${columnIndex} contains "${value}".`);
		}

		return rowIndex;
	}

	private async sortTrigger(column: string): Promise<Locator> {
		const columnConfig = this.columnConfig(column);
		if (columnConfig?.sortTestId) {
			return this.page.locator(`[data-test-id="${columnConfig.sortTestId}"]`);
		}

		const columnIndex = await this.getColumnIndex(column);
		return this.table.locator("thead th").nth(columnIndex - 1).getByRole("button").first();
	}

	private selectAllControl(): Locator {
		return this.page.locator('[data-test-id="datatable-select-all-checkbox"]');
	}

	private selectAllCheckbox(): Locator {
		return this.page.locator('[data-test-id="datatable-select-all-checkbox"] input[type="checkbox"]');
	}

	private bulkMenuButton(action: string): Locator {
		return this.bulkMenuItem(action).locator("button").first();
	}

	private rowMenuButton(action: string): Locator {
		return this.rowMenuItem(action).locator("button").first();
	}

	private async ensureBulkActionsMenu(action: string): Promise<void> {
		const button = this.bulkMenuButton(action);
		if (!(await button.isVisible().catch(() => false))) {
			await this.actionsButton.click();
			await expect(this.bulkMenuItem(action)).toBeVisible({ timeout: 5000 });
		}
	}

	private async ensureRowActionMenu(column: string, value: string, action: string): Promise<void> {
		const button = this.rowMenuButton(action);
		if (!(await button.isVisible().catch(() => false))) {
			const row = await this.rowByCell(column, value);
			await row.getByRole("button").last().click();
			await expect(this.rowMenuItem(action)).toBeVisible({ timeout: 5000 });
		}
	}

	private columnVisibilityToggle(column: string): Locator {
		const columnConfig = this.columnConfig(column);
		if (!columnConfig?.visibilityTestId) {
			throw new Error(`No column visibility toggle is configured for "${column}".`);
		}

		return this.page.locator(`[data-test-id="${columnConfig.visibilityTestId}"] input[type="checkbox"]`);
	}

	private pageSizeSelect(): Locator {
		return this.page.locator('[data-test-id="datatable-page-size-select"]');
	}

	private bulkMenuItem(action: string): Locator {
		return this.page.getByRole("menuitem", {
			name: new RegExp(`^${this.escapeRegex(action)}`),
		});
	}

	private rowMenuItem(action: string): Locator {
		return this.page.getByRole("menuitem", {
			name: new RegExp(`^${this.escapeRegex(action)}$`),
		});
	}

	private paginationButton(testId: string): Locator {
		return this.page.locator(`[data-test-id="${testId}"]`);
	}

	private columnConfig(column: string): DataTableColumnConfig | undefined {
		return this.config.columns.find((candidate) => candidate.header === column || candidate.key === column);
	}

	private normalizeText(value: string): string {
		return value.replace(/\s+/g, " ").trim();
	}

	private escapeRegex(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}
}
