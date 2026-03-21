const js = require("@eslint/js");
const globals = require("globals");
const prettierConfig = require("eslint-config-prettier");
const playwright = require("eslint-plugin-playwright");
const tseslint = require("typescript-eslint");

const playwrightFiles = ["E2E/tests/**/*.ts", "E2E/auth/**/*.ts"];

module.exports = tseslint.config(
	{
		ignores: [
			"eslint.config.cjs",
			"node_modules/**",
			"playwright-report/**",
			"test-results/**",
			"playwright/**",
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		files: ["**/*.ts"],
		languageOptions: {
			globals: {
				...globals.node,
			},
			parserOptions: {
				projectService: true,
				tsconfigRootDir: __dirname,
			},
		},
		rules: {
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/no-confusing-void-expression": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/restrict-template-expressions": [
				"error",
				{
					allowBoolean: false,
					allowNullish: false,
					allowNumber: true,
				},
			],
		},
	},
	{
		files: playwrightFiles,
		...playwright.configs["flat/recommended"],
		rules: {
			...playwright.configs["flat/recommended"].rules,
			"playwright/expect-expect": "off",
			"playwright/no-conditional-in-test": "off",
			"playwright/no-skipped-test": "off",
		},
	},
	prettierConfig,
);
