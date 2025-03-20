import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../config/env';
import { config } from '../config/constants';
import { Tweet } from '../types';

/**
 * storage.ts
 * 
 * exports - initializeCollection, upsertTweet, findSimilar, findByTopicAndTimeRange
 * 
 * initializeCollection - checks if the collection exists, if not creates it
 * upsertTweet - upserts a tweet embedding into the collection
 * findSimilar - finds similar tweets based on the embedding
 * 
 */

const client = new QdrantClient({ url: env.QDRANT_URL });
const { collectionName } = config.qdrant;

export const initializeCollection = async () => {
    try {
        const collections = (await client.getCollections()).collections;
        const exists = collections.some(collection => collection.name === collectionName)

        if (!exists) {
            await client.createCollection(collectionName, {
                vectors: {
                    size: config.qdrant.vectorSize,
                    distance: 'Cosine'
                }
            });
            console.log(`Collection ${collectionName} created successfully`);
        } else {
            console.log(`Collection ${collectionName} already exists`);
        }
    } catch (error: any) {
        console.error('Failed to initialize collection:', error);
        throw new Error(`Failed to initialize collection: ${error.message}`);
    }
};

export const generatePointId = (tweetId: string): number => {
    let hash = 0;
    for (let i = 0; i < tweetId.length; i++) {
        const char = tweetId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

export const hasTweets = async () => {
    try {
        const result = await client.count(collectionName);
        console.log(result.count,'Data points in collection');
        return result.count > 10;
    } catch (error: any) {
        console.error('Failed to check collection:', error);
        return false;
    }
};

export const checkTweetExists = async (tweetId: string) => {
    try {
        const pointId = generatePointId(tweetId);
        const result = await client.retrieve(collectionName, {
            ids: [pointId]
        });
        return result.length > 0;
    } catch (error: any) {
        console.error('Failed to check tweet:', error);
        throw new Error(`Failed to check tweet: ${error.message}`);
    }
};

export const upsertTweet = async (tweet: Tweet, embedding: number[]) => {
    try {
        /** basic sanity checks */
        if (!Array.isArray(embedding)) {
            throw new Error(`Embedding must be an array`);
        }
        if (!embedding.every(val => typeof val === 'number' && !isNaN(val))) {
            throw new Error('Embedding must contain only valid numbers');
        }

        const pointId = generatePointId(tweet.id);
        const point = {
            id: pointId,
            vector: embedding,
            payload: {
               tweet
            }
        };

        await client.upsert(collectionName, {
            points: [point]
        });

    } catch (error: any) {
        console.error('Failed to upsert tweet:', error);
        throw new Error(`Failed to upsert tweet: ${error.message}`);
    }
};

export const findSimilar = async (embedding: number[], limit = 20) => {
    try {
      const results = await client.search(collectionName, {
        vector: embedding,
        limit: limit * 2,
        with_payload: true,
      });
  
      if (!results?.length) {
        return [];
      }
  
      const validResults = results
        .filter(r => (r.payload as any)?.tweet?.createdAt)
        .map(r => ({
          ...r,
          score: r.score,
          date: new Date((r.payload as any).tweet.createdAt as string),
          payload: r.payload,
        }))
        .filter(r => !isNaN(r.date.getTime()));
  
      const now = new Date();
      const oldest = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

      /**
       * this below LOC calculates tweet relevance based on score and time decay factor
       * .7 is tweet relevance score and .3 is time decay factor
       */
      const scoredTweets = validResults
        .filter(r => r.date >= oldest)
        .map(r => {
          const ageInDays = (now.getTime() - r.date.getTime()) / (24 * 60 * 60 * 1000);
          const timeDecayFactor = Math.exp(-ageInDays / 30);
          const combinedScore = (r.score * 0.7) + (timeDecayFactor * 0.3);
          
          return {
            ...r.payload,
            combinedScore,
            originalScore: r.score,
            date: r.date,
          };
        })
        .sort((a, b) => b.combinedScore - a.combinedScore) 
        .slice(0, limit);
  
      return scoredTweets;
    } catch (error) {
      console.error('Error in findSimilar:', error);
      throw new Error('Failed to fetch similar tweets');
    }
};