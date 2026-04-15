import { chromium } from '@playwright/test';
import { SEOCrawler } from '../utils/SEOCrawler';
import dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const OUTPUT_FORMATS = ['json', 'csv', 'both'] as const;
const DEFAULT_EXCLUDE_PATHS = ['/api', '/admin', '/cart', '/checkout'];

function parseOutputFormat(value: string): 'json' | 'csv' | 'both' {
    if (OUTPUT_FORMATS.includes(value as (typeof OUTPUT_FORMATS)[number])) {
        return value as 'json' | 'csv' | 'both';
    }

    throw new Error(`Invalid --format value "${value}". Expected one of: ${OUTPUT_FORMATS.join(', ')}.`);
}

function parseMaxPages(value: string): number {
    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isFinite(parsedValue) || parsedValue < 1) {
        throw new Error(`Invalid --max-pages value "${value}". Expected a positive integer.`);
    }

    return parsedValue;
}

function parsePathList(value: string | undefined, fallback: string[]): string[] {
    if (!value) {
        return fallback;
    }

    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

async function main(): Promise<void> {
    console.log('🚀 Starting SEO Crawler...\n');

    const args = process.argv.slice(2);

    const getArg = (name: string, defaultValue: string): string => {
        const arg = args.find(a => a.startsWith(`--${name}=`));
        return arg?.split('=')[1] ?? defaultValue;
    };

    const baseUrl = process.env.CRAWLER_BASE_URL ?? 'https://mallblitz.com';

    const startUrl = getArg('url', baseUrl);
    const maxPages = parseMaxPages(getArg('max-pages', '150'));
    const outputDir = getArg('output', './seo-reports');
    const outputFormat = parseOutputFormat(getArg('format', 'both'));
    const excludePaths = parsePathList(
        args.find((arg) => arg.startsWith('--exclude-paths='))?.split('=')[1],
        DEFAULT_EXCLUDE_PATHS
    );

    const browser = await chromium.launch({ headless: true });

    try {
        const crawler = new SEOCrawler(browser, {
            startUrl,
            maxPages,
            outputDir,
            outputFormat,
            sameOriginOnly: true,
            excludePaths,
            timeout: 30000,
        });

        await crawler.crawl();

        console.log('\n✨ SEO audit completed successfully!');
    } catch (error) {
        console.error('❌ Error running SEO crawler:', error);
        process.exitCode = 1;

    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    void main();
}
