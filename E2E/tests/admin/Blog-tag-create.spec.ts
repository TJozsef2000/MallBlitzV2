import { adminTest as test } from "../../fixtures/pomManager";
import { createBlogTagFaker } from "../../factories/blog-tag.factory";

test.describe("Blog tag admin coverage", () => {
	let createdTagNames: string[];

	test.describe.configure({ mode: "serial" });

	test.beforeEach(() => {
		createdTagNames = [];
	});

	test.afterEach(async ({ pomManager }) => {
		for (const name of createdTagNames) {
			await pomManager.tagsPage.goToPage();
			await pomManager.tagsPage.deleteTagIfPresent(name);
		}
	});

	// ADM-TAG-001: Admin can create a tag
	test("ADM-TAG-001 Admin can create a tag", async ({ pomManager }) => {
		const tag = createBlogTagFaker();
		createdTagNames.push(tag.name);

		await pomManager.tagCreatePage.goToPage();
		await pomManager.tagCreatePage.verifyPage();
		await pomManager.tagCreatePage.fillTagName(tag.name);
		await pomManager.tagCreatePage.fillDescription(tag.description);
		await pomManager.tagCreatePage.submitAndWaitForSuccess();

		await pomManager.tagsPage.goToPage();
		await pomManager.tagsPage.searchTag(tag.name);
		await pomManager.tagsPage.verifyTagVisible(tag.name);
	});

	// ADM-TAG-002: Admin can edit a tag (rename + change description)
	test("ADM-TAG-002 Admin can edit a tag", async ({ pomManager }) => {
		const original = createBlogTagFaker();
		const edited = createBlogTagFaker();
		createdTagNames.push(edited.name);

		await pomManager.tagCreatePage.goToPage();
		await pomManager.tagCreatePage.fillTagName(original.name);
		await pomManager.tagCreatePage.fillDescription(original.description);
		await pomManager.tagCreatePage.submitAndWaitForSuccess();

		await pomManager.tagsPage.goToPage();
		await pomManager.tagsPage.openEditForTag(original.name);
		await pomManager.tagEditPage.verifyPage();
		await pomManager.tagEditPage.expectTagNameValue(original.name);
		await pomManager.tagEditPage.fillTagName(edited.name);
		await pomManager.tagEditPage.fillDescription(edited.description);
		await pomManager.tagEditPage.submitAndWaitForSuccess();

		await pomManager.tagsPage.goToPage();
		await pomManager.tagsPage.searchTag(edited.name);
		await pomManager.tagsPage.verifyTagVisible(edited.name);

		await pomManager.tagsPage.goToPage();
		await pomManager.tagsPage.searchTag(original.name);
		await pomManager.tagsPage.verifyNoTagsFound();
	});

	// ADM-TAG-003: Duplicate tag name is blocked
	test("ADM-TAG-003 Duplicate tag name is blocked", async ({ pomManager }) => {
		const tag = createBlogTagFaker();
		createdTagNames.push(tag.name);

		await pomManager.tagCreatePage.goToPage();
		await pomManager.tagCreatePage.fillTagName(tag.name);
		await pomManager.tagCreatePage.submitAndWaitForSuccess();

		await pomManager.tagCreatePage.goToPage();
		await pomManager.tagCreatePage.fillTagName(tag.name);
		await pomManager.tagCreatePage.clickCreateTagButton();
		await pomManager.tagCreatePage.verifyDuplicateTagError();
		await pomManager.tagCreatePage.verifyPage();
	});

	// ADM-TAG-004: Tag detail page shows accurate posts count
	test("ADM-TAG-004 Tag detail page shows accurate posts count", async ({ pomManager }) => {
		// Use a seeded tag that has posts
		await pomManager.tagsPage.goToPage();
		// Get posts count from the first tag row (seeded data)
		const firstTagName = "Laravel";
		await pomManager.tagsPage.searchTag(firstTagName);
		const postsCount = await pomManager.tagsPage.getPostsCountFromRow(firstTagName);

		await pomManager.tagsPage.openViewForTag(firstTagName);
		await pomManager.tagViewPage.verifyPage();
		await pomManager.tagViewPage.verifyName(firstTagName);
		await pomManager.tagViewPage.verifyPostsCount(postsCount);
	});

	// ADM-TAG-005 (delete portion only): Admin can delete a tag
	// NOTE: The "restore" half of ADM-TAG-005 is deferred — there is no Restore row action
	// in the live admin and the trash/restore UI flow needs separate discovery.
	test("ADM-TAG-005 Admin can delete a tag", async ({ pomManager }) => {
		const tag = createBlogTagFaker();

		await pomManager.tagCreatePage.goToPage();
		await pomManager.tagCreatePage.fillTagName(tag.name);
		await pomManager.tagCreatePage.submitAndWaitForSuccess();

		await pomManager.tagsPage.goToPage();
		await pomManager.tagsPage.searchTag(tag.name);
		await pomManager.tagsPage.verifyTagVisible(tag.name);
		await pomManager.tagsPage.deleteTagIfPresent(tag.name);

		await pomManager.tagsPage.searchTag(tag.name);
		await pomManager.tagsPage.verifyNoTagsFound();
	});

	// ADM-TAG-006: Bulk delete tags removes all selected tags
	test("ADM-TAG-006 Bulk delete tags removes selected tags", async ({ pomManager }) => {
		const tagA = createBlogTagFaker();
		const tagB = createBlogTagFaker();
		// Safety net — afterEach will clean if bulk delete fails partway
		createdTagNames.push(tagA.name, tagB.name);

		// Create two fresh tags
		await pomManager.tagCreatePage.goToPage();
		await pomManager.tagCreatePage.fillTagName(tagA.name);
		await pomManager.tagCreatePage.submitAndWaitForSuccess();

		await pomManager.tagCreatePage.goToPage();
		await pomManager.tagCreatePage.fillTagName(tagB.name);
		await pomManager.tagCreatePage.submitAndWaitForSuccess();

		// Search by the shared "Tag " prefix so both rows appear together, then
		// select them individually — avoids catching unrelated seeded rows.
		await pomManager.tagsPage.goToPage();
		await pomManager.tagsPage.searchTag("Tag ");
		await pomManager.tagsPage.selectTagRow(tagA.name);
		await pomManager.tagsPage.selectTagRow(tagB.name);
		await pomManager.tagsPage.table.expectSelectedCount(2);

		await pomManager.tagsPage.bulkDeleteSelected();

		// Both tags should no longer be present
		await pomManager.tagsPage.goToPage();
		await pomManager.tagsPage.searchTag(tagA.name);
		await pomManager.tagsPage.verifyNoTagsFound();
		await pomManager.tagsPage.goToPage();
		await pomManager.tagsPage.searchTag(tagB.name);
		await pomManager.tagsPage.verifyNoTagsFound();
	});
});
