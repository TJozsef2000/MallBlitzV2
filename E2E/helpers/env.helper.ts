import path from "path";

const requiredTestUserEnvVars = ["LOGIN_FULLNAME", "LOGIN_EMAIL", "LOGIN_PASSWORD"] as const;
const requiredAdminEnvVars = ["ADMIN_LOGIN_EMAIL", "ADMIN_LOGIN_PASSWORD"] as const;

type RequiredEnvVar = (typeof requiredTestUserEnvVars)[number] | (typeof requiredAdminEnvVars)[number];

export type AuthRole = "user" | "admin";

export interface TestUserData {
	role: "user";
	fullName: string;
	email: string;
	password: string;
}

export interface AdminUserData {
	role: "admin";
	email: string;
	password: string;
}

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

export const testUserData: TestUserData = {
	role: "user",
	fullName: requireEnv("LOGIN_FULLNAME"),
	email: requireEnv("LOGIN_EMAIL"),
	password: requireEnv("LOGIN_PASSWORD"),
};

export const adminUserData: AdminUserData = {
	role: "admin",
	email: requireEnv("ADMIN_LOGIN_EMAIL"),
	password: requireEnv("ADMIN_LOGIN_PASSWORD"),
};

export const authUsers = {
	user: testUserData,
	admin: adminUserData,
} as const;

export function validateTestUserEnv(): void {
	requiredTestUserEnvVars.forEach(requireEnv);
}

export function validateAdminEnv(): void {
	requiredAdminEnvVars.forEach(requireEnv);
}
