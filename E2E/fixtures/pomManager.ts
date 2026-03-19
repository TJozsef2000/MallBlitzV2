import { test as base } from "@playwright/test";
import { getAuthStatePath } from "../helpers/auth.helper";
import { MailHelper } from "../helpers/mail.helper";
import PomManager from "../pages/ManagePage";

type Fixture = {
	pomManager: PomManager;
	mailHelper: MailHelper;
};

export const test = base.extend<Fixture>({
	pomManager: async ({ page }, use) => {
		await use(new PomManager(page));
	},

	mailHelper: async ({ request }, use) => {
		await use(new MailHelper(request));
	},
});

export const userTest = test.extend({
	storageState: async ({}, use) => {
		await use(getAuthStatePath("user"));
	},
});

export const adminTest = test.extend({
	storageState: async ({}, use) => {
		await use(getAuthStatePath("admin"));
	},
});

export { expect } from "@playwright/test";
