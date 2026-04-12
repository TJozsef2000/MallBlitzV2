import { expect, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class BlogCategoryPage extends BasePage {
	constructor(protected readonly page: Page) {
		super(page);
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/blog\/category\/[^/]+$/);
	}

	async goToCategoryBySlug(slug: string): Promise<void> {
		await this.gotoAndWaitForReady(`/blog/category/${slug}`, async () => {
			await this.page.waitForLoadState("networkidle");
		});
	}

	getCurrentSlug(): string {
		const url = new URL(this.page.url());
		const match = /\/blog\/category\/([^/?#]+)/.exec(url.pathname);
		if (!match) {
			throw new Error(`Could not extract category slug from URL "${url.toString()}"`);
		}
		return match[1];
	}

	async verifyCanonical(expectedPath: string): Promise<void> {
		const canonical = this.page.locator('link[rel="canonical"]');
		await expect(canonical).toHaveAttribute("href", `https://mallblitz.com${expectedPath}`);
	}

	async expectAtLeastOneCard(): Promise<void> {
		await expect(this.page.locator('[data-test="blog-card"]').first()).toBeVisible();
	}

	async verifyCategoryLabelVisible(label: string): Promise<void> {
		// The category label appears in the page header / title area as a heading
		const heading = this.page.getByRole("heading", { name: label, exact: true }).first();
		await expect(heading).toBeVisible();
	}
}
