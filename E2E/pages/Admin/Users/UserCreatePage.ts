import { expect, Locator, Page } from "@playwright/test";
import { createRegisterInfoFaker } from "../../../factories/register.factory";
import { BasePage } from "../../BasePage";

export class UserCreatePage extends BasePage {
	// === User detials ===
	protected readonly userFullNameField: Locator;
	protected readonly userEmailAddressField: Locator;

	// === User password ===
	protected readonly passwordField: Locator;
	protected readonly confirmPasswordField: Locator;

	// === Email verification ===
	protected readonly emailVerificationToggle: Locator;

	// === User roles ===
	protected readonly userPermissionCheckbox: Locator;
	protected readonly adminPermissionCheckbox: Locator;
	protected readonly editorPermissionCheckbox: Locator;
	protected readonly authorPermissionCheckbox: Locator;

	// === Cancel/Create ===
	protected readonly cancelButton: Locator;
	protected readonly createUserButton: Locator;

	constructor(protected readonly page: Page) {
		super(page);

		// === User detials ===
		this.userFullNameField = this.page.getByRole("textbox", { name: "Full Name *" });
		this.userEmailAddressField = this.page.getByRole("textbox", { name: "Email Address *" });

		// === User password ===
		this.passwordField = this.page.getByRole("textbox", { name: "Password *", exact: true });
		this.confirmPasswordField = this.page.getByRole("textbox", { name: "Confirm Password *", exact: true });

		// === Email verification ===
		this.emailVerificationToggle = this.page.getByRole("switch", { name: "Toggle switch" });

		// === User roles ===
		this.userPermissionCheckbox = this.page.getByRole("checkbox", { name: "User" });
		this.adminPermissionCheckbox = this.page.getByRole("checkbox", { name: "Admin" });
		this.editorPermissionCheckbox = this.page.getByRole("checkbox", { name: "Editor" });
		this.authorPermissionCheckbox = this.page.getByRole("checkbox", { name: "Author" });

		// === Cancel/Create ===
		this.cancelButton = this.page.getByRole("button", { name: "Cancel" }).nth(1);
		this.createUserButton = this.page.getByRole("button", { name: "Create User" });
	}

	async verifyPage(): Promise<void> {
		await expect(this.page).toHaveURL("https://mallblitz.com/admin/users/create");
	}

	// === User detials ===

	// leave arg empty for faker data or input your own
	async fillAndReturName(newName?: string): Promise<string> {
		const name = newName ?? createRegisterInfoFaker().fullName;
		await this.userFullNameField.fill(name);
		return name;
	}

	async fillAndReturnEmail(newEmail?: string): Promise<string> {
		const email = newEmail ?? createRegisterInfoFaker().emailAddress;
		await this.userEmailAddressField.fill(email);
		return email;
	}

	// === User password ===

	async fillAndReturnPassword(newPassword?: string): Promise<string> {
		const password = newPassword ?? createRegisterInfoFaker().password;
		await this.passwordField.fill(password);
		await this.confirmPasswordField.fill(password);
		return password;
	}

	// === Email verification ===

	async setEmailVerification(state: "On" | "Off"): Promise<void> {
		await this.setToggle(this.emailVerificationToggle, state);
	}

	// === User roles ===

	// helper for set methods
	private async setToggle(locator: Locator, state: "On" | "Off"): Promise<void> {
		if (state === "On") {
			await locator.check();
			await expect(locator).toBeChecked();
		} else {
			await locator.uncheck();
			await expect(locator).not.toBeChecked();
		}
	}

	async setUserPermission(state: "On" | "Off"): Promise<void> {
		await this.setToggle(this.userPermissionCheckbox, state);
	}

	async setAdminPermission(state: "On" | "Off"): Promise<void> {
		await this.setToggle(this.adminPermissionCheckbox, state);
	}

	async setEditorPermission(state: "On" | "Off"): Promise<void> {
		await this.setToggle(this.editorPermissionCheckbox, state);
	}

	async setAuthorPermission(state: "On" | "Off"): Promise<void> {
		await this.setToggle(this.authorPermissionCheckbox, state);
	}

	// === Cancel/Create ===

	async clickCancelButton(): Promise<void> {
		await this.cancelButton.click();
	}

	async clickCreateUserButton(): Promise<void> {
		await this.createUserButton.click();
	}
}
