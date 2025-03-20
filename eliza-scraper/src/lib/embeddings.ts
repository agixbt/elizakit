import { env } from '../config/env';
import { config } from '../config/constants';
import { Tweet } from '../types';

/**
 * embeddings.ts
 * 
 * exports - createTweetEmbeddingText, embedText
 * 
 * generates embedding text for a tweet and embeds it using OpenAI
 */

import OpenAI from "openai";
const openai = new OpenAI({apiKey: config.openai.apiKey});

export const createTweetEmbeddingText = (tweets: Tweet[]) => {
    return tweets.map(tweet => {
        const textParts = [
            tweet.fullText,
            tweet.author.name,
        ].filter(Boolean);
        
        return textParts.join(' ');
    });
};

export const embedText = async (input: Tweet[] | string) => {
    if (!input) throw new Error('Input is required for embedding');
 
    const textToEmbed = Array.isArray(input)
        ? createTweetEmbeddingText(input) 
        : [input];
 
    const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: textToEmbed,
            encoding_format: "float",
          });

        return embedding;
 };
