import { faker } from "@faker-js/faker";

export function createBlogPostFaker() {
	const suffix = `${Date.now()}-${faker.number.int({ min: 100, max: 999 })}`;

	return {
		title: `Post ${suffix}`,
		slug: `post-${suffix}`,
		excerpt: faker.lorem.sentence(),
		content: faker.lorem.paragraphs(2),
		seoTitle: `SEO ${suffix}`,
		seoDescription: faker.lorem.sentence(),
	};
}
