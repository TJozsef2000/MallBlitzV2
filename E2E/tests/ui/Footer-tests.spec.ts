import { test } from "../../fixtures/pomManager";

test.describe("Footer flows", () => {
	test.beforeEach("Go to blog page", async ({ pomManager }) => {
		await pomManager.blogPage.goToBlogPage();
	});

	test("Contact us flow", async ({ pomManager }) => {
		await test.step("Click contact us on Home page footer", async () => {
			await pomManager.footer.clickFooterContactUs();
		});

		await test.step("Fill info and send message", async () => {
			await pomManager.contactUsPage.verifyPage();
			await pomManager.contactUsPage.fillNameField();
			await pomManager.contactUsPage.fillEmailField();
			await pomManager.contactUsPage.fillSubjectField();
			await pomManager.contactUsPage.fillMessageField();
			await pomManager.contactUsPage.clickSendMessageButton();
		});

		await test.step("Verify successful submission", async () => {
			await pomManager.contactUsPage.verifySuccessMessage();
		});
	});

	test("TOS page verification", async ({ pomManager }) => {
		await pomManager.footer.clickFooterTOS();
		await pomManager.TOSPage.verifyPage();
	});

	test("Privacy policy page verification", async ({ pomManager }) => {
		await pomManager.footer.clickFooterPrivacy();
		await pomManager.privacyPage.verifyPage();
	});

	test("Cookies policy page verification", async ({ pomManager }) => {
		await pomManager.footer.clickFooterCookies();
		await pomManager.cookiesPage.verifyPage();
	});
});
