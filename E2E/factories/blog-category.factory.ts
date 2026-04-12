import { faker } from "@faker-js/faker";

export function createBlogCategoryFaker() {
	const suffix = `${Date.now()}-${faker.number.int({ min: 100, max: 999 })}`;

	return {
		name: `Category ${suffix}`,
		slug: `category-${suffix}`,
		description: faker.lorem.sentence(),
		sortOrder: faker.number.int({ min: 1, max: 50 }).toString(),
	};
}
