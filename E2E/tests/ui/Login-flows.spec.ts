import { test } from "../../fixtures/pomManager";
import { testUserData } from "../../helpers/env.helper";

test.describe("Login flow happy path", () => {
	test.beforeEach("Go to home page", async ({ pomManager }) => {
		await pomManager.homePage.goToHomePage();
	});

	test("Successful login flow", async ({ pomManager }) => {
		await test.step("Go to login page and login with valid credentials", async () => {
			await pomManager.homePage.clickSignInButton();
			await pomManager.loginPage.login({
				email: testUserData.email,
				password: testUserData.password,
				rememberMe: true,
			});
		});

		await test.step("Verify successful login", async () => {
			await pomManager.dashboardPage.verifyPage();
			await pomManager.dashboardPage.verifyHeadingName(testUserData.fullName);
		});

		await test.step("Go to profile page and verify user data", async () => {
			await pomManager.header.clickDropdownProfile(testUserData.fullName);
			await pomManager.profilePage.verifyPage();
			await pomManager.profilePage.verifyUserFullName(testUserData.fullName);
			await pomManager.profilePage.verifyUserEmail(testUserData.email);
		});

		await test.step("Logout and verify message", async () => {
			await pomManager.header.clickDropdownSignOut(testUserData.fullName);
			await pomManager.loginPage.verifyUserLoggedOutText();
		});
	});
});

test.describe("Incorrect login tests", () => {
	test.beforeEach("Go to home page", async ({ pomManager }) => {
		await pomManager.homePage.goToHomePage();
	});

	test("Incorrect email login", async ({ pomManager }) => {
		await test.step("Go to login page and login with not yet registered email", async () => {
			await pomManager.homePage.clickSignInButton();
			await pomManager.loginPage.login({
				email: "incorrect@email.com",
				password: testUserData.password,
				rememberMe: true,
			});
		});

		await test.step("Verify correct error message is visible", async () => {
			await pomManager.loginPage.verifyErrorMessage("The provided credentials are incorrect.");
		});
	});

	test("Incorrect password login", async ({ pomManager }) => {
		await test.step("Go to login page and login with incorrect password", async () => {
			await pomManager.homePage.clickSignInButton();
			await pomManager.loginPage.login({
				email: testUserData.email,
				password: "incorrectpassword",
				rememberMe: true,
			});
		});

		await test.step("Verify correct error message is visible", async () => {
			await pomManager.loginPage.verifyErrorMessage("The provided credentials are incorrect.");
		});
	});
});
