import { test } from "../../fixtures/pomManager";

test.describe("Search field tests", () => {
	test.beforeEach("Go to blog page", async ({ pomManager }) => {
		await pomManager.blogPage.goToBlogPage();
	});

	test("Enter correct search term", async ({ pomManager }) => {
		await pomManager.blogPage.fillSearchField("Dolore");
		await pomManager.blogPage.clickOnArticleByIndex(0);
		await pomManager.blogPage.verifyKeywordInArticle("Dolore");
	});

	test("Enter invalid search term", async ({ pomManager }) => {
		await pomManager.blogPage.fillSearchField("$$$$$");
		await pomManager.blogPage.verifyNoArticlesFound();
	});
});
