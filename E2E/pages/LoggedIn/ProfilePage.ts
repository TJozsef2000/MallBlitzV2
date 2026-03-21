import { expect, Locator, Page } from "@playwright/test";
import { createRegisterInfoFaker } from "../../factories/register.factory";
import { BasePage } from "../BasePage";

export class ProfilePage extends BasePage {
	// === Personal info ===
	protected readonly fullNameField: Locator;
	protected readonly personalInfoSaveButton: Locator;
	protected readonly fileInput: Locator;
	protected readonly avatarSuccessMessage: Locator;
	protected readonly fullNameErrorMessage: Locator;
	protected readonly avatarErrorMessage: Locator;

	// === Update email ===
	protected readonly newEmailAddressField: Locator;
	protected readonly emailCurrentPasswordField: Locator;
	protected readonly updateEmailButton: Locator;
	protected readonly passwordIncorrectError: Locator;

	// === Update password ===
	protected readonly currentPasswordField: Locator;
	protected readonly newPasswordField: Locator;
	protected readonly confirmPasswordField: Locator;
	protected readonly savePasswordButton: Locator;

	// === Delete account ===
	protected readonly deleteAccountButton: Locator;

	protected readonly deleteAccountDialogWrapper: Locator;
	protected readonly deleteAccountPasswordField: Locator;
	protected readonly deleteAccountReasonField: Locator;
	protected readonly deleteAccountWrapperButton: Locator;

	constructor(protected readonly page: Page) {
		super(page);
		// === Personal info ===
		this.fullNameField = page.getByRole("textbox", { name: "Full Name" });
		this.fileInput = page.locator('[type = "file"]');
		this.avatarSuccessMessage = page.getByText("Profile picture updated successfully.");
		this.personalInfoSaveButton = page.getByRole("button", { name: "Save changes" }).first();
		this.fullNameErrorMessage = page.getByText("Please enter your name.");
		this.avatarErrorMessage = page.getByText("The avatar field must be an image.");

		// === Update email ===
		this.newEmailAddressField = page.getByRole("textbox", { name: "New Email Address" });
		this.emailCurrentPasswordField = page.locator("#profile-email-current-password");
		this.updateEmailButton = page.getByRole("button", { name: "Update Email" });
		this.passwordIncorrectError = page.getByRole("alert").filter({ hasText: "The password is incorrect." });

		// === Update password ===
		this.currentPasswordField = page.locator("#profile-password-current");
		this.newPasswordField = page.getByRole("textbox", { name: "New Password" });
		this.confirmPasswordField = page.getByRole("textbox", { name: "Confirm Password" });
		this.savePasswordButton = page.getByRole("button", { name: "Save Changes" }).nth(1);

		// === Delete account ===
		this.deleteAccountButton = page.getByRole("button", { name: "Delete Account" });
		this.deleteAccountDialogWrapper = page.getByRole("dialog");
		this.deleteAccountPasswordField = this.deleteAccountDialogWrapper.locator('input[type="password"]');
		this.deleteAccountReasonField = this.deleteAccountDialogWrapper.locator("textarea");
		this.deleteAccountWrapperButton = this.deleteAccountDialogWrapper.getByRole("button", {
			name: "Delete Account",
		});
	}

	// === Personal info ===

	// leave arg empty for faker data or input your own
	async changeAndGetName(newName?: string): Promise<string> {
		const name = newName ?? createRegisterInfoFaker().fullName;
		await this.fullNameField.fill(name);
		return name;
	}

	async savePersonalInfo(): Promise<void> {
		await this.personalInfoSaveButton.click();
	}

	async verifyNameErrorMessage(): Promise<void> {
		await expect(this.fullNameErrorMessage).toBeVisible();
	}

	// === Email change ===

	// leave arg empty for faker data or input your own
	async changeCurrentEmailAndReturnIt(email?: string): Promise<string> {
		const usedEmail = email ?? createRegisterInfoFaker().emailAddress.toLowerCase();
		await this.newEmailAddressField.clear();
		await this.newEmailAddressField.fill(usedEmail);
		return usedEmail;
	}

	async enterPasswordForEmailChange(password: string): Promise<void> {
		const usedPassword = password;
		await this.emailCurrentPasswordField.fill(usedPassword);
	}

	async clickUpdateEmail(): Promise<void> {
		await this.updateEmailButton.click();
	}

	async verifyPasswordIncorrectErrorMessage(): Promise<void> {
		await expect(this.passwordIncorrectError).toBeVisible();
	}

	// === Update password ===

	async fillCurrentPassword(currentPass: string): Promise<void> {
		await this.currentPasswordField.fill(currentPass);
	}

	// leave arg empty for faker data or input your own
	async fillNewPassAndConfirmPassFields(pass?: string): Promise<void> {
		const newPass = pass ?? createRegisterInfoFaker().password;
		await this.newPasswordField.fill(newPass);
		await this.confirmPasswordField.fill(newPass);
	}

	async clickSavePassword(): Promise<void> {
		await this.savePasswordButton.click();
	}

	// === Asserts ===

	async goToPage(): Promise<void> {
		await this.gotoAndWaitForReady("/profile", async () => {
			// This page finishes wiring form handlers after the initial document load.
			await this.page.waitForLoadState("networkidle");
			await expect(this.fullNameField).toBeEditable();
			await expect(this.newEmailAddressField).toBeEditable();
		});
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL("https://mallblitz.com/profile");
	}

	async verifyUserFullName(fullName: string): Promise<void> {
		await expect(this.fullNameField).toHaveValue(fullName);
	}

	async verifyUserEmail(email: string): Promise<void> {
		await expect(this.newEmailAddressField).toHaveValue(email.toLowerCase());
	}

	// === Avatar ===

	async uploadAvatar(state: "Valid" | "Invalid"): Promise<void> {
		let filePath: string;
		if (state === "Valid") {
			filePath = "E2E/assets/test-avatar.jpg";
		} else if (state === "Invalid") {
			filePath = "E2E/assets/textFile.txt";
		} else {
			throw new Error("Invalid avatar state");
		}
		await this.fileInput.setInputFiles(filePath);
	}

	async verifyAvatarChangedSuccessMessage(): Promise<void> {
		await expect(this.avatarSuccessMessage).toBeVisible();
	}

	async verifyUserAvatar(fullName: string): Promise<void> {
		const userAvatarElement = this.page.getByRole("img", { name: `${fullName} avatar` });
		await expect(userAvatarElement).toBeVisible();
	}

	async verifyAvatarErrorMessage(): Promise<void> {
		await expect(this.avatarErrorMessage).toBeVisible();
	}

	// === Account deletion ===
	async clickDeleteAccountButton(): Promise<void> {
		await this.deleteAccountButton.click();
	}

	async fillPasswordAndDeleteAccount(password: string): Promise<void> {
		await this.deleteAccountPasswordField.fill(password);
		await this.deleteAccountWrapperButton.click();
	}
}
