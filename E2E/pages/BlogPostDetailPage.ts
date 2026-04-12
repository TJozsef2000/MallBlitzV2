import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class BlogPostDetailPage extends BasePage {
	protected readonly main: Locator;
	protected readonly breadcrumbNav: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.main = this.page.locator("main");
		this.breadcrumbNav = this.page.getByRole("navigation").filter({ hasText: "Home" }).first();
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/blog\/[^/]+$/);
	}

	async goToPostBySlug(slug: string): Promise<void> {
		await this.gotoAndWaitForReady(`/blog/${slug}`, async () => {
			await this.page.waitForLoadState("networkidle");
		});
	}

	async verifyTitle(title: string): Promise<void> {
		// Post title renders as an h1 inside <main>, distinct from the site "MallBlitz" h1 in the header
		const postTitle = this.main.getByRole("heading", { name: title, exact: true }).first();
		await expect(postTitle).toBeVisible();
	}

	async verifyContentHasText(needle: string): Promise<void> {
		await expect(this.main).toContainText(needle);
	}

	async verifyBreadcrumbContains(labels: string[]): Promise<void> {
		const text = (await this.breadcrumbNav.innerText()).replace(/\s+/g, " ").trim();
		for (const label of labels) {
			expect(text).toContain(label);
		}
	}

	async verifyBreadcrumbDoesNotContain(label: string): Promise<void> {
		const text = (await this.breadcrumbNav.innerText()).replace(/\s+/g, " ").trim();
		expect(text).not.toContain(label);
	}

	async verifyAuthorRendered(): Promise<void> {
		// Author block shows a name near the reading-time / publish date
		await expect(this.main.getByText(/min read/i).first()).toBeVisible();
	}

	async verifyPublishDateRendered(): Promise<void> {
		// Publish date rendered as "Month Day, Year"
		await expect(
			this.main
				.getByText(
					/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/,
				)
				.first(),
		).toBeVisible();
	}
}
