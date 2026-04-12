export interface SEOMetaData {
    url: string;
    title: string | null;
    description: string | null;
    canonical: string | null;
    robots: string | null;
    keywords: string | null;
    author: string | null;
    ogTags: Record<string, string>;
    twitterTags: Record<string, string>;
    otherMetaTags: Record<string, string>;
    h1Tags: string[];
    timestamp: string;
    statusCode: number | null;
}
