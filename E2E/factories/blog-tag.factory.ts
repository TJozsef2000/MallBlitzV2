import { faker } from "@faker-js/faker";

export function createBlogTagFaker() {
	const suffix = `${Date.now()}-${faker.number.int({ min: 100, max: 999 })}`;

	return {
		name: `Tag ${suffix}`,
		slug: `tag-${suffix}`,
		description: faker.lorem.sentence(),
	};
}
