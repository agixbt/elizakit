export const config = {
    twitter: {
        searchTags: process.env.TWITTER_SEARCH_TAGS ? process.env.TWITTER_SEARCH_TAGS.split(',') : ['berachain'],
    },
    qdrant: {
        collectionName: process.env.QDRANT_COLLECTION_NAME || 'twitter_embeddings',
        vectorSize: parseInt(process.env.VECTOR_SIZE!) || 1536
    },

    app: {
        topics: process.env.APP_TOPICS 
            ? process.env.APP_TOPICS.split(',').map(topic => topic.trim())
            : [
                "berachain OR bera", 
                "berachain launch", 
                "berachain token", 
                "berachain defi", 
                "berachain nft", 
                "berachain infrastructure", 
                "berachain token pump", 
                "berachain token dump"
              ],
        cronSchedule: process.env.APP_CRON_SCHEDULE || '*/2 * * * *',
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
    }
} as const;