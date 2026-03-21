import { faker } from "@faker-js/faker";

export function createRegisterInfoFaker() {
	return {
		fullName: faker.person.fullName().replace(/['.-]/g, ""),
		emailAddress: faker.internet.email(),
		password: faker.internet.password() + "1",
	};
}
