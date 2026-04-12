import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class BlogPage extends BasePage {
	// === Search ===
	protected readonly searchField: Locator;
	protected readonly noArticlesText: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.searchField = page.getByRole("searchbox", { name: "Search articles..." });
		this.noArticlesText = page.getByRole("heading", { name: "No articles found" });
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/https:\/\/mallblitz\.com\/blog(\?.*)?$/);
	}

	async goToBlogPage(): Promise<void> {
		await this.gotoAndWaitForReady("/blog", async () => {
			await this.page.waitForLoadState("networkidle");
			await expect(this.searchField).toBeEditable();
		});
	}

	async clickOnArticleByIndex(index: number): Promise<void> {
		const article = this.page.locator('[data-test="blog-card"]').nth(index);
		await article.click();
	}

	// === Search ===
	async fillSearchField(query: string): Promise<void> {
		await expect(this.searchField).toBeEditable();
		await this.searchField.click();
		await expect(this.searchField).toBeInViewport();
		await this.searchField.fill(query);
	}

	async verifyNoArticlesFound(): Promise<void> {
		await this.noArticlesText.scrollIntoViewIfNeeded();
		await expect(this.noArticlesText).toBeVisible();
	}

	async verifySearchUrl(query: string): Promise<void> {
		await expect(this.page).toHaveURL(new RegExp(`[?&]search=${encodeURIComponent(query)}`));
	}

	// === Articles ===

	async verifyKeywordInArticle(keyWord: string): Promise<void> {
		await expect(this.page.locator("#__nuxt")).toContainText(keyWord);
	}

	// === Cards ===
	private cardsLocator(): Locator {
		return this.page.locator('[data-test="blog-card"]');
	}

	async waitForCards(): Promise<void> {
		await expect(this.cardsLocator().first()).toBeVisible();
	}

	async getCardCount(): Promise<number> {
		return await this.cardsLocator().count();
	}

	async expectAtLeastOneCard(): Promise<void> {
		await expect(this.cardsLocator().first()).toBeVisible();
	}

	async getFirstCardTitle(): Promise<string> {
		const heading = this.cardsLocator().first().getByRole("heading").first();
		await expect(heading).toBeVisible();
		return (await heading.innerText()).trim();
	}

	async getFirstCardHrefByPattern(pattern: RegExp): Promise<string | null> {
		const links = this.cardsLocator().first().locator("a");
		const count = await links.count();
		for (let i = 0; i < count; i++) {
			const href = await links.nth(i).getAttribute("href");
			if (href && pattern.test(href)) {
				return href;
			}
		}
		return null;
	}

	async clickFirstCardTitle(): Promise<void> {
		// The title link is a /blog/{slug} link inside the card (not a /blog/category/ or /blog/tag/ link).
		const titleLink = this.cardsLocator()
			.first()
			.locator('a[href^="/blog/"]:not([href*="/category/"]):not([href*="/tag/"])')
			.last();
		await titleLink.click();
	}

	async clickFirstCardCategoryLink(): Promise<void> {
		const link = this.cardsLocator().first().locator('a[href^="/blog/category/"]').first();
		await link.click();
	}

	async clickFirstCardTagLink(): Promise<void> {
		const link = this.cardsLocator().first().locator('a[href^="/blog/tag/"]').first();
		await link.click();
	}

	// === Pagination ===
	async clickNextPage(): Promise<void> {
		await this.page.getByRole("button", { name: "Next" }).click();
		await this.page.waitForLoadState("networkidle");
	}

	async clickPreviousPage(): Promise<void> {
		await this.page.getByRole("button", { name: "Previous" }).click();
		await this.page.waitForLoadState("networkidle");
	}

	async verifyPageQuery(pageNumber: number): Promise<void> {
		await expect
			.poll(() => {
				const url = new URL(this.page.url());

				if (url.origin !== "https://mallblitz.com" || url.pathname !== "/blog") {
					return false;
				}

				const pageParam = url.searchParams.get("page");

				if (pageNumber === 1) {
					return pageParam === null || pageParam === "1";
				}

				return pageParam === String(pageNumber);
			})
			.toBe(true);
	}

}
