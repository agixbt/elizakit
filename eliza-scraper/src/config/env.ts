import { config } from 'dotenv';
config();

export const env = {
    APIFY_CLIENT_KEY: process.env.APIFY_API_KEY,
    VOYAGE_API_KEY: process.env.VOYAGE_API_KEY!,
    QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
    QDRANT_API_KEY: process.env.QDRANT_API_KEY!,
    QDRANT_COLLECTION_NAME: process.env.QDRANT_COLLECTION_NAME!,
    CRON_SCHEDULE: process.env.CRON_SCHEDULE || '*/2 * * * *',
};