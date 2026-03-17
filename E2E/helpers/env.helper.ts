import path from "path";

const requiredTestUserEnvVars = ["LOGIN_FULLNAME", "LOGIN_EMAIL", "LOGIN_PASSWORD"] as const;
const requiredAdminEnvVars = ["ADMIN_LOGIN_EMAIL", "ADMIN_LOGIN_PASSWORD"] as const;

type RequiredEnvVar = (typeof requiredTestUserEnvVars)[number] | (typeof requiredAdminEnvVars)[number];

function requireEnv(name: RequiredEnvVar): string {
	const value = process.env[name]?.trim();

	if (!value) {
		const envPath = path.resolve(process.cwd(), ".env");
		throw new Error(
			`Missing required environment variable ${name}. Add it to ${envPath} or set it in your shell before running tests that use the preset login account.`,
		);
	}

	return value;
}

export const testUserData = {
	fullName: requireEnv("LOGIN_FULLNAME"),
	email: requireEnv("LOGIN_EMAIL"),
	password: requireEnv("LOGIN_PASSWORD"),
};

export const adminUserData = {
	email: requireEnv("ADMIN_LOGIN_EMAIL"),
	password: requireEnv("ADMIN_LOGIN_PASSWORD"),
};

export function validateTestUserEnv(): void {
	requiredTestUserEnvVars.forEach(requireEnv);
}

export function validateAdminEnv(): void {
	requiredAdminEnvVars.forEach(requireEnv);
}
