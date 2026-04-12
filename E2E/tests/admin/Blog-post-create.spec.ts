import { expect } from "@playwright/test";
import { adminTest as test } from "../../fixtures/pomManager";
import { createBlogPostFaker } from "../../factories/blog-post.factory";

test.describe("Blog post admin coverage", () => {
	let createdPostTitles: string[];

	test.describe.configure({ mode: "serial" });

	test.beforeEach(() => {
		createdPostTitles = [];
	});

	test.afterEach(async ({ pomManager }) => {
		for (const title of createdPostTitles) {
			await pomManager.blogPostsPage.goToPage();
			await pomManager.blogPostsPage.deletePostIfPresent(title);
		}
	});

	// ADM-POST-001: Create a draft blog post with minimal fields
	test("ADM-POST-001 Admin can create a draft blog post", async ({ pomManager }) => {
		const post = createBlogPostFaker();
		createdPostTitles.push(post.title);

		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.verifyPage();
		await pomManager.blogPostCreatePage.fillTitle(post.title);
		await pomManager.blogPostCreatePage.fillExcerpt(post.excerpt);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(post.title);
		await pomManager.blogPostsPage.verifyPostVisible(post.title);
		await pomManager.blogPostsPage.verifyPostStatus(post.title, "Draft");
	});

	// ADM-POST-002: Create a published blog post
	test("ADM-POST-002 Admin can create a published blog post", async ({ pomManager }) => {
		const post = createBlogPostFaker();
		createdPostTitles.push(post.title);

		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(post.title);
		await pomManager.blogPostCreatePage.fillExcerpt(post.excerpt);
		await pomManager.blogPostCreatePage.selectStatus("published");
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(post.title);
		await pomManager.blogPostsPage.verifyPostVisible(post.title);
		await pomManager.blogPostsPage.verifyPostStatus(post.title, "Published");
	});

	// ADM-POST-003: Creating without categories attaches the default category
	test("ADM-POST-003 Creating without categories attaches default category", async ({ pomManager }) => {
		const post = createBlogPostFaker();
		createdPostTitles.push(post.title);

		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(post.title);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(post.title);
		await pomManager.blogPostsPage.verifyPostVisible(post.title);
		await pomManager.blogPostsPage.verifyPostCategory(post.title, "Uncategorized");
	});

	// ADM-POST-006: Edit a post's title and excerpt
	test("ADM-POST-006 Admin can edit a post", async ({ pomManager }) => {
		const original = createBlogPostFaker();
		const edited = createBlogPostFaker();
		createdPostTitles.push(edited.title);

		// Create original post
		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(original.title);
		await pomManager.blogPostCreatePage.fillExcerpt(original.excerpt);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		// Edit it
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.openEditForPost(original.title);
		await pomManager.blogPostEditPage.verifyPage();
		await pomManager.blogPostEditPage.expectTitleValue(original.title);
		await pomManager.blogPostEditPage.fillTitle(edited.title);
		await pomManager.blogPostEditPage.fillExcerpt(edited.excerpt);
		await pomManager.blogPostEditPage.submitAndWaitForSuccess();

		// Verify
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(edited.title);
		await pomManager.blogPostsPage.verifyPostVisible(edited.title);
		await pomManager.blogPostsPage.verifyPostAbsent(original.title);
	});

	// ADM-POST-007: Publish a draft post via row action
	test("ADM-POST-007 Admin can publish a draft post", async ({ pomManager }) => {
		const post = createBlogPostFaker();
		createdPostTitles.push(post.title);

		// Create as draft
		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(post.title);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		// Publish via row action
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.publishPost(post.title);

		// Verify status changed
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(post.title);
		await pomManager.blogPostsPage.verifyPostStatus(post.title, "Published");
	});

	// ADM-POST-008: Toggle featured status
	test("ADM-POST-008 Admin can toggle featured status", async ({ pomManager }) => {
		const post = createBlogPostFaker();
		createdPostTitles.push(post.title);

		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(post.title);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		// Verify initially not featured
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(post.title);
		await pomManager.blogPostsPage.verifyPostFeatured(post.title, "No");

		// Toggle featured ON
		await pomManager.blogPostsPage.toggleFeatured(post.title);
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(post.title);
		await pomManager.blogPostsPage.verifyPostFeatured(post.title, "Yes");

		// Toggle featured OFF
		await pomManager.blogPostsPage.toggleFeatured(post.title);
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(post.title);
		await pomManager.blogPostsPage.verifyPostFeatured(post.title, "No");
	});

	// ADM-POST-009: Duplicate a post
	test("ADM-POST-009 Admin can duplicate a post", async ({ page, pomManager }) => {
		const post = createBlogPostFaker();
		createdPostTitles.push(post.title);

		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(post.title);
		await pomManager.blogPostCreatePage.fillExcerpt(post.excerpt);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		// Duplicate from list
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.duplicatePost(post.title);

		// Verify a second post exists with the same or similar title
		// The duplicate stays on the list page — search for original title to find both
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(post.title);

		// There should be at least 2 rows containing the original title
		const rows = page.locator("tbody tr").filter({ hasText: post.title });
		await expect(rows).toHaveCount(2);

		// Cleanup: also delete the duplicate (afterEach only cleans by exact title match)
		// Delete all matching rows
		await pomManager.blogPostsPage.deletePostIfPresent(post.title);
		await pomManager.blogPostsPage.goToPage();
	});

	// ADM-POST-010: Delete a post
	test("ADM-POST-010 Admin can delete a post", async ({ pomManager }) => {
		const post = createBlogPostFaker();

		// Create a post
		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(post.title);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		// Delete it
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(post.title);
		await pomManager.blogPostsPage.verifyPostVisible(post.title);
		await pomManager.blogPostsPage.deletePostIfPresent(post.title);

		// Verify gone
		await pomManager.blogPostsPage.searchPost(post.title);
		await pomManager.blogPostsPage.verifyPostAbsent(post.title);
	});

	// ADM-POST-011: Bulk delete works
	test("ADM-POST-011 Bulk delete removes selected posts", async ({ pomManager }) => {
		// Use a shared prefix so both posts appear in the same search
		const prefix = `BulkDel-${Date.now()}`;
		const title1 = `${prefix}-A`;
		const title2 = `${prefix}-B`;

		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(title1);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(title2);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		// Search by prefix to show both, then select all
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(prefix);
		await pomManager.blogPostsPage.table.selectAllVisible();

		// Bulk delete
		await pomManager.blogPostsPage.bulkDeleteSelected();

		// Verify both gone
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.verifyPostAbsent(title1);
		await pomManager.blogPostsPage.verifyPostAbsent(title2);
	});

	// ADM-POST-012: Bulk status update
	test("ADM-POST-012 Bulk status change updates selected posts", async ({ pomManager }) => {
		const prefix = `BulkStat-${Date.now()}`;
		const title1 = `${prefix}-A`;
		const title2 = `${prefix}-B`;
		createdPostTitles.push(title1, title2);

		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(title1);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(title2);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		// Search by prefix to show both, then select all
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(prefix);
		await pomManager.blogPostsPage.table.selectAllVisible();

		// Bulk publish
		await pomManager.blogPostsPage.bulkChangeStatus("Publish Selected");

		// Verify both published
		await pomManager.blogPostsPage.goToPage();
		await pomManager.blogPostsPage.searchPost(title1);
		await pomManager.blogPostsPage.verifyPostStatus(title1, "Published");

		await pomManager.blogPostsPage.searchPost(title2);
		await pomManager.blogPostsPage.verifyPostStatus(title2, "Published");
	});

	// ADM-POST-013: Slug uniqueness validation
	test("ADM-POST-013 Slug uniqueness is enforced", async ({ pomManager }) => {
		const post1 = createBlogPostFaker();
		const post2 = createBlogPostFaker();
		createdPostTitles.push(post1.title);

		// Create first post
		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(post1.title);
		await pomManager.blogPostCreatePage.fillSlug(post1.slug);
		await pomManager.blogPostCreatePage.submitAndWaitForSuccess();

		// Try creating second post with same slug
		await pomManager.blogPostCreatePage.goToPage();
		await pomManager.blogPostCreatePage.fillTitle(post2.title);
		await pomManager.blogPostCreatePage.fillSlug(post1.slug);
		await pomManager.blogPostCreatePage.clickCreatePostButton();

		await pomManager.blogPostCreatePage.verifySlugDuplicateError();
		await pomManager.blogPostCreatePage.verifyPage();
	});
});
