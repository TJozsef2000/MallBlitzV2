import { expect, Page } from "@playwright/test";
import { BasePage } from "../../BasePage";

export class TagViewPage extends BasePage {
	constructor(protected readonly page: Page) {
		super(page);
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/admin\/blog\/tags\/\d+$/);
	}

	async verifyName(name: string): Promise<void> {
		await expect(this.page.getByRole("heading", { name, exact: true }).first()).toBeVisible();
	}

	async verifyPostsCount(count: number): Promise<void> {
		await expect(
			this.page.getByRole("heading", { name: new RegExp(`Posts with this Tag \\(${count}\\)`) }),
		).toBeVisible();
	}
}
