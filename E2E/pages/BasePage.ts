import { expect, Locator, Page } from "@playwright/test";

export abstract class BasePage {
	constructor(protected readonly page: Page) {}

	protected async goToHomePage() {
		await this.page.goto("");
	}

	protected async gotoAndWaitForReady(
		url: string,
		ready: Locator | (() => Promise<void>),
	): Promise<void> {
		await this.page.goto(url, { waitUntil: "domcontentloaded" });

		if (typeof ready === "function") {
			await ready();
			return;
		}

		await expect(ready).toBeVisible();
	}

	public abstract verifyPage(): Promise<void>;
}
