import { faker } from "@faker-js/faker";

export function createBrandInfoFaker() {
	const suffix = `${Date.now()}-${faker.number.int({ min: 100, max: 999 })}`;

	return {
		name: `Brand ${suffix}`,
		description: faker.company.catchPhrase(),
		websiteUrl: faker.internet.url(),
		sortOrder: faker.number.int({ min: 1, max: 50 }).toString(),
	};
}
