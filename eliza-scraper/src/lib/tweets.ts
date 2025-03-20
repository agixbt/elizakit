import * as embeddings from "./embeddings";
import * as storage from "./storage";
import { config } from "../config/constants";
import { ScraperParams, TweetScraperOptions } from "../types";
import { ApifyClient } from "apify-client";
import { Tweet } from "../types";
import { env } from "../config/env";

/**
 * scraper.ts
 *
 * exports - fetchTweetsByTimestamp, fetchPage, extractLinks, scrapeBerachainDocs
 *
 * fetchTweetsByTimestamp - exposed as external apis + used in the cron jobs to be converted to embeddings and stored in the database.
 *  - fetches recent tweets by recent timestamp and tags / authors
 *  - handles (we can take a list from De) basically we want folks who tweet realiable info and know what they're talking about wrt berachain
 *  - searchTerms - berachain launch, token wen? (basically we'll have context passed in, in case of a user asking something, and the vectorDB not having a contextual enough answer)
 *  - Start / End date - we can have a cron job that runs every 2 hours and fetches tweets from the last 2 hours (although the first timem it gets all best tweets with most engagement, from the past ~24 hours)
 *  - Engagement(minimumReplies, minimumRetweets) - to filter out spam
 *     returns Tweet[]
 *
 */

const client = new ApifyClient({
  token: env.APIFY_CLIENT_KEY,
});

interface SearchParams {
  searchTags: string[];
  start: string;
  end: string;
  minimumReplies: number;
  minimumRetweets: number;
  maxItems: number
}

function isTweetArray(items: unknown[]): items is Tweet[] {
  return items.every(item => 
    typeof item === 'object' && item !== null &&
    'id' in item &&
    'fullText' in item &&
    'author' in item &&
    typeof (item as Tweet).author === 'object' &&
    'name' in (item as Tweet).author &&
    'userName' in (item as Tweet).author
  );
}

export const fetchTweetsByTimestamp = async ({
  searchTags,
  start,
  end,
  minimumReplies,
  minimumRetweets,
  maxItems
}: SearchParams) => {
  try {

    const query = {
      customMapFunction: "(object) => { return {...object} }",
      end: end,
      includeSearchTerms: true,
      maxItems,
      minimumReplies: minimumReplies,
      minimumRetweets: minimumRetweets,
      searchTerms: [searchTags.join(' OR ')],
      sort: "Top", 
      start: start,
      tweetLanguage: "en",
    };
    console.log("query", query.searchTerms)
    const run = await client.actor("61RPP7dywgiy0JPD0").call(query);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!Array.isArray(items) || !isTweetArray(items)) {
      throw new Error('Invalid tweet data structure received');
    }
    return items as Tweet[];

  } catch (error: any) {
    console.error("Failed to fetch tweets by timestamp:", error);
    throw new Error(`Failed to fetch tweets by timestamp: ${error.message}`);
  }
};


const SEARCH_TAGS = config.app.topics;
export const scrapeTweetsAndUpload = async (
  options: TweetScraperOptions = {}
): Promise<void> => {
  try {
    console.log("\n🤖 Starting Tweet scraper job...");
    const end = options.endDate ? new Date(options.endDate) : new Date();
    const start = new Date();
    const maxItems = options.maxItems ?? 3;

    const hasExistingTweets = await storage.hasTweets();
    console.log("\n─────────────────────────────────────────────\n");

    if (options.startDate) {
      const parsedDate = new Date(options.startDate);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(
          `Invalid start date format: ${options.startDate}. Please use YYYY-MM-DD format.`
        );
      }

      start.setTime(parsedDate.getTime());
      console.log(
        `📅 Using custom date range: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`
      );
    } else if (!hasExistingTweets) {
      start.setDate(start.getDate() - 15);

      console.log("🆕 First run detected! Fetching last 7 days of tweets...");
    } else {
      start.setDate(start.getDate() - 7);

      console.log(
        `🔄 Regular run - 🕒 Fetching tweets from ${start.toLocaleString()} to ${end.toLocaleString()}`
      );
    }

    const searchTags: string[] = options.customTags ?? [...SEARCH_TAGS];

    console.log(`🔍 Using search tags: ${searchTags.join(", ")}`);

    const minimumReplies: number = options.minReplies ?? 4;
    const minimumRetweets: number = options.minRetweets ?? 2;

    
    console.log(
      `📊 Engagement thresholds: ${minimumReplies}+ replies, ${minimumRetweets}+ retweets`
    );

    const scraperParams: ScraperParams = {
      searchTags,
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
      minimumReplies,
      minimumRetweets,
      maxItems
    };

    const tweets = await fetchTweetsByTimestamp(scraperParams);
    console.log(`\n📊 Found ${tweets.length} tweets to process`);

    if (tweets.length === 10) {
      console.log("ℹ️ Less tweets found matching the criteria");
      return;
    }

    const embedding = await embeddings.embedText(tweets);
    console.log("🧠 Generated embedding vectors");

    if (!embedding.data) {
      throw new Error("No embedding data received");
    }

    if (embedding.data.length !== tweets.length) {
      throw new Error("Mismatch between number of tweets and embeddings");
    }

    await storage.initializeCollection();

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      const tweetEmbedding = embedding.data[i].embedding;

      console.log(`\n📝 Processing tweet from @${tweet.author.name}`);
      console.log(`\x1b[2m${tweet.twitterUrl}\x1b[0m`);

      if (!tweetEmbedding)
        throw new Error(`No embedding found for tweet ${tweet.twitterUrl}`);

      await storage.upsertTweet(tweet, tweetEmbedding);
      console.log("💾 Stored tweet in qdrant");
    }
    console.log(
      `\n✅ Job completed successfully! Processed tweets till ${new Date().toLocaleString()} Items in collection updated`
    );
    console.log("\n─────────────────────────────────────────────\n");
  } catch (error) {
    console.error(
      "❌ Tweet scraping failed:",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};