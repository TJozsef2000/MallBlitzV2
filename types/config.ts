export interface CrawlerConfig {
    startUrl: string;
    maxPages?: number;
    outputDir?: string;
    outputFormat?: 'json' | 'csv' | 'both';
    sameOriginOnly?: boolean;
    includePaths?: string[];
    excludePaths?: string[];
    waitForSelector?: string;
    timeout?: number;
}