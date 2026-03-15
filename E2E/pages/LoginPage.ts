import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { testUserData } from "../helpers/env.helper";

export { testUserData } from "../helpers/env.helper";

export class LoginPage extends BasePage {
	protected readonly emailAddressField: Locator;
	protected readonly passwordField: Locator;
	protected readonly rememberMeCheckbox: Locator;
	protected readonly loginButton: Locator;

	protected readonly accountDeleteMessage: Locator;
	protected readonly loggedOutMessage: Locator;

	protected readonly errorAlert: Locator;

	protected readonly forgotPasswordLink: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		this.accountDeleteMessage = page.getByText("Your account has been deleted. We're sorry to see you go.");
		this.loggedOutMessage = page.getByText("Successfully signed out!");

		// Login
		this.emailAddressField = page.getByRole("textbox", { name: "Email Address *" });
		this.passwordField = page.getByRole("textbox", { name: "Password *" });
		this.rememberMeCheckbox = page.getByRole("checkbox", { name: "Remember me" });
		this.loginButton = page.getByRole("button", { name: "Sign in" });

		this.errorAlert = page.getByRole("alert");

		this.forgotPasswordLink = page.getByRole("link", { name: "Forgot your password?" });
	}

	// leave empty for env value or input your own
	async fillLoginEmail(email?: string): Promise<void> {
		const inputEmail = email ?? testUserData.email;
		await this.emailAddressField.fill(inputEmail);
	}

	// leave empty for env value or input your own
	async fillLoginPassword(password?: string): Promise<void> {
		const inputPassword = password ?? testUserData.password;
		await this.passwordField.fill(inputPassword);
	}

	async checkRememberMe(): Promise<void> {
		await this.rememberMeCheckbox.check();
	}

	async clickLoginButton(): Promise<void> {
		await this.loginButton.click();
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL("https://mallblitz.com/login");
	}

	async verifyAccountDeletedText(): Promise<void> {
		await expect(this.accountDeleteMessage).toBeVisible();
	}

	async verifyUserLoggedOutText(): Promise<void> {
		await expect(this.loggedOutMessage).toBeVisible();
	}

	async clickForgotPassword(): Promise<void> {
		await this.forgotPasswordLink.click();
	}

	// error messages
	async verifyErrorMessage(error: string): Promise<void> {
		await expect(this.errorAlert.filter({ hasText: error })).toBeVisible();
	}
}
