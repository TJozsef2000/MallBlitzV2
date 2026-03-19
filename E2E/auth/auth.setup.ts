import { test as setup } from "../fixtures/pomManager";
import { ensureAuthStateDir, getAuthCredentials, getAuthStatePath } from "../helpers/auth.helper";
import { validateAdminEnv, validateTestUserEnv } from "../helpers/env.helper";

setup("Authenticate preset user", async ({ page, pomManager }) => {
	validateTestUserEnv();
	ensureAuthStateDir();

	await pomManager.homePage.goToHomePage();
	await pomManager.homePage.clickSignInButton();
	await pomManager.loginPage.verifyPage();
	await pomManager.loginPage.login({
		...getAuthCredentials("user"),
		rememberMe: true,
	});
	await pomManager.dashboardPage.verifyPage();

	await page.context().storageState({ path: getAuthStatePath("user") });
});

setup("Authenticate admin user", async ({ page, pomManager }) => {
	validateAdminEnv();
	ensureAuthStateDir();

	await pomManager.homePage.goToHomePage();
	await pomManager.homePage.clickSignInButton();
	await pomManager.loginPage.verifyPage();
	await pomManager.loginPage.login(getAuthCredentials("admin"));
	await pomManager.adminDashboardPage.verifyPage();

	await page.context().storageState({ path: getAuthStatePath("admin") });
});
