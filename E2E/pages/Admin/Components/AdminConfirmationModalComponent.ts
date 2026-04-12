import { expect, Page } from "@playwright/test";

interface ConfirmationModalOptions {
	confirmButtonName?: string;
	heading?: RegExp | string;
	waitForClose?: boolean;
}

export class AdminConfirmationModalComponent {
	constructor(
		private readonly page: Page,
		private readonly defaultOptions: ConfirmationModalOptions = {},
	) {}

	async confirm(options: ConfirmationModalOptions = {}): Promise<void> {
		const resolvedOptions = this.resolveOptions(options);
		const heading = this.page.getByRole("heading", { name: resolvedOptions.heading }).last();

		await expect(heading).toBeVisible();
		await this.page
			.getByRole("button", { name: resolvedOptions.confirmButtonName, exact: true })
			.last()
			.click();

		if (resolvedOptions.waitForClose) {
			await expect(heading).toBeHidden();
		}
	}

	private resolveOptions(options: ConfirmationModalOptions): Required<ConfirmationModalOptions> {
		return {
			confirmButtonName: options.confirmButtonName ?? this.defaultOptions.confirmButtonName ?? "Delete",
			heading: options.heading ?? this.defaultOptions.heading ?? /Delete/i,
			waitForClose: options.waitForClose ?? this.defaultOptions.waitForClose ?? true,
		};
	}
}
