import { expect, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class BlogTagPage extends BasePage {
	constructor(protected readonly page: Page) {
		super(page);
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/blog\/tag\/[^/]+$/);
	}

	async goToTagBySlug(slug: string): Promise<void> {
		await this.gotoAndWaitForReady(`/blog/tag/${slug}`, async () => {
			await this.page.waitForLoadState("networkidle");
		});
	}

	getCurrentSlug(): string {
		const url = new URL(this.page.url());
		const match = /\/blog\/tag\/([^/?#]+)/.exec(url.pathname);
		if (!match) {
			throw new Error(`Could not extract tag slug from URL "${url.toString()}"`);
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

	async verifyTagLabelVisible(label: string): Promise<void> {
		// Tag pages render the label as something like "#Laravel" in a heading
		const heading = this.page.getByRole("heading", { name: new RegExp(`^#?${label}$`, "i") }).first();
		await expect(heading).toBeVisible();
	}
}
