import { Elysia } from 'elysia';
import * as embeddings from '../lib/embeddings';
import * as storage from '../lib/storage';
import { config } from '../config/constants';

export const tweetRoutes = new Elysia({ prefix: '/tweets' })
    .get('/search', async ({ query }) => {
        if (!query.searchString) {
            throw new Error('Search query is required');
        }

        console.log('🔍 Generating embedding for search:', query.searchString);
        const embedding = await embeddings.embedText(query.searchString);
        if (!embedding.data?.[0]?.embedding) {
            throw new Error('Failed to generate embedding');
        }

        console.log('🔎 Searching for similar tweets');
        const results = await storage.findSimilar(embedding.data[0].embedding);
        console.log(`✨ Found ${results.length} matching tweets`);
        
        return {
            status: 'success',
            results
        };
    })
    .get('/random', async ({ query }) => {
        const topic = config.app.topics[
            Math.floor(Math.random() * config.app.topics.length)
        ];
        
        console.log('🎲 Fetching random tweet for topic:', topic);
        const embeddedTopic = await embeddings.embedText(topic);
        if (!embeddedTopic.data?.[0]?.embedding) {
            throw new Error('Failed to generate embedding');
        }

        const tweets = await storage.findSimilar(embeddedTopic.data[0].embedding);
        console.log(`✨ Found ${tweets.length} tweets for topic: ${topic}`);
        
        return { topic, tweet: tweets };
    });