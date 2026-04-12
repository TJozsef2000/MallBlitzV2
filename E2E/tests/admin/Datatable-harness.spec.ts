import { Page } from "@playwright/test";
import { test, expect } from "../../fixtures/pomManager";
import { AdminDataTableComponent } from "../../pages/Admin/Components/AdminDataTableComponent";

interface HarnessOptions {
	showActions?: boolean;
	showSelection?: boolean;
}

function buildHarnessHtml(options: HarnessOptions = {}): string {
	const state = JSON.stringify({
		showActions: options.showActions ?? true,
		showSelection: options.showSelection ?? true,
	});

	return `
<!doctype html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<title>DataTable Harness</title>
	<style>
		body { font-family: Arial, sans-serif; padding: 24px; }
		[hidden] { display: none !important; }
		table { width: 100%; border-collapse: collapse; }
		th, td { border: 1px solid #d4d4d8; padding: 8px; text-align: left; }
		th button, .toolbar button, .toolbar select { margin-right: 8px; }
		.menu, .modal { border: 1px solid #d4d4d8; background: #fff; padding: 12px; width: fit-content; }
		.menu button[disabled] { opacity: 0.5; }
		.modal { position: fixed; top: 80px; left: 80px; min-width: 480px; }
		.rule { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; }
		.rule input[type="checkbox"] { width: 18px; height: 18px; }
		.badge { display: inline-block; background: #111827; color: #fff; border-radius: 999px; padding: 2px 8px; font-size: 12px; margin-left: 8px; }
		.secondary { color: #71717a; font-size: 12px; }
		.pagination { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; }
	</style>
</head>
<body>
	<div role="group" aria-label="Harness Table" id="table-root">
		<div class="toolbar">
			<input aria-label="Search harness rows" placeholder="Search harness rows" />
			<button type="button" id="bulk-actions-button">Actions</button>
			<button type="button" id="filter-button">Filter</button>
			<button type="button" id="refresh-button">Refresh</button>
			<button type="button" id="columns-button">Columns</button>
		</div>
		<div id="selected-count" hidden>0 row(s) selected</div>
		<div class="menu" role="menu" id="bulk-menu" hidden>
			<div role="menuitem"><button type="button" id="bulk-view">View Selected</button></div>
			<div role="menuitem"><button type="button" id="bulk-archive">Archive Selected</button></div>
		</div>
		<div class="menu" role="menu" id="columns-menu" hidden>
			<div>
				<label>
					<div data-test-id="datatable-column-visibility-id">
						<input id="toggle-id" type="checkbox" checked disabled />
					</div>
					<span>ID</span>
				</label>
			</div>
			<div>
				<label>
					<div data-test-id="datatable-column-visibility-name">
						<input id="toggle-name" type="checkbox" checked />
					</div>
					<span>Name</span>
				</label>
			</div>
			<div>
				<label>
					<div data-test-id="datatable-column-visibility-status">
						<input id="toggle-status" type="checkbox" checked />
					</div>
					<span>Status</span>
				</label>
			</div>
			<div>
				<label>
					<div data-test-id="datatable-column-visibility-joined">
						<input id="toggle-joined" type="checkbox" checked />
					</div>
					<span>Joined</span>
				</label>
			</div>
		</div>
		<table>
			<thead id="table-head"></thead>
			<tbody id="table-body"></tbody>
		</table>
		<div class="pagination" id="pagination">
			<div id="range-text"></div>
			<div>
				<label>
					Rows per page
					<select data-test-id="datatable-page-size-select" id="page-size">
						<option value="10" selected>10</option>
						<option value="25">25</option>
						<option value="50">50</option>
						<option value="100">100</option>
					</select>
				</label>
				<span id="page-text"></span>
				<button type="button" data-test-id="datatable-pagination-first" id="page-first">First</button>
				<button type="button" data-test-id="datatable-pagination-prev" id="page-prev">Prev</button>
				<button type="button" data-test-id="datatable-pagination-next" id="page-next">Next</button>
				<button type="button" data-test-id="datatable-pagination-last" id="page-last">Last</button>
			</div>
		</div>
	</div>

	<div class="menu" role="menu" id="row-menu" hidden>
		<div role="menuitem"><button type="button" id="row-view">View</button></div>
		<div role="menuitem"><button type="button" id="row-edit">Edit</button></div>
		<div role="menuitem"><button type="button" id="row-archive" disabled>Archive</button></div>
	</div>

	<div class="modal" id="filter-modal" hidden>
		<div>
			<h3>Filter</h3>
			<button type="button" id="close-filter">Close</button>
		</div>
		<div class="rule">
			<select id="filter-field">
				<option value="text">Text Field</option>
				<option value="number">Number Field</option>
				<option value="date-range">Date Field</option>
				<option value="choice">Choice Field</option>
				<option value="boolean">Active</option>
				<option value="none">Status</option>
			</select>
			<select id="filter-operator"></select>
			<span id="filter-value-slot"></span>
		</div>
		<button type="button" id="add-filter">Add additional filter</button>
		<div>
			<button type="button" id="clear-filter">Clear</button>
			<button type="button" id="apply-filter">Apply</button>
		</div>
	</div>

	<script>
		const harnessOptions = ${state};
		const rows = [
			{ id: 1, name: "Ada Lovelace", email: "ada@example.com", status: "Verified", joined: "2026-03-01", note: "Priority" },
			{ id: 2, name: "Grace Hopper", email: "grace@example.com", status: "Pending", joined: "2026-03-02", note: "Custom renderer" },
			{ id: 3, name: "Linus Torvalds", email: "linus@example.com", status: "Verified", joined: "2026-03-03", note: "Core maintainer" },
			{ id: 4, name: "Margaret Hamilton", email: "margaret@example.com", status: "Pending", joined: "2026-03-04", note: "Apollo" },
			{ id: 5, name: "Donald Knuth", email: "donald@example.com", status: "Verified", joined: "2026-03-05", note: "Algorithms" },
			{ id: 6, name: "Barbara Liskov", email: "barbara@example.com", status: "Verified", joined: "2026-03-06", note: "LSP" },
			{ id: 7, name: "Alan Turing", email: "alan@example.com", status: "Pending", joined: "2026-03-07", note: "Foundations" },
			{ id: 8, name: "Katherine Johnson", email: "katherine@example.com", status: "Verified", joined: "2026-03-08", note: "Orbital" },
			{ id: 9, name: "Tim Berners-Lee", email: "tim@example.com", status: "Verified", joined: "2026-03-09", note: "Web" },
			{ id: 10, name: "Guido van Rossum", email: "guido@example.com", status: "Pending", joined: "2026-03-10", note: "Python" },
			{ id: 11, name: "Radia Perlman", email: "radia@example.com", status: "Verified", joined: "2026-03-11", note: "Networking" },
			{ id: 12, name: "Ken Thompson", email: "ken@example.com", status: "Pending", joined: "2026-03-12", note: "Unix" }
		];

		const filterDefinitions = {
			text: { operators: ["Contains"], mode: "text" },
			number: { operators: ["Equals"], mode: "number" },
			"date-range": { operators: ["Between"], mode: "range-date" },
			choice: { operators: ["Equals"], mode: "select" },
			boolean: { operators: ["Equals"], mode: "boolean" },
			none: { operators: ["Is empty"], mode: "none" }
		};

		const stateModel = {
			search: "",
			sort: "",
			page: 1,
			pageSize: 10,
			selectedIds: new Set(),
			rowMenuId: null,
			loading: false,
			filterOpen: false,
			filterApplied: null,
			field: "text",
			operator: "Contains",
			value: "",
			showSelection: harnessOptions.showSelection,
			showActions: harnessOptions.showActions,
			visibleColumns: { id: true, name: true, status: true, joined: true }
		};

		const root = document.getElementById("table-root");
		const body = document.getElementById("table-body");
		const head = document.getElementById("table-head");
		const bulkMenu = document.getElementById("bulk-menu");
		const rowMenu = document.getElementById("row-menu");
		const columnsMenu = document.getElementById("columns-menu");
		const filterModal = document.getElementById("filter-modal");
		const selectedCount = document.getElementById("selected-count");
		const rangeText = document.getElementById("range-text");
		const pageText = document.getElementById("page-text");
		const pagination = document.getElementById("pagination");
		const refreshButton = document.getElementById("refresh-button");
		const bulkActionsButton = document.getElementById("bulk-actions-button");
		const searchInput = root.querySelector("input");
		const fieldSelect = document.getElementById("filter-field");
		const operatorSelect = document.getElementById("filter-operator");
		const valueSlot = document.getElementById("filter-value-slot");
		const pageSizeSelect = document.getElementById("page-size");

		function escapeHtml(value) {
			return String(value)
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#39;");
		}

		function updateFilterControls() {
			const definition = filterDefinitions[stateModel.field];
			stateModel.operator = definition.operators[0];
			operatorSelect.innerHTML = definition.operators.map((operator) => \`<option value="\${operator}">\${operator}</option>\`).join("");

			switch (definition.mode) {
				case "text":
					valueSlot.innerHTML = '<input type="text" id="filter-value" placeholder="Enter text" />';
					break;
				case "number":
					valueSlot.innerHTML = '<input type="number" id="filter-value" />';
					break;
				case "range-date":
					valueSlot.innerHTML = '<input type="date" id="filter-min" /><input type="date" id="filter-max" />';
					break;
				case "select":
					valueSlot.innerHTML = '<select id="filter-value"><option>VIP</option><option>Standard</option></select>';
					break;
				case "boolean":
					valueSlot.innerHTML = '<label><input type="checkbox" role="switch" id="filter-value" /> Active</label>';
					break;
				case "none":
					valueSlot.innerHTML = '<span>No value required</span>';
					break;
			}
		}

		function filteredRows() {
			let result = [...rows];

			if (stateModel.search) {
				const query = stateModel.search.toLowerCase();
				result = result.filter((row) =>
					row.name.toLowerCase().includes(query) || row.email.toLowerCase().includes(query)
				);
			}

			if (stateModel.filterApplied?.field === "text" && stateModel.filterApplied.value) {
				const query = String(stateModel.filterApplied.value).toLowerCase();
				result = result.filter((row) => row.name.toLowerCase().includes(query));
			}

			if (stateModel.sort === "id") {
				result.sort((left, right) => left.id - right.id);
			} else if (stateModel.sort === "-id") {
				result.sort((left, right) => right.id - left.id);
			}

			return result;
		}

		function totalColumns() {
			return (stateModel.showSelection ? 1 : 0)
				+ (stateModel.visibleColumns.id ? 1 : 0)
				+ (stateModel.visibleColumns.name ? 1 : 0)
				+ (stateModel.visibleColumns.status ? 1 : 0)
				+ (stateModel.visibleColumns.joined ? 1 : 0)
				+ (stateModel.showActions ? 1 : 0);
		}

		function visibleRows() {
			const allRows = filteredRows();
			const start = (stateModel.page - 1) * stateModel.pageSize;
			return allRows.slice(start, start + stateModel.pageSize);
		}

		function renderTable() {
			head.innerHTML = \`
				<tr>
					\${stateModel.showSelection ? '<th><div data-test-id="datatable-select-all-checkbox"><input type="checkbox" id="select-all" /></div></th>' : ""}
					\${stateModel.visibleColumns.id ? '<th><button type="button" data-test-id="datatable-sort-trigger-id" id="sort-id">ID</button></th>' : ""}
					\${stateModel.visibleColumns.name ? '<th><span>Name</span></th>' : ""}
					\${stateModel.visibleColumns.status ? '<th><span>Status</span></th>' : ""}
					\${stateModel.visibleColumns.joined ? '<th><span>Joined</span></th>' : ""}
					\${stateModel.showActions ? '<th><span>Actions</span></th>' : ""}
				</tr>
			\`;

			if (stateModel.loading) {
				body.innerHTML = \`<tr><td colspan="\${totalColumns()}">Loading...</td></tr>\`;
				return;
			}

			const rowsToRender = visibleRows();
			if (!rowsToRender.length) {
				body.innerHTML = \`<tr><td colspan="\${totalColumns()}"><strong>No rows found</strong><p>Try another query.</p></td></tr>\`;
				return;
			}

			body.innerHTML = rowsToRender
				.map((row) => \`
					<tr data-row-id="\${row.id}">
						\${stateModel.showSelection ? \`<td><input type="checkbox" data-test-id="datatable-row-checkbox-\${row.id}" class="row-checkbox" data-row-id="\${row.id}" \${stateModel.selectedIds.has(row.id) ? "checked" : ""} /></td>\` : ""}
						\${stateModel.visibleColumns.id ? \`<td>\${row.id}</td>\` : ""}
						\${stateModel.visibleColumns.name ? \`<td><div><strong>\${escapeHtml(row.name)}</strong><span class="secondary">\${escapeHtml(row.note)}</span></div></td>\` : ""}
						\${stateModel.visibleColumns.status ? \`<td><span class="badge">\${escapeHtml(row.status)}</span></td>\` : ""}
						\${stateModel.visibleColumns.joined ? \`<td>\${escapeHtml(row.joined)}</td>\` : ""}
						\${stateModel.showActions ? \`<td><button type="button" class="row-actions" data-row-id="\${row.id}">More</button></td>\` : ""}
					</tr>
				\`)
				.join("");
		}

		function renderSelection() {
			const count = stateModel.selectedIds.size;
			selectedCount.textContent = \`\${count} row(s) selected\`;
			selectedCount.hidden = count === 0;
			bulkActionsButton.textContent = count ? \`Actions \${count}\` : "Actions";
			document.getElementById("bulk-view").disabled = count === 0;
			document.getElementById("bulk-archive").disabled = count === 0;
		}

		function renderPagination() {
			const allRows = filteredRows();
			if (!allRows.length) {
				pagination.hidden = true;
				return;
			}

			pagination.hidden = false;
			const totalPages = Math.max(1, Math.ceil(allRows.length / stateModel.pageSize));
			if (stateModel.page > totalPages) {
				stateModel.page = totalPages;
			}

			const start = (stateModel.page - 1) * stateModel.pageSize + 1;
			const end = Math.min(stateModel.page * stateModel.pageSize, allRows.length);
			rangeText.textContent = \`Show \${start} to \${end} of \${allRows.length} records\`;
			pageText.textContent = \`Page \${stateModel.page} of \${totalPages}\`;
			document.getElementById("page-first").disabled = stateModel.page === 1;
			document.getElementById("page-prev").disabled = stateModel.page === 1;
			document.getElementById("page-next").disabled = stateModel.page === totalPages;
			document.getElementById("page-last").disabled = stateModel.page === totalPages;
		}

		function renderMenus() {
			bulkMenu.hidden = true;
			rowMenu.hidden = stateModel.rowMenuId === null;
			columnsMenu.hidden = columnsMenu.hidden;
		}

		function render() {
			renderTable();
			renderSelection();
			renderPagination();
			renderMenus();
		}

		searchInput.addEventListener("input", (event) => {
			stateModel.search = event.target.value;
			stateModel.page = 1;
			render();
		});

		document.addEventListener("click", (event) => {
			const target = event.target;

			if (target.id === "sort-id") {
				stateModel.sort = stateModel.sort === "id" ? "-id" : "id";
				render();
				return;
			}

			if (target.id === "bulk-actions-button") {
				bulkMenu.hidden = !bulkMenu.hidden;
				rowMenu.hidden = true;
				return;
			}

			if (target.classList?.contains("row-actions")) {
				stateModel.rowMenuId = Number(target.dataset.rowId);
				rowMenu.hidden = false;
				bulkMenu.hidden = true;
				return;
			}

			if (target.id === "filter-button") {
				filterModal.hidden = false;
				return;
			}

			if (target.id === "close-filter") {
				filterModal.hidden = true;
				return;
			}

			if (target.id === "apply-filter") {
				const definition = filterDefinitions[stateModel.field];
				if (definition.mode === "text") {
					stateModel.filterApplied = {
						field: stateModel.field,
						value: document.getElementById("filter-value")?.value ?? ""
					};
				} else {
					stateModel.filterApplied = { field: stateModel.field, value: "" };
				}
				filterModal.hidden = true;
				stateModel.page = 1;
				render();
				return;
			}

			if (target.id === "clear-filter") {
				stateModel.field = "text";
				stateModel.filterApplied = null;
				fieldSelect.value = "text";
				updateFilterControls();
				return;
			}

			if (target.id === "refresh-button") {
				stateModel.loading = true;
				refreshButton.disabled = true;
				render();
				setTimeout(() => {
					stateModel.loading = false;
					refreshButton.disabled = false;
					render();
				}, 120);
				return;
			}

			if (target.id === "columns-button") {
				columnsMenu.hidden = !columnsMenu.hidden;
				return;
			}

			if (target.id === "page-first") {
				stateModel.page = 1;
				render();
				return;
			}

			if (target.id === "page-prev") {
				stateModel.page = Math.max(1, stateModel.page - 1);
				render();
				return;
			}

			if (target.id === "page-next") {
				const totalPages = Math.max(1, Math.ceil(filteredRows().length / stateModel.pageSize));
				stateModel.page = Math.min(totalPages, stateModel.page + 1);
				render();
				return;
			}

			if (target.id === "page-last") {
				stateModel.page = Math.max(1, Math.ceil(filteredRows().length / stateModel.pageSize));
				render();
			}
		});

		document.addEventListener("change", (event) => {
			const target = event.target;

			if (target.id === "select-all") {
				visibleRows().forEach((row) => {
					if (target.checked) {
						stateModel.selectedIds.add(row.id);
					} else {
						stateModel.selectedIds.delete(row.id);
					}
				});
				render();
				return;
			}

			if (target.classList?.contains("row-checkbox")) {
				const rowId = Number(target.dataset.rowId);
				if (target.checked) {
					stateModel.selectedIds.add(rowId);
				} else {
					stateModel.selectedIds.delete(rowId);
				}
				render();
				return;
			}

			if (target.id === "filter-field") {
				stateModel.field = target.value;
				updateFilterControls();
				return;
			}

			if (target.id === "page-size") {
				stateModel.pageSize = Number(target.value);
				stateModel.page = 1;
				render();
				return;
			}

			if (target.id === "toggle-name") {
				stateModel.visibleColumns.name = target.checked;
				render();
				return;
			}

			if (target.id === "toggle-status") {
				stateModel.visibleColumns.status = target.checked;
				render();
				return;
			}

			if (target.id === "toggle-joined") {
				stateModel.visibleColumns.joined = target.checked;
				render();
			}
		});

		updateFilterControls();
		render();
	</script>
</body>
</html>
`;
}

async function mountHarness(page: Page, options?: HarnessOptions): Promise<AdminDataTableComponent> {
	await page.setContent(buildHarnessHtml(options));

	return new AdminDataTableComponent(page, page.getByRole("group", { name: "Harness Table" }), {
		columns: [
			{
				key: "id",
				header: "ID",
				sortTestId: "datatable-sort-trigger-id",
				visibilityTestId: "datatable-column-visibility-id",
			},
			{
				key: "name",
				header: "Name",
				visibilityTestId: "datatable-column-visibility-name",
			},
			{
				key: "status",
				header: "Status",
				visibilityTestId: "datatable-column-visibility-status",
			},
			{
				key: "joined",
				header: "Joined",
				visibilityTestId: "datatable-column-visibility-joined",
			},
		],
		emptyStateTitle: "No rows found",
		emptyStateDescription: "Try another query.",
	});
}

async function mountCompactHarness(page: Page): Promise<AdminDataTableComponent> {
	await page.setContent(`
		<div role="group" aria-label="Harness Table">
			<div>
				<input aria-label="Search harness rows" />
				<button type="button">Actions</button>
				<button type="button">Filter</button>
				<button type="button">Refresh</button>
				<button type="button">Columns</button>
			</div>
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Name</th>
						<th>Status</th>
						<th>Joined</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>1</td>
						<td>Compact Row</td>
						<td>Verified</td>
						<td>2026-03-01</td>
					</tr>
				</tbody>
			</table>
		</div>
	`);

	return new AdminDataTableComponent(page, page.getByRole("group", { name: "Harness Table" }), {
		columns: [
			{ key: "id", header: "ID" },
			{ key: "name", header: "Name" },
			{ key: "status", header: "Status" },
			{ key: "joined", header: "Joined" },
		],
	});
}

test.describe("DataTable harness contract", () => {
	test("renders custom cells and optional selection/actions columns", async ({ page }) => {
		const table = await mountHarness(page);
		await table.expectHeaders(["ID", "Name", "Status", "Joined", "Actions"]);
		await table.expectRowCount(10);

		const row = await table.rowByCell("ID", "1");
		await expect(row).toContainText("Priority");

		const compactTable = await mountCompactHarness(page);
		await compactTable.expectHeaders(["ID", "Name", "Status", "Joined"]);
	});

	test("supports disabled bulk and row actions", async ({ page }) => {
		const table = await mountHarness(page);
		await table.expectBulkActionState({ action: "View Selected", enabled: false });
		await table.expectBulkActionState({ action: "Archive Selected", enabled: false });

		await table.selectRow("ID", "1");
		await table.expectSelectedCount(1);
		await table.expectBulkActionState({ action: "View Selected", enabled: true });
		await table.expectBulkActionState({ action: "Archive Selected", enabled: true });
		await table.expectRowActionState("ID", "1", { action: "View", enabled: true });
		await table.expectRowActionState("ID", "1", { action: "Archive", enabled: false });
	});

	test("switches filter input modes", async ({ page }) => {
		const table = await mountHarness(page);
		const modal = await table.openFilters();

		await modal.setField("Text Field");
		await modal.expectInputMode("text");
		await modal.setField("Number Field");
		await modal.expectInputMode("number");
		await modal.setField("Date Field");
		await modal.expectInputMode("range-date");
		await modal.setField("Choice Field");
		await modal.expectInputMode("select");
		await modal.setField("Active");
		await modal.expectInputMode("boolean");
		await modal.setField("Status");
		await modal.expectInputMode("none");
	});

	test("handles loading, empty state, and pagination", async ({ page }) => {
		const table = await mountHarness(page);
		await table.expectPagination({
			rangeText: "Show 1 to 10 of 12 records",
			pageText: "Page 1 of 2",
		});

		await table.goToNextPage();
		await table.expectPagination({
			rangeText: "Show 11 to 12 of 12 records",
			pageText: "Page 2 of 2",
		});

		await page.getByRole("button", { name: "Refresh" }).click();
		await table.expectRefreshDisabled();
		await table.expectLoadingState();
		await table.waitForIdle();

		await table.search("not-a-real-row");
		await table.expectEmptyState();
		await table.expectPagination({ visible: false });
	});
});
