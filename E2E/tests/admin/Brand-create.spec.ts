import { adminTest as test, expect } from "../../fixtures/pomManager";
import { createBrandInfoFaker } from "../../factories/brand.factory";

const validLogoCases = [
	{
		fileName: "cat.png",
		filePath: "E2E/assets/cat.png",
		logoType: "PNG",
	},
	{
		fileName: "cat.jpg",
		filePath: "E2E/assets/cat.jpg",
		logoType: "JPG",
	},
] as const;

test.describe("Brand create page coverage", () => {
	let createdBrandNames: string[];

	test.describe.configure({ mode: "serial" });

	test.beforeEach(async ({ pomManager }) => {
		createdBrandNames = [];

		await pomManager.brandCreatePage.goToPage();
		await pomManager.brandCreatePage.verifyPage();
	});

	test.afterEach(async ({ pomManager }) => {
		for (const brandName of createdBrandNames) {
			await pomManager.brandsPage.goToPage();
			await pomManager.brandsPage.deleteBrandIfPresent(brandName);
		}
	});

	test("Create brand with only required fields", async ({ pomManager }) => {
		const brand = createBrandInfoFaker();
		createdBrandNames.push(brand.name);

		await pomManager.brandCreatePage.verifyCreateButtonDisabled();
		await pomManager.brandCreatePage.fillBrandName(brand.name);
		await pomManager.brandCreatePage.verifyCreateButtonEnabled();
		await pomManager.brandCreatePage.submitAndWaitForSuccess();
		await pomManager.brandCreatePage.verifyCreatedSuccessMessage();

		await pomManager.brandsPage.goToPage();
		await pomManager.brandsPage.searchBrand(brand.name);
		await pomManager.brandsPage.verifyBrandVisible(brand.name);
		await pomManager.brandsPage.verifyBrandRowValues(brand.name, {
			status: "draft",
			featured: "No",
			website: "-",
			order: "0",
		});
	});

	for (const logoCase of validLogoCases) {
		test(`Create brand with optional fields and a valid ${logoCase.logoType} logo`, async ({
			pomManager,
		}) => {
			const brand = createBrandInfoFaker();
			createdBrandNames.push(brand.name);

			await pomManager.brandCreatePage.fillBrandName(brand.name);
			await pomManager.brandCreatePage.fillDescription(brand.description);
			await pomManager.brandCreatePage.fillWebsiteUrl(brand.websiteUrl);
			await pomManager.brandCreatePage.fillSortOrder(brand.sortOrder);
			await pomManager.brandCreatePage.selectStatus("Published");
			await pomManager.brandCreatePage.clickFeaturedBrandToggle();
			await pomManager.brandCreatePage.uploadBrandLogo(logoCase.filePath);
			await pomManager.brandCreatePage.verifyUploadedLogoFileName(logoCase.fileName);
			await pomManager.brandCreatePage.submitAndWaitForSuccess();
			await pomManager.brandCreatePage.verifyCreatedSuccessMessage();

			await pomManager.brandsPage.goToPage();
			await pomManager.brandsPage.searchBrand(brand.name);
			await pomManager.brandsPage.verifyBrandVisible(brand.name);
			await pomManager.brandsPage.verifyBrandRowValues(brand.name, {
				status: "published",
				featured: "Yes",
				website: brand.websiteUrl,
				order: brand.sortOrder,
			});
		});
	}

	test("Cancel brand creation without saving", async ({ pomManager }) => {
		const brand = createBrandInfoFaker();

		await pomManager.brandCreatePage.fillBrandName(brand.name);
		await pomManager.brandCreatePage.fillDescription(brand.description);
		await pomManager.brandCreatePage.clickCancelButton();

		await pomManager.brandsPage.verifyPage();
		await pomManager.brandsPage.searchBrand(brand.name);
		await pomManager.brandsPage.verifyNoBrandsFound();
	});

	test("Show validation for whitespace-only brand name", async ({ pomManager }) => {
		await pomManager.brandCreatePage.fillBrandName("   ");
		await pomManager.brandCreatePage.verifyBrandNameRequiredError();
		await pomManager.brandCreatePage.verifyCreateButtonDisabled();
	});

	test("Block invalid website URLs", async ({ pomManager }) => {
		const brand = createBrandInfoFaker();

		await pomManager.brandCreatePage.fillBrandName(brand.name);
		await pomManager.brandCreatePage.fillWebsiteUrl("not-a-url");
		await pomManager.brandCreatePage.verifyInvalidWebsiteUrlError();
		await pomManager.brandCreatePage.verifyCreateButtonDisabled();
	});

	test("Block negative sort order values", async ({ pomManager }) => {
		const brand = createBrandInfoFaker();

		await pomManager.brandCreatePage.fillBrandName(brand.name);
		await pomManager.brandCreatePage.fillSortOrder("-1");
		await pomManager.brandCreatePage.verifyInvalidSortOrderError();
		await pomManager.brandCreatePage.verifyCreateButtonDisabled();
	});

	test("Reject non-image logo uploads", async ({ pomManager }) => {
		const brand = createBrandInfoFaker();

		await pomManager.brandCreatePage.fillBrandName(brand.name);
		await pomManager.brandCreatePage.uploadBrandLogo("E2E/assets/textFile.txt");
		await pomManager.brandCreatePage.verifyUploadedLogoFileName("textFile.txt");
		await pomManager.brandCreatePage.clickCreateBrandButton();
		await pomManager.brandCreatePage.verifyInvalidLogoError();
	});

	test("Reject GIF logo uploads", async ({ pomManager }) => {
		const brand = createBrandInfoFaker();

		await pomManager.brandCreatePage.fillBrandName(brand.name);
		await pomManager.brandCreatePage.uploadBrandLogo("E2E/assets/sample.gif");
		await pomManager.brandCreatePage.verifyUploadedLogoFileName("sample.gif");

		const response = await pomManager.brandCreatePage.submitAndWaitForCreateResponse();

		expect(response.status()).toBe(422);
		await pomManager.brandCreatePage.verifyInvalidLogoError("Logo must be an image file (jpeg, png, jpg).");

		await pomManager.brandsPage.goToPage();
		await pomManager.brandsPage.searchBrand(brand.name);
		await pomManager.brandsPage.verifyNoBrandsFound();
	});

	test("Reject oversized JPG logo uploads", async ({ pomManager }) => {
		const brand = createBrandInfoFaker();

		await pomManager.brandCreatePage.fillBrandName(brand.name);
		await pomManager.brandCreatePage.uploadBrandLogo("E2E/assets/9MB_picture.jpg");
		await pomManager.brandCreatePage.verifyUploadedLogoFileName("9MB_picture.jpg");

		const response = await pomManager.brandCreatePage.submitAndWaitForCreateResponse();

		expect(response.status()).toBe(422);
		await pomManager.brandCreatePage.verifyInvalidLogoError("Logo file size cannot exceed 2MB.");

		await pomManager.brandsPage.goToPage();
		await pomManager.brandsPage.searchBrand(brand.name);
		await pomManager.brandsPage.verifyNoBrandsFound();
	});

	test("Block JFIF logo uploads without creating the brand", async ({ pomManager }) => {
		const brand = createBrandInfoFaker();

		await pomManager.brandCreatePage.fillBrandName(brand.name);
		await pomManager.brandCreatePage.uploadBrandLogo("E2E/assets/cat.jfif");
		await pomManager.brandCreatePage.verifyUploadedLogoFileName("cat.jfif");

		const response = await pomManager.brandCreatePage.submitAndWaitForCreateResponse();

		expect(response.ok()).toBeFalsy();
		await pomManager.brandCreatePage.verifyPage();

		await pomManager.brandsPage.goToPage();
		await pomManager.brandsPage.searchBrand(brand.name);
		await pomManager.brandsPage.verifyNoBrandsFound();
	});

	test("Reject duplicate brand names", async ({ pomManager }) => {
		const brand = createBrandInfoFaker();
		createdBrandNames.push(brand.name);

		await pomManager.brandCreatePage.fillBrandName(brand.name);
		await pomManager.brandCreatePage.submitAndWaitForSuccess();

		await pomManager.brandCreatePage.goToPage();
		await pomManager.brandCreatePage.fillBrandName(brand.name);
		await pomManager.brandCreatePage.clickCreateBrandButton();
		await pomManager.brandCreatePage.verifyDuplicateBrandError();
		await pomManager.brandCreatePage.verifyCreateButtonDisabled();
	});

	// Additional create-page coverage to automate next:
	// - Support drag-and-drop logo upload during brand creation
});
