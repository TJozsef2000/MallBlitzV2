import { test } from "../../fixtures/pomManager";
import { testUserData } from "../../helpers/env.helper";

test.describe("Signup flow happy path", async () => {
	test.beforeEach("Go to home page", async ({ pomManager }) => {
		await pomManager.homePage.goToHomePage();
	});

	test("Successful register flow", async ({ pomManager }) => {
		let userData: {
			fullName: string;
			email: string;
			password: string;
		};

		await test.step("Verify home page and click register button", async () => {
			await pomManager.homePage.verifyPage();
			await pomManager.homePage.clickSignUpButton();
		});

		await test.step("Verify register page and complete registration", async () => {
			await pomManager.registerPage.verifyPage();
			userData = {
				fullName: await pomManager.registerPage.fillNameFieldAndReturnIt(),
				email: await pomManager.registerPage.fillEmailFieldAndReturnIt(),
				password: await pomManager.registerPage.fillPasswordFieldsAndReturnIt(),
			};
			await pomManager.registerPage.checkTermsBox();
			await pomManager.registerPage.clickRegisterButton();
		});

		await test.step("Verify user registered successfully", async () => {
			await pomManager.dashboardPage.verifyPage();
			await pomManager.dashboardPage.verifyRegistrationSuccessMessage();
			await pomManager.dashboardPage.verifyHeadingName(userData.fullName);
		});

		await test.step("Verify user details on profile page", async () => {
			await pomManager.header.clickDropdownProfile(userData.fullName);
			await pomManager.profilePage.verifyPage();
			await pomManager.profilePage.verifyUserFullName(userData.fullName);
			await pomManager.profilePage.verifyUserEmail(userData.email);
		});

		await test.step("Delete account and verify deletion", async () => {
			await pomManager.profilePage.clickDeleteAccountButton();
			await pomManager.profilePage.fillPasswordAndDeleteAccount(userData.password);
			await pomManager.loginPage.verifyPage();
			await pomManager.loginPage.verifyAccountDeletedText();
		});
	});
});

test.describe("Incorrect signup tests", async () => {
	test.beforeEach("Go to home page", async ({ pomManager }) => {
		await pomManager.homePage.goToHomePage();
	});
	test("Register with incorrect name", async ({ pomManager }) => {
		await test.step("Verify home page and click register button", async () => {
			await pomManager.homePage.verifyPage();
			await pomManager.homePage.clickSignUpButton();
		});

		await test.step("Verify page and try to register with incorrect name", async () => {
			await pomManager.registerPage.verifyPage();
			await pomManager.registerPage.fillNameFieldAndReturnIt("$$$$$");
			await pomManager.registerPage.fillEmailFieldAndReturnIt();
			await pomManager.registerPage.fillPasswordFieldsAndReturnIt();
			await pomManager.registerPage.checkTermsBox();
			await pomManager.registerPage.clickRegisterButton();
		});

		await test.step("Verify correct error message: 'The name field must only contain letters and spaces.'", async () => {
			await pomManager.registerPage.verifyErrorMessage("The name field must only contain letters and spaces.");
		});
	});

	test("Register with already used email", async ({ pomManager }) => {
		await test.step("Verify home page and click register button", async () => {
			await pomManager.homePage.verifyPage();
			await pomManager.homePage.clickSignUpButton();
		});

		await test.step("Verify page and try to register with incorrect name", async () => {
			await pomManager.registerPage.verifyPage();
			await pomManager.registerPage.fillNameFieldAndReturnIt();
			await pomManager.registerPage.fillEmailFieldAndReturnIt(testUserData.email);
			await pomManager.registerPage.fillPasswordFieldsAndReturnIt();
			await pomManager.registerPage.checkTermsBox();
			await pomManager.registerPage.clickRegisterButton();
		});

		await test.step("Verify correct error message: 'The email address has already been taken.'", async () => {
			await pomManager.registerPage.verifyErrorMessage("The email address has already been taken.");
		});
	});

	test("Register with incorrect password", async ({ pomManager }) => {
		await test.step("Verify home page and click register button", async () => {
			await pomManager.homePage.verifyPage();
			await pomManager.homePage.clickSignUpButton();
		});

		await test.step("Verify page and try to register with incorrect password", async () => {
			await pomManager.registerPage.verifyPage();
			await pomManager.registerPage.fillNameFieldAndReturnIt();
			await pomManager.registerPage.fillEmailFieldAndReturnIt();
			await pomManager.registerPage.fillPasswordFieldsAndReturnIt("incor");
			await pomManager.registerPage.checkTermsBox();
			await pomManager.registerPage.clickRegisterButton();
		});

		await test.step("Verify correct error message: 'The password must be at least 8 characters.'", async () => {
			await pomManager.registerPage.verifyErrorMessage("The password must be at least 8 characters.");
		});
	});

	test("Register without checking terms", async ({ pomManager }) => {
		await test.step("Verify home page and click register button", async () => {
			await pomManager.homePage.verifyPage();
			await pomManager.homePage.clickSignUpButton();
		});

		await test.step("Verify page and try to register with incorrect name", async () => {
			await pomManager.registerPage.verifyPage();
			await pomManager.registerPage.fillNameFieldAndReturnIt();
			await pomManager.registerPage.fillEmailFieldAndReturnIt();
			await pomManager.registerPage.fillPasswordFieldsAndReturnIt();

			await pomManager.registerPage.clickRegisterButton();
		});

		await test.step("Verify correct error message: 'You must accept the terms and conditions.'", async () => {
			await pomManager.registerPage.verifyErrorMessage("You must accept the terms and conditions.");
		});
	});
});
