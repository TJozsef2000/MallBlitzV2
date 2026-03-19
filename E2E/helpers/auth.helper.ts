import fs from "fs";
import path from "path";
import { authUsers, type AuthRole } from "./env.helper";

export const authStateDir = path.resolve(process.cwd(), "playwright/.auth");

export const authStatePaths: Record<AuthRole, string> = {
	user: path.join(authStateDir, "user.json"),
	admin: path.join(authStateDir, "admin.json"),
};

export function ensureAuthStateDir(): void {
	fs.mkdirSync(authStateDir, { recursive: true });
}

export function getAuthStatePath(role: AuthRole): string {
	return authStatePaths[role];
}

export function getAuthCredentials(role: AuthRole): { email: string; password: string } {
	const { email, password } = authUsers[role];
	return { email, password };
}
