import { test, expect } from "../../fixtures/pomManager";

// Blog permissions / security coverage.
//
// Scope of this file:
//   - SEC-001 Guest cannot access admin blog routes.
//   - SEC-007 Public content does not leak internal user data (author email).
//
// Skipped (documented at the bottom of this file):
//   - SEC-002 / SEC-003 / SEC-004 / SEC-005 — no non-admin "author" role fixture
//     exists in this repo. `playwright/.auth/user.json` is a regular site user
//     without blog-author privileges, and the admin UI does not expose a flow to
//     create one without backend artisan access. Blocker.
//   - SEC-006 Admin post detail sanitizes unsafe HTML — requires a seeded
//     `xss-post` fixture. The live admin data is faker-generated lorem content
//     with no injected payload, so the assertion would be vacuous.

test.describe("Blog permissions / security", () => {
	// SEC-001: Guest cannot access any admin blog route.
	// The app redirects unauthenticated requests to /login?redirect=/admin/... with HTTP 302.
	test("SEC-001 Guest is redirected from admin blog routes to login", async ({ request }) => {
		const routes = ["/admin/blog/posts", "/admin/blog/categories", "/admin/blog/tags"];

		for (const route of routes) {
			const response = await request.get(`https://mallblitz.com${route}`, {
				maxRedirects: 0,
			});
			expect(response.status(), `route ${route} should redirect`).toBe(302);

			const location = response.headers().location ?? "";
			expect(location, `route ${route} should redirect to /login`).toContain("/login");
			expect(location, `route ${route} should preserve redirect back-link`).toContain(`redirect=${route}`);
		}
	});

	// SEC-007: Public blog payloads must not leak author email addresses.
	//
	// Mechanism: mallblitz.com is a Nuxt SSR app. The entire page state — including the
	// post payload and the author profile — is embedded in the HTML as a JSON blob on
	// `__NUXT__`. This is the same data the browser hydrates from, so if it contains an
	// author email, every visitor can extract it via "View Source" without hitting the API.
	test("SEC-007 Public post detail payload does not expose author email", async ({ request, pomManager }) => {
		// Find a real published post slug from the live blog index.
		const indexHtml = await (await request.get("https://mallblitz.com/blog")).text();
		const slugMatch = /href="\/blog\/([a-z0-9-]+)"/.exec(indexHtml);
		expect(slugMatch, "expected at least one /blog/{slug} link on the blog index").not.toBeNull();
		const slug = slugMatch![1];

		const postHtml = await (await request.get(`https://mallblitz.com/blog/${slug}`)).text();

		// Extract the embedded Nuxt payload. We look for any email-shaped token inside it.
		// The payload spans the whole script; scanning the full HTML is fine because the
		// only place an email could legitimately be emitted is inside the payload or a
		// mailto: link (which is also a leak).
		const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
		const foundEmails = postHtml.match(emailPattern) ?? [];

		// Filter acceptable matches:
		//   - site-wide addresses (contact, support, noreply) are not per-user data
		//   - Sentry ingest DSNs are public-by-design tokens, not user emails
		const ignoredLocalParts = new Set(["contact", "support", "info", "hello", "noreply", "no-reply"]);
		const suspicious = foundEmails.filter((email) => {
			const [local, domain] = email.split("@");
			if (ignoredLocalParts.has(local.toLowerCase())) return false;
			if (/\bingest\b.*\bsentry\.io$/i.test(domain)) return false;
			return true;
		});

		expect(
			suspicious,
			`public post detail HTML leaks what look like user account emails: ${suspicious.join(", ")}`,
		).toHaveLength(0);

		// Sanity: the page we inspected is actually a real post detail page.
		await pomManager.blogPostDetailPage.goToPostBySlug(slug);
		await pomManager.blogPostDetailPage.verifyPage();
	});
});
