import { expect, Locator, Page } from "@playwright/test";

export type DataTableFilterValue = boolean | number | string | [string | number, string | number];
export type DataTableFilterInputMode =
	| "boolean"
	| "date"
	| "none"
	| "number"
	| "range-date"
	| "range-number"
	| "range-text"
	| "select"
	| "text";

type RuleExpectation = {
	field: string;
	operator: string;
	value?: DataTableFilterValue;
};

export class AdminDataTableFilterModalComponent {
	private readonly heading: Locator;
	private readonly addRuleButton: Locator;
	private readonly clearButton: Locator;
	private readonly applyButton: Locator;

	constructor(
		private readonly page: Page,
		private readonly modal: Locator = page.locator("body > div").filter({
			has: page.getByRole("heading", { name: "Filter", exact: true }),
		}).last(),
	) {
		this.heading = this.modal.getByRole("heading", { name: "Filter", exact: true });
		this.addRuleButton = this.modal.getByRole("button", { name: "Add additional filter" });
		this.clearButton = this.modal.getByRole("button", { name: "Clear" });
		this.applyButton = this.modal.getByRole("button", { name: "Apply" });
	}

	async open(): Promise<void> {
		await expect(this.heading).toBeVisible();
	}

	async close(): Promise<void> {
		await this.modal.locator("button").first().click();
		await expect(this.heading).toBeHidden();
	}

	async addRule(): Promise<void> {
		await this.addRuleButton.click();
	}

	async removeRule(index = 0): Promise<void> {
		const rule = this.rule(index);
		const explicitRemove = rule.getByTestId("datatable-filter-rule-remove");
		if (await explicitRemove.count()) {
			await explicitRemove.click();
			return;
		}

		const buttons = rule.getByRole("button");
		const buttonCount = await buttons.count();
		for (let i = buttonCount - 1; i >= 0; i--) {
			const candidate = buttons.nth(i);
			if (await candidate.isVisible()) {
				await candidate.click();
				return;
			}
		}

		throw new Error(`No remove button found for filter rule ${index}.`);
	}

	async setField(field: string, index = 0): Promise<void> {
		await this.fieldSelect(index).selectOption({ label: field });
	}

	async setOperator(operator: string, index = 0): Promise<void> {
		await this.operatorSelect(index).selectOption({ label: operator });
	}

	async setValue(value: DataTableFilterValue, index = 0): Promise<void> {
		const rule = this.rule(index);

		if (Array.isArray(value)) {
			const inputs = await this.visibleFillableInputs(rule);
			if (inputs.length < 2) {
				throw new Error(`Expected a range input for filter rule ${index}.`);
			}

			await inputs[0].fill(String(value[0]));
			await inputs[1].fill(String(value[1]));
			return;
		}

		if (typeof value === "boolean") {
			const switchControl = rule.getByRole("switch");
			if (await switchControl.count()) {
				const isChecked = await switchControl.isChecked();
				if (isChecked !== value) {
					await switchControl.click();
				}
				return;
			}

			const checkbox = rule.getByRole("checkbox");
			if (await checkbox.count()) {
				const isChecked = await checkbox.isChecked();
				if (isChecked !== value) {
					await checkbox.click();
				}
				return;
			}

			throw new Error(`No boolean control found for filter rule ${index}.`);
		}

		const valueSelect = this.valueSelect(index);
		if (await valueSelect.count()) {
			await valueSelect.selectOption({ label: String(value) });
			return;
		}

		const inputs = await this.visibleFillableInputs(rule);
		if (!inputs.length) {
			throw new Error(`No value input found for filter rule ${index}.`);
		}

		await inputs[0].fill(String(value));
	}

	async clear(): Promise<void> {
		await this.clearButton.click();
	}

	async apply(): Promise<void> {
		await this.applyButton.click();
		await expect(this.heading).toBeHidden();
	}

	async expectRuleRestored(expectation: RuleExpectation, index = 0): Promise<void> {
		await expect
			.poll(async () => ({
				field: await this.selectedOptionLabel(this.fieldSelect(index)),
				operator: await this.selectedOptionLabel(this.operatorSelect(index)),
			}))
			.toEqual({
				field: expectation.field,
				operator: expectation.operator,
			});

		if (expectation.value === undefined) {
			return;
		}

		const actualValue = await this.currentRuleValue(index);
		expect(actualValue).toEqual(expectation.value);
	}

	async expectInputMode(mode: DataTableFilterInputMode, index = 0): Promise<void> {
		const rule = this.rule(index);
		const valueSelect = this.valueSelect(index);
		const inputs = await this.visibleFillableInputs(rule);
		const inputTypes = await Promise.all(inputs.map((input) => input.getAttribute("type")));

		switch (mode) {
			case "boolean":
				await expect(await this.countVisibleBooleanControls(rule)).toBeGreaterThan(0);
				return;
			case "date":
				expect(inputTypes).toEqual(["date"]);
				return;
			case "none":
				await expect(rule.getByText("No value required", { exact: false })).toBeVisible();
				return;
			case "number":
				expect(inputTypes).toEqual(["number"]);
				return;
			case "range-date":
				expect(inputTypes).toEqual(["date", "date"]);
				return;
			case "range-number":
				expect(inputTypes).toEqual(["number", "number"]);
				return;
			case "range-text":
				expect(inputTypes).toEqual(["text", "text"]);
				return;
			case "select":
				await expect(valueSelect).toBeVisible();
				return;
			case "text":
				expect(inputTypes).toEqual(["text"]);
				return;
			default:
				expect(mode).toBeDefined();
		}
	}

	private rule(index: number): Locator {
		return this.modal.locator('xpath=.//*[count(.//select) >= 2 and not(descendant::*[count(.//select) >= 2])]').nth(index);
	}

	private fieldSelect(index: number): Locator {
		return this.rule(index).locator("select").first();
	}

	private operatorSelect(index: number): Locator {
		return this.rule(index).locator("select").nth(1);
	}

	private valueSelect(index: number): Locator {
		return this.rule(index).locator("select").nth(2);
	}

	private async visibleFillableInputs(rule: Locator): Promise<Locator[]> {
		const inputLocator = rule.locator("input");
		const count = await inputLocator.count();
		const inputs: Locator[] = [];

		for (let i = 0; i < count; i++) {
			const input = inputLocator.nth(i);
			if (!(await input.isVisible())) {
				continue;
			}

			const type = (await input.getAttribute("type")) ?? "text";
			if (type === "checkbox" || type === "hidden") {
				continue;
			}

			inputs.push(input);
		}

		return inputs;
	}

	private async currentRuleValue(index: number): Promise<DataTableFilterValue | undefined> {
		const rule = this.rule(index);
		const visibleInputs = await this.visibleFillableInputs(rule);

		if (visibleInputs.length >= 2) {
			const values = await Promise.all(visibleInputs.map((input) => input.inputValue()));
			return [values[0], values[1]];
		}

		if (visibleInputs.length === 1) {
			return await visibleInputs[0].inputValue();
		}

		const valueSelect = this.valueSelect(index);
		if (await valueSelect.count()) {
			return await this.selectedOptionLabel(valueSelect);
		}

		const switchControl = rule.getByRole("switch");
		if (await switchControl.count()) {
			return await switchControl.isChecked();
		}

		const checkbox = rule.getByRole("checkbox");
		if (await checkbox.count()) {
			return await checkbox.isChecked();
		}

		return undefined;
	}

	private async selectedOptionLabel(select: Locator): Promise<string> {
		return await select.evaluate((element) => {
			const selectElement = element as HTMLSelectElement;
			return selectElement.options[selectElement.selectedIndex]?.text ?? "";
		});
	}

	private async countVisibleBooleanControls(rule: Locator): Promise<number> {
		let total = 0;

		for (const locator of [rule.getByRole("switch"), rule.getByRole("checkbox")]) {
			const count = await locator.count();
			for (let i = 0; i < count; i++) {
				if (await locator.nth(i).isVisible()) {
					total += 1;
				}
			}
		}

		return total;
	}
}
