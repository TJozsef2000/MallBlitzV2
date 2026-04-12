import { test, expect } from "../../fixtures/pomManager";

// Blog SEO / sitemap / cache coverage.
//
// Scope of this file:
//   - SYS-001 Post page emits canonical and structured data.
//   - SYS-002 Blog index canonical behavior across default and filtered states.
//   - SYS-003 Category and tag pages are present in sitemap.
//   - SYS-004 XML sitemap endpoint works.
//
// Skipped (documented at the bottom of this file):
//   - SYS-005 Scheduled publishing — no artisan/scheduler trigger exposed to E2E,
//     no scheduled-publish UI in the admin form. Full blocker.
//   - SYS-006 Featured/recent/popular widgets lifecycle — nightly-tier; requires
//     a mutate-then-revisit cycle and no test markers on the featured carousel.
//   - SYS-007/008 Cache invalidation — the app exposes no cache-hit header or
//     cache-version marker that a test could distinguish from a fresh load.
//
// The plan references `/api/sitemap/xml` — that path returns 404 on the live site.
// The working sitemap endpoint is `/sitemap.xml` (Nuxt @nuxtjs/sitemap), so this
// file uses that instead.

function extractMeta(html: string, attr: "canonical" | "robots"): string | null {
	if (attr === "canonical") {
		const m = /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i.exec(html);
		return m ? m[1] : null;
	}
	const m = /<meta[^>]*name="robots"[^>]*content="([^"]+)"/i.exec(html);
	return m ? m[1] : null;
}

async function findFirstPublishedSlug(
	request: import("@playwright/test").APIRequestContext,
): Promise<string> {
	const html = await (await request.get("https://mallblitz.com/blog")).text();
	const match = /href="\/blog\/([a-z0-9-]+)"/.exec(html);
	expect(match, "expected at least one /blog/{slug} link on the blog index").not.toBeNull();
	return match![1];
}

test.describe("Blog SEO and sitemap", () => {
	// SYS-001: Post detail must emit a canonical URL matching its public URL, plus
	// JSON-LD article and breadcrumb schema.
	//
	// Known product bug: the current canonical on /blog/{slug} points to
	// https://api.mallblitz.com/blog/posts/{slug} instead of the public page URL.
	// This test will FAIL until that is fixed — by design, to keep the regression
	// visible.
	test("SYS-001 Post detail canonical matches public URL and JSON-LD schema is present", async ({
		request,
	}) => {
		const slug = await findFirstPublishedSlug(request);
		const html = await (await request.get(`https://mallblitz.com/blog/${slug}`)).text();

		const canonical = extractMeta(html, "canonical");
		expect(canonical, "post detail should declare a canonical URL").not.toBeNull();
		expect(canonical, "canonical must match the public post URL").toBe(`https://mallblitz.com/blog/${slug}`);

		const jsonLdBlocks = html.match(/<script[^>]*application\/ld\+json[^>]*>/gi) ?? [];
		expect(jsonLdBlocks.length, "post detail should emit at least one JSON-LD block").toBeGreaterThan(0);

		expect(html, "post detail JSON-LD should include an Article schema").toMatch(/"@type":"[^"]*Article[^"]*"/i);
		expect(html, "post detail JSON-LD should include a BreadcrumbList schema").toMatch(
			/"@type":"BreadcrumbList"/i,
		);
	});

	// SYS-002: The blog index default state is indexable and canonical points to /blog.
	// Any filtered state (search or category param) must be marked noindex so search
	// engines do not index infinite filter combinations.
	test("SYS-002 Blog index canonical and robots follow the SEO rules for default and filtered states", async ({
		request,
	}) => {
		const defaultHtml = await (await request.get("https://mallblitz.com/blog")).text();
		expect(extractMeta(defaultHtml, "canonical")).toBe("https://mallblitz.com/blog");
		expect(extractMeta(defaultHtml, "robots")).toMatch(/index,\s*follow/i);

		const filteredHtml = await (await request.get("https://mallblitz.com/blog?search=test")).text();
		expect(
			extractMeta(filteredHtml, "robots"),
			"filtered blog index must declare noindex",
		).toMatch(/noindex/i);
	});

	// SYS-003: Sitemap must list blog post, category, and tag URLs.
	//
	// Known product bug: the live sitemap only contains static routes (/, /blog,
	// /contact, /login, ...) and no blog post/category/tag URLs at all. This test
	// will FAIL until the sitemap generator is wired to the blog data source.
	test("SYS-003 Sitemap contains blog post, category, and tag URLs", async ({ request }) => {
		const xml = await (await request.get("https://mallblitz.com/sitemap.xml")).text();

		expect(xml, "sitemap should contain at least one /blog/{slug} entry").toMatch(
			/<loc>https:\/\/mallblitz\.com\/blog\/[a-z0-9-]+<\/loc>/,
		);
		expect(xml, "sitemap should contain at least one /blog/category/{slug} entry").toMatch(
			/<loc>https:\/\/mallblitz\.com\/blog\/category\/[a-z0-9-]+<\/loc>/,
		);
		expect(xml, "sitemap should contain at least one /blog/tag/{slug} entry").toMatch(
			/<loc>https:\/\/mallblitz\.com\/blog\/tag\/[a-z0-9-]+<\/loc>/,
		);
	});

	// SYS-004: XML sitemap endpoint returns 200 and valid XML.
	// Plan specifies /api/sitemap/xml but that path 404s — /sitemap.xml is the real path.
	test("SYS-004 XML sitemap endpoint returns 200 and well-formed XML with the blog root", async ({
		request,
	}) => {
		const response = await request.get("https://mallblitz.com/sitemap.xml");
		expect(response.status()).toBe(200);

		const contentType = response.headers()["content-type"] ?? "";
		expect(contentType, "sitemap content-type should be XML").toMatch(/xml/i);

		const xml = await response.text();
		expect(xml.startsWith("<?xml"), "sitemap body should be a well-formed XML document").toBeTruthy();
		expect(xml).toContain("<urlset");
		expect(xml).toContain("<loc>https://mallblitz.com/blog</loc>");
	});
});
