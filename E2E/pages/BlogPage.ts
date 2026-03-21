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
		await expect(this.page).toHaveURL("https://mallblitz.com/blog");
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

	// === Articles ===

	async verifyKeywordInArticle(keyWord: string): Promise<void> {
		await expect(this.page.locator("#__nuxt")).toContainText(keyWord);
	}
}
