import { test as baseTest, userTest } from "../../fixtures/pomManager";
import { testUserData } from "../../helpers/env.helper";

userTest.describe("Profile page tests using preset user", async () => {
	userTest.beforeEach("Open profile page", async ({ pomManager }) => {
		await pomManager.profilePage.goToPage();
		await pomManager.profilePage.verifyPage();
		await pomManager.profilePage.verifyUserFullName(testUserData.fullName);
	});

	userTest("Upload avatar with invalid file type", async ({ pomManager }) => {
		await pomManager.profilePage.uploadAvatar("Invalid");
		await pomManager.profilePage.verifyAvatarErrorMessage();
	});

	userTest("Change full name to empty string", async ({ pomManager }) => {
		await pomManager.profilePage.changeAndGetName("");
		await pomManager.profilePage.savePersonalInfo();
		await pomManager.profilePage.verifyNameErrorMessage();
	});

	userTest("Change email address to valid email without incorrect password", async ({ pomManager }) => {
		await pomManager.profilePage.changeCurrentEmailAndReturnIt();
		await pomManager.profilePage.enterPasswordForEmailChange("Invalidpass");
		await pomManager.profilePage.clickUpdateEmail();
		await pomManager.profilePage.verifyPasswordIncorrectErrorMessage();
	});
});

baseTest.describe("Profile page tests - using new users", async () => {
	let userData: {
		fullName: string;
		email: string;
		password: string;
	};

	baseTest.beforeEach("Complete registration", async ({ pomManager }) => {
		await pomManager.homePage.goToHomePage();
		await pomManager.homePage.verifyPage();
		await pomManager.homePage.clickSignUpButton();

		await pomManager.registerPage.verifyPage();
		userData = {
			fullName: await pomManager.registerPage.fillNameFieldAndReturnIt(),
			email: await pomManager.registerPage.fillEmailFieldAndReturnIt(),
			password: await pomManager.registerPage.fillPasswordFieldsAndReturnIt(),
		};

		await pomManager.registerPage.checkTermsBox();
		await pomManager.registerPage.clickRegisterButton();

		await pomManager.dashboardPage.verifyPage();
		await pomManager.dashboardPage.verifyRegistrationSuccessMessage();
		await pomManager.dashboardPage.verifyHeadingName(userData.fullName);
		await pomManager.header.clickDropdownProfile(userData.fullName);
	});

	baseTest.afterEach("Cleanup - delete account", async ({ pomManager }) => {
		await pomManager.profilePage.clickDeleteAccountButton();
		await pomManager.profilePage.fillPasswordAndDeleteAccount(userData.password);
		await pomManager.loginPage.verifyPage();
		await pomManager.loginPage.verifyAccountDeletedText();
	});

	baseTest("Change full name", async ({ pomManager }) => {
		userData.fullName = await pomManager.profilePage.changeAndGetName("John Wick");
		await pomManager.profilePage.savePersonalInfo();
		await pomManager.profilePage.verifyUserFullName(userData.fullName);
	});

	baseTest("Change email address to valid email with valid password", async ({ pomManager }) => {
		userData.email = await pomManager.profilePage.changeCurrentEmailAndReturnIt();
		await pomManager.profilePage.enterPasswordForEmailChange(userData.password);
		await pomManager.profilePage.clickUpdateEmail();
		await pomManager.profilePage.verifyUserEmail(userData.email);
	});

	baseTest("Update password", async ({ pomManager }) => {
		await pomManager.profilePage.fillCurrentPassword(userData.password);
		await pomManager.profilePage.fillNewPassAndConfirmPassFields();
		await pomManager.profilePage.clickSavePassword();
	});
});
