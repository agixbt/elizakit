import {
    type ActionExample,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    type Action,
    elizaLogger,
} from "@elizaos/core";
import { Tweet } from "../providers/latest-tweets.provider";

const formatTweets = (tweets: Tweet[]) => {
  return tweets.map(tweet => `
🐦 ${tweet.tweet.author.name} (@${tweet.tweet.author.userName})
💬 ${tweet.tweet.text}
⏰ Posted: ${tweet.tweet.createdAt}
❤️ ${tweet.tweet.likeCount} 🔄 ${tweet.tweet.retweetCount} 💭 ${tweet.tweet.replyCount}
  `.trim()).join('\n\n');
};

export default {
    name: "TWEET_REPLY",
    similes: [
        "SEARCH_TWEETS",
        "FIND_TWEETS",
        "GET_TWEETS",
        "LATEST_TWEETS",
        "LATEST_TWEETS",
        "RECENT_TWEETS",
        "RECENT_TWEETS",
    ],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        return (text.includes('bera') || text.includes('berachain')) && 
               (text.includes('?') || 
                text.includes('what') || 
                text.includes('how') || 
                text.includes('when') ||
                text.includes('latest') ||
                text.includes('tell') ||
                text.includes('update'));
    },
    description: "Search and reply with relevant Berachain tweets",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("🎛️ Starting TWEET_REPLY handler...");

        try {
            const text = message.content.text.toLowerCase().trim();
            const searchTerms = text
                .replace(/what|is|are|the|latest|about|tell|me|how|when|can|bera|berachain/g, '')
                .trim();

            const response = await fetch(
                `${process.env.SCRAPER_URL}/tweets/search?searchString=${encodeURIComponent(searchTerms)}`
            );

            if (!response.ok) {
                throw new Error(`API response was not ok: ${response.status}`);
            }

            const data = (await response.json()) as { status: string; results: Tweet[] };

            if (data.status === 'error' || !data.results || data.results.length === 0) {
                if (callback) {
                    callback({
                        text: "I couldn't find any relevant tweets about that.",
                        content: { error: "No tweets found" },
                    });
                }
                return false;
            }

            const formattedTweets = formatTweets(data.results);
            if (callback) {
                callback({
                    text: `Here's what I found about ${searchTerms}:\n\n${formattedTweets}`,
                    content: { tweets: data.results },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error in tweet reply handler:", error);
            if (callback) {
                callback({
                    text: `Sorry, I couldn't fetch any tweets right now: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the latest about Berachain infrastructure?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me check the latest tweets about Berachain infrastructure.",
                    action: "TWEET_REPLY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "How is the Bera ecosystem growing?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll search for tweets about Bera ecosystem growth.",
                    action: "TWEET_REPLY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's happening in the Berachain ecosystem lately?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll fetch the latest updates about the Berachain ecosystem for you.",
                    action: "TWEET_REPLY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Tell me about Infrared Finance on Berachain",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me search for information about Infrared Finance in the Berachain ecosystem.",
                    action: "TWEET_REPLY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "How is DeFi looking in Berachain?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll find the latest tweets about DeFi development in the Berachain ecosystem.",
                    action: "TWEET_REPLY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Do you know about any DEX launching on Berachain?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll search for information about upcoming DEX launches on Berachain.",
                    action: "TWEET_REPLY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What NFT projects should I look out for in Berachain?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me find the trending NFT projects in the Berachain ecosystem.",
                    action: "TWEET_REPLY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Tell me about Berabaddies",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll search for the latest updates about the Berabaddies NFT project.",
                    action: "TWEET_REPLY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the latest on Bera liquid staking?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll look up recent information about liquid staking developments on Berachain.",
                    action: "TWEET_REPLY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "How is the Berachain testnet performing?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me check the latest updates about Berachain's testnet performance.",
                    action: "TWEET_REPLY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's new with Honey on Berachain?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll search for recent updates about the Honey protocol on Berachain.",
                    action: "TWEET_REPLY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Tell me about upcoming airdrops on Berachain",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll look for information about potential airdrops in the Berachain ecosystem.",
                    action: "TWEET_REPLY",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;