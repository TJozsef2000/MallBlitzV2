import { test } from "../../fixtures/pomManager";
import { createBrandInfoFaker } from "../../factories/brand.factory";
import { adminUserData } from "../../helpers/env.helper";

test.describe("Brand create page coverage", () => {
	let createdBrandNames: string[];

	test.describe.configure({ mode: "serial" });

	test.beforeEach(async ({ pomManager }) => {
		createdBrandNames = [];

		await pomManager.homePage.goToHomePage();
		await pomManager.homePage.clickSignInButton();
		await pomManager.loginPage.fillLoginEmail(adminUserData.email);
		await pomManager.loginPage.fillLoginPassword(adminUserData.password);
		await pomManager.loginPage.clickLoginButton();
		await pomManager.adminDashboardPage.verifyPage();

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

	test.skip("Create brand with optional fields and a valid logo", async ({ pomManager }) => {
		const brand = createBrandInfoFaker();
		createdBrandNames.push(brand.name);

		await pomManager.brandCreatePage.fillBrandName(brand.name);
		await pomManager.brandCreatePage.fillDescription(brand.description);
		await pomManager.brandCreatePage.fillWebsiteUrl(brand.websiteUrl);
		await pomManager.brandCreatePage.fillSortOrder(brand.sortOrder);
		await pomManager.brandCreatePage.selectStatus("Published");
		await pomManager.brandCreatePage.clickFeaturedBrandToggle();
		await pomManager.brandCreatePage.uploadBrandLogo("Valid");
		await pomManager.brandCreatePage.submitAndWaitForSuccess();

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
		await pomManager.brandCreatePage.uploadBrandLogo("Invalid");
		await pomManager.brandCreatePage.clickCreateBrandButton();
		await pomManager.brandCreatePage.verifyInvalidLogoError();
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
	// - Reject logo uploads larger than 10MB
	// - Support drag-and-drop logo upload during brand creation
});
