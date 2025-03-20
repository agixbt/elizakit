import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

export interface Tweet {
  tweet: {
    id: string;
    url: string;
    twitterUrl: string;
    text: string;
    fullText: string;
    source: string;
    retweetCount: number;
    replyCount: number;
    likeCount: number;
    quoteCount: number;
    viewCount: number;
    createdAt: string;
    bookmarkCount: number;
    author: Author;
    entities: Metadata;
    isRetweet: boolean;
    isQuote: boolean;
    media: any[];
    isConversationControlled: boolean;
    searchTerm: string;
  };
}

interface Author {
  type: string;
  userName: string;
  url: string;
  twitterUrl: string;
  id: string;
  name: string;
  isVerified: boolean;
  isBlueVerified: boolean;
  profilePicture: string;
  description: string;
  location: string;
  followers: number;
  following: number;
}

interface Metadata {
  hashtags: any[];
  symbols: any[];
  urls: any[];
  user_mentions: any[];
}

interface APIResponse {
  topic: string;
  tweet: Tweet[];
}

const formatTweets = (tweets: Tweet[], topic: string): string => {
  const header = `🎯 Topic: ${topic}\n\n`;

  const formattedTweets = tweets
    .map((t) => {
      const author = t.tweet.author;
      return `👤 ${author.name} (@${author.userName})
📱 ${author.followers.toLocaleString()} followers
💬 ${t.tweet.fullText}
⏰ ${t.tweet.createdAt}
📊 ${t.tweet.likeCount} likes, ${t.tweet.retweetCount} RTs, ${
        t.tweet.replyCount
      } replies
🔗 ${t.tweet.twitterUrl}
-------------------`;
    })
    .join("\n\n");

  return header + formattedTweets;
};

const tweetProvider: Provider = {
  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state?: State
  ): Promise<string> => {
    try {

      console.log(`🔍 Fetching tweets`);
      const response = await fetch(`${process.env.SCRAPER_URL}/tweets/random`);
      console.log("🌐 Random API Status:", response.status);

      if (!response.ok) {
        console.error("❌ Random API response not OK:", response.status);
        throw new Error(`API response was not ok: ${response.status}`);
      }

      const data = (await response.json()) as APIResponse;
      console.log("📦 Random API Response topic:", data.topic);
      console.log(
        `✨ Found ${data.tweet.length} tweets`
      );

      if (!data.tweet || data.tweet.length === 0) {
        console.log("⚠️ No tweets found for topic:", data.topic);
        return "";
      }

      const totalEngagement = data.tweet.reduce(
        (acc, t) => ({
          likes: acc.likes + t.tweet.likeCount,
          retweets: acc.retweets + t.tweet.retweetCount,
          replies: acc.replies + t.tweet.replyCount,
          views: acc.views + (t.tweet.viewCount || 0),
        }),
        { likes: 0, retweets: 0, replies: 0, views: 0 }
      );

      console.log(`📊 Total Engagement for ${data.tweet.length} tweets:
        Likes: ${totalEngagement.likes}
        Retweets: ${totalEngagement.retweets}
        Replies: ${totalEngagement.replies}
        Views: ${totalEngagement.views}
      `);

      console.log("✅ Successfully formatted all tweets for context");
      return formatTweets(data.tweet, data.topic);
    } catch (error) {
      console.error("🚨 Error in tweet provider:", error);
      return "";
    }
  },
};

export default tweetProvider;
