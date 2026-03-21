import { APIRequestContext } from "@playwright/test";

interface MailhogRecipient {
	Address: string;
}

interface MailhogMessage {
	ID: string;
	To: MailhogRecipient[];
}

interface MailhogMessagesResponse {
	messages: MailhogMessage[];
}

interface MailhogLink {
	StatusCode: number;
	URL: string;
}

interface MailhogLinksResponse {
	Links: MailhogLink[];
}

export class MailHelper {
	constructor(private readonly request: APIRequestContext) {}

	async getVerificationLink(email: string): Promise<string> {
		const message = await this.findMessageByRecipient(email);

		if (!message) throw new Error(`No message for ${email}`);

		const links = await this.getMessageLinks(message.ID);
		const link = links.Links.find((candidate) => candidate.StatusCode === 302);
		if (!link) throw new Error("No verification link");

		return link.URL;
	}

	async getPasswordResetLink(email: string): Promise<string> {
		const message = await this.findMessageByRecipient(email);

		if (!message) throw new Error(`No message for ${email}`);

		const links = await this.getMessageLinks(message.ID);
		const link = links.Links.find((candidate) => candidate.URL.includes("password-reset"));
		if (!link) throw new Error("No password reset link");

		return link.URL;
	}

	async waitForVerificationLink(email: string, maxAttempts = 10, intervalMs = 1000): Promise<string> {
		for (let i = 0; i < maxAttempts; i++) {
			try {
				return await this.getVerificationLink(email);
			} catch (error) {
				if (i === maxAttempts - 1) throw error;
				await new Promise((resolve) => setTimeout(resolve, intervalMs));
			}
		}
		throw new Error(`No verification link found after ${maxAttempts} attempts`);
	}

	async waitForPasswordResetLink(email: string, maxAttempts = 10, intervalMs = 1000): Promise<string> {
		for (let i = 0; i < maxAttempts; i++) {
			try {
				return await this.getPasswordResetLink(email);
			} catch (error) {
				if (i === maxAttempts - 1) throw error;
				await new Promise((resolve) => setTimeout(resolve, intervalMs));
			}
		}
		throw new Error(`No password reset link found after ${maxAttempts} attempts`);
	}

	private async findMessageByRecipient(email: string): Promise<MailhogMessage | undefined> {
		const messages = await this.getMessages();
		return messages.messages.find((message) =>
			message.To.some((recipient) => recipient.Address.toLowerCase() === email.toLowerCase()),
		);
	}

	private async getMessages(): Promise<MailhogMessagesResponse> {
		const messagesResponse = await this.request.get("http://16.16.128.139:8025/api/v1/messages");
		return this.parseMessagesResponse(await messagesResponse.json());
	}

	private async getMessageLinks(messageId: string): Promise<MailhogLinksResponse> {
		const linksResponse = await this.request.get(
			`http://16.16.128.139:8025/api/v1/message/${messageId}/link-check`,
		);
		return this.parseLinksResponse(await linksResponse.json());
	}

	private parseMessagesResponse(value: unknown): MailhogMessagesResponse {
		if (!this.isRecord(value) || !Array.isArray(value.messages)) {
			throw new Error("Unexpected MailHog messages response.");
		}

		const messages = value.messages.map((message) => this.parseMessage(message));
		return { messages };
	}

	private parseLinksResponse(value: unknown): MailhogLinksResponse {
		if (!this.isRecord(value) || !Array.isArray(value.Links)) {
			throw new Error("Unexpected MailHog links response.");
		}

		const links = value.Links.map((link) => this.parseLink(link));
		return { Links: links };
	}

	private parseMessage(value: unknown): MailhogMessage {
		if (!this.isRecord(value) || typeof value.ID !== "string" || !Array.isArray(value.To)) {
			throw new Error("Unexpected MailHog message shape.");
		}

		const recipients = value.To.map((recipient) => this.parseRecipient(recipient));
		return {
			ID: value.ID,
			To: recipients,
		};
	}

	private parseRecipient(value: unknown): MailhogRecipient {
		if (!this.isRecord(value) || typeof value.Address !== "string") {
			throw new Error("Unexpected MailHog recipient shape.");
		}

		return {
			Address: value.Address,
		};
	}

	private parseLink(value: unknown): MailhogLink {
		if (!this.isRecord(value) || typeof value.StatusCode !== "number" || typeof value.URL !== "string") {
			throw new Error("Unexpected MailHog link shape.");
		}

		return {
			StatusCode: value.StatusCode,
			URL: value.URL,
		};
	}

	private isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === "object" && value !== null;
	}
}
