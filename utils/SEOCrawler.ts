import {Browser, Page} from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import {SEOMetaData} from '../types/seo-data';
import {CrawlerConfig} from '../types/config';


export class SEOCrawler {
    private browser: Browser;
    private visitedUrls: Set<string> = new Set();
    private urlQueue: string[] = [];
    private results: SEOMetaData[] = [];
    private config: Required<CrawlerConfig>;
    private baseUrl: URL;

    constructor(browser: Browser, config: CrawlerConfig) {
        this.browser = browser;
        this.config = {
            maxPages: config.maxPages || 100,
            outputDir: config.outputDir || './seo-reports',
            outputFormat: config.outputFormat || 'both',
            sameOriginOnly: config.sameOriginOnly !== false,
            includePaths: config.includePaths || [],
            excludePaths: config.excludePaths || [],
            waitForSelector: config.waitForSelector || 'body',
            timeout: config.timeout || 30000,
            startUrl: this.normalizeUrl(config.startUrl),
        };

        this.baseUrl = new URL(this.config.startUrl);
        this.urlQueue.push(this.config.startUrl);
    }

    async crawl(): Promise<SEOMetaData[]> {
        await fs.mkdir(this.config.outputDir, {recursive: true});

        console.log(`\n🔍 Starting SEO crawl from: ${this.config.startUrl}`);
        console.log(`📄 Max pages: ${this.config.maxPages}`);

        while (this.urlQueue.length > 0 && this.visitedUrls.size < this.config.maxPages) {
            const url = this.normalizeUrl(this.urlQueue.shift()!);
            console.log("Page to check:" + url);

            if (this.visitedUrls.has(url)) continue;
            if (!this.shouldCrawlUrl(url)) continue;

            await this.crawlPage(url);
        }

        console.log(`\n✅ Crawl complete! Processed ${this.results.length} pages.`);
        await this.saveResults();

        return this.results;
    }

    private async crawlPage(url: string): Promise<void> {
        const page = await this.browser.newPage();

        try {
            console.log(`📊 Crawling [${this.visitedUrls.size + 1}/${this.config.maxPages}]: ${url}`);

            const response = await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: this.config.timeout,
            });

            // Wait for specific selector if configured
            if (this.config.waitForSelector) {
                await page.waitForSelector(this.config.waitForSelector, {
                    timeout: 5000
                }).catch(() => {
                });
            }

            await this.waitForPageLinks(page);

            this.visitedUrls.add(url);

            // Extract SEO data
            const seoData = await this.extractSEOData(page, url, response?.status() || null);
            this.results.push(seoData);

            // Find and queue new links
            const links = await this.extractLinks(page);
            for (const link of links) {
                if (!this.visitedUrls.has(link) && !this.urlQueue.includes(link)) {
                    this.urlQueue.push(link);
                }
            }

        } catch (error) {
            console.error(`❌ Error crawling ${url}:`, (error as Error).message);

            // Still save error information
            this.results.push({
                url,
                title: null,
                description: null,
                canonical: null,
                robots: null,
                keywords: null,
                author: null,
                ogTags: {},
                twitterTags: {},
                otherMetaTags: {error: (error as Error).message},
                h1Tags: [],
                timestamp: new Date().toISOString(),
                statusCode: null,
            });
        } finally {
            await page.close();
        }
    }

    private async extractSEOData(page: Page, url: string, statusCode: number | null): Promise<SEOMetaData> {
        const data: SEOMetaData = {
            url,
            title: await page.title().catch(() => null),
            description: null,
            canonical: null,
            robots: null,
            keywords: null,
            author: null,
            ogTags: {},
            twitterTags: {},
            otherMetaTags: {},
            h1Tags: [],
            timestamp: new Date().toISOString(),
            statusCode,
        };

        // Extract all meta tags
        const metaTags = await page.$$eval('meta', (elements) =>
            elements.map((el) => ({
                name: el.getAttribute('name') || '',
                property: el.getAttribute('property') || '',
                content: el.getAttribute('content') || '',
            }))
        );

        // Process meta tags
        for (const tag of metaTags) {
            const content = tag.content;

            // Standard meta tags
            if (tag.name === 'description') data.description = content;
            else if (tag.name === 'robots') data.robots = content;
            else if (tag.name === 'keywords') data.keywords = content;
            else if (tag.name === 'author') data.author = content;

            // Open Graph tags
            else if (tag.property.startsWith('og:')) {
                data.ogTags[tag.property] = content;
            }

            // Twitter tags
            else if (tag.name.startsWith('twitter:')) {
                data.twitterTags[tag.name] = content;
            }

            // Other meta tags
            else if (tag.name && content) {
                data.otherMetaTags[tag.name] = content;
            }
        }

        // Extract canonical URL
        data.canonical = await page.$eval('link[rel="canonical"]', (el) =>
            el.getAttribute('href')
        ).catch(() => null);

        // Extract H1 tags
        data.h1Tags = await page.$$eval('h1', (elements) =>
            elements.map((el) => el.textContent?.trim() || '')
        ).catch(() => []);

        return data;
    }

    private async extractLinks(page: Page): Promise<string[]> {
        const links = await page.$$eval('a[href]', (elements) =>
            elements.map((el) => el.getAttribute('href')).filter(Boolean) as string[]
        );

        // Normalize and filter links
        const normalizedLinks: string[] = [];

        for (const link of links) {
            try {
                const absoluteUrl = new URL(link, page.url());
                const normalizedUrl = this.normalizeUrl(absoluteUrl.toString());

                if (this.shouldCrawlUrl(normalizedUrl)) {
                    normalizedLinks.push(normalizedUrl);
                }
            } catch {
                // Invalid URL, skip
            }
        }

        return [...new Set(normalizedLinks)];
    }

    private shouldCrawlUrl(url: string): boolean {
        try {
            const urlObj = new URL(this.normalizeUrl(url));

            // Same origin check
            if (this.config.sameOriginOnly && urlObj.origin !== this.baseUrl.origin) {
                return false;
            }

            const currentPath = urlObj.pathname.toLowerCase();

            // 1. Check for Static Files and Anchors (Regex is fine here)
            const staticFilePattern = /\.(jpg|jpeg|png|gif|svg|pdf|zip|css|js|ico)$/i;
            if (staticFilePattern.test(currentPath) || url.includes('#')) {
                return false;
            }

            // 2. THE FIX: Check user-defined exclusions
            // We use startsWith to ensure '/admin' does not match '/blog/author/admin-user'
            const isExcluded = this.config.excludePaths.some(excludedPath =>
                currentPath.startsWith(excludedPath.toLowerCase())
            );

            if (isExcluded) {
                return false;
            }

            // Include path filters
            if (this.config.includePaths.length > 0) {
                return this.config.includePaths.some((includedPath) =>
                    currentPath.includes(includedPath.toLowerCase())
                );
            }

            return true;
        } catch {
            return false;
        }
    }

    private async waitForPageLinks(page: Page): Promise<void> {
        await page.waitForLoadState('load', {
            timeout: 5000,
        }).catch(() => {
        });

        const initialLinkCount = await page.locator('a[href]').count().catch(() => 0);
        if (initialLinkCount > 1) {
            return;
        }

        await page.waitForFunction(
            () => document.querySelectorAll('a[href]').length > 1,
            {
                timeout: 5000,
            }
        ).catch(() => {
        });
    }

    private normalizeUrl(url: string): string {
        const parsedUrl = new URL(url);
        parsedUrl.hash = '';

        const normalizedPath =
            parsedUrl.pathname === '/'
                ? ''
                : parsedUrl.pathname.replace(/\/+$/, '');

        return `${parsedUrl.origin}${normalizedPath}${parsedUrl.search}`;
    }

    private async saveResults(): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const siteName = this.baseUrl.hostname.replace(/\./g, '_');

        // Save as JSON
        if (this.config.outputFormat === 'json' || this.config.outputFormat === 'both') {
            const jsonPath = path.join(this.config.outputDir, `${siteName}-seo-${timestamp}.json`);
            await fs.writeFile(jsonPath, JSON.stringify(this.results, null, 2));
            console.log(`\n💾 Saved JSON: ${jsonPath}`);
        }

        // Save as CSV
        if (this.config.outputFormat === 'csv' || this.config.outputFormat === 'both') {
            const csvPath = path.join(this.config.outputDir, `${siteName}-seo-${timestamp}.csv`);
            const csv = this.convertToCSV(this.results);
            await fs.writeFile(csvPath, csv);
            console.log(`💾 Saved CSV: ${csvPath}`);
        }

        // Save summary report
        await this.saveSummaryReport(siteName, timestamp);
    }

    private async saveSummaryReport(siteName: string, timestamp: string): Promise<void> {
        const summary = {
            crawlDate: new Date().toISOString(),
            baseUrl: this.config.startUrl,
            totalPages: this.results.length,
            pagesWithDescription: this.results.filter(r => r.description).length,
            pagesWithOGTags: this.results.filter(r => Object.keys(r.ogTags).length > 0).length,
            pagesWithTwitterTags: this.results.filter(r => Object.keys(r.twitterTags).length > 0).length,
            pagesWithCanonical: this.results.filter(r => r.canonical).length,
            pagesWithH1: this.results.filter(r => r.h1Tags.length > 0).length,
            missingDescriptions: this.results.filter(r => !r.description).map(r => r.url),
            missingH1: this.results.filter(r => r.h1Tags.length === 0).map(r => r.url),
            multipleH1: this.results.filter(r => r.h1Tags.length > 1).map(r => ({url: r.url, count: r.h1Tags.length})),
        };

        const summaryPath = path.join(this.config.outputDir, `${siteName}-summary-${timestamp}.json`);
        await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`📋 Saved Summary: ${summaryPath}`);

        // Print summary to console
        console.log('\n📊 --- SEO Audit Summary ---');
        console.log(`✓ Total pages crawled: ${summary.totalPages}`);
        console.log(`✓ Pages with descriptions: ${summary.pagesWithDescription}/${summary.totalPages}`);
        console.log(`✓ Pages with OG tags: ${summary.pagesWithOGTags}/${summary.totalPages}`);
        console.log(`✓ Pages with Twitter tags: ${summary.pagesWithTwitterTags}/${summary.totalPages}`);
        console.log(`✓ Pages with canonical URLs: ${summary.pagesWithCanonical}/${summary.totalPages}`);
        console.log(`✓ Pages with H1 tags: ${summary.pagesWithH1}/${summary.totalPages}`);

        if (summary.missingDescriptions.length > 0) {
            console.log(`\n⚠️  ${summary.missingDescriptions.length} pages missing meta descriptions`);
        }
        if (summary.missingH1.length > 0) {
            console.log(`⚠️  ${summary.missingH1.length} pages missing H1 tags`);
        }
        if (summary.multipleH1.length > 0) {
            console.log(`⚠️  ${summary.multipleH1.length} pages have multiple H1 tags`);
        }
    }

    private convertToCSV(data: SEOMetaData[]): string {
        if (data.length === 0) return '';

        const headers = [
            'URL',
            'Title',
            'Description',
            'Canonical',
            'Robots',
            'Keywords',
            'Author',
            'OG Tags',
            'Twitter Tags',
            'H1 Tags',
            'H1 Count',
            'Status Code',
            'Timestamp',
        ];

        const rows = data.map((item) => [
            item.url,
            item.title || '',
            item.description || '',
            item.canonical || '',
            item.robots || '',
            item.keywords || '',
            item.author || '',
            JSON.stringify(item.ogTags),
            JSON.stringify(item.twitterTags),
            item.h1Tags.join(' | '),
            item.h1Tags.length.toString(),
            item.statusCode?.toString() || '',
            item.timestamp,
        ]);

        const escapeCsvValue = (val: string) => {
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        };

        const csvRows = [
            headers.join(','),
            ...rows.map((row) => row.map(escapeCsvValue).join(',')),
        ];

        return csvRows.join('\n');
    }

    getSummary() {
        return {
            totalPages: this.results.length,
            pagesWithDescription: this.results.filter(r => r.description).length,
            pagesWithOGTags: this.results.filter(r => Object.keys(r.ogTags).length > 0).length,
            pagesWithTwitterTags: this.results.filter(r => Object.keys(r.twitterTags).length > 0).length,
            missingDescriptions: this.results.filter(r => !r.description).length,
            missingH1: this.results.filter(r => r.h1Tags.length === 0).length,
            multipleH1: this.results.filter(r => r.h1Tags.length > 1).length,
        };
    }
}
