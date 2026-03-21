import { expect, Locator, Page } from "@playwright/test";
import { createRegisterInfoFaker } from "../../factories/register.factory";
import { BasePage } from "../BasePage";

export class ResetPasswordPage extends BasePage {
	protected readonly emailAddressField: Locator;
	protected readonly newPasswordField: Locator;
	protected readonly confirmPasswordField: Locator;
	protected readonly resetPasswordButton: Locator;

	protected readonly resetSuccessMessage: Locator;

	constructor(protected readonly page: Page) {
		super(page);
		this.emailAddressField = page.getByRole("textbox", { name: "Email Address *" });
		this.newPasswordField = page.getByRole("textbox", { name: "New Password *" });
		this.confirmPasswordField = page.getByRole("textbox", { name: "Confirm Password *" });
		this.resetPasswordButton = page.getByRole("button", { name: "Reset Password" });

		this.resetSuccessMessage = page.getByText(
			"Password reset successfully! You can now sign in with your new password.",
		);
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/password-reset/);
		await expect(this.newPasswordField).toBeEditable();
		await expect(this.confirmPasswordField).toBeEditable();
	}

	async fillEmailField(email: string): Promise<void> {
		await this.emailAddressField.fill(email);
	}

	async fillPasswordFields(password?: string): Promise<string> {
		const passwordToUse = password ?? createRegisterInfoFaker().password;
		await this.newPasswordField.fill(passwordToUse);
		await this.confirmPasswordField.fill(passwordToUse);
		return passwordToUse;
	}

	async clickResetPassword(): Promise<void> {
		await this.resetPasswordButton.click();
	}

	async verifySuccessMessage(): Promise<void> {
		await expect(this.resetSuccessMessage).toBeVisible();
	}
}
