
export interface TimeRange {
    start: Date;
    end: Date;
}

export interface Token {
    chainId: string;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    createOperation: CreateOperation;
    transfers: Transfers;
    holdersCount: number;
  }
  
  interface Transfers {
    last24h: number;
    last48h: number;
    last72h: number;
  }
  
  interface CreateOperation {
    timestamp: string;
    txHash: string;
  }

  export interface Tweet {
    type: string;
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
    isReply: boolean;
    isPinned: boolean;
    author: Author;
    entities: Metadata;
    isRetweet: boolean;
    isQuote: boolean;
    media: any[];
    isConversationControlled: boolean;
    searchTerm: string;
  }
  interface Metadata {
    hashtags: any[];
    symbols: any[];
    urls: any[];
    user_mentions: any[];
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
    coverPicture: string;
    description: string;
    location: string;
    followers: number;
    following: number;
    status: string;
    canDm: boolean;
    canMediaTag: boolean;
    createdAt: string;
    fastFollowersCount: number;
    favouritesCount: number;
    hasCustomTimelines: boolean;
    isTranslator: boolean;
    mediaCount: number;
    statusesCount: number;
    withheldInCountries: any[];
    possiblySensitive: boolean;
    pinnedTweetIds: string[];
  }

  /**
 * Options for the command line interface
 */
export interface CommandOptions {
  retweets: string;
  port: string;
  interval: string;
  tags: string;
  start?: string;
  end?: string;
  minReplies: string;
  minRetweets: string;
  handles: string;
  maxItems: string;
}

/**
 * Options for the tweet scraper service
 */
export interface TweetScraperOptions {
  customTags?: string[];
  startDate?: string;
  endDate?: string;
  minReplies?: number;
  minRetweets?: number;
  customHandles?: string[];
  maxItems?: number;
}

/**
 * Parameters for the tweet fetching operation
 */
export interface ScraperParams {
  searchTags: string[];
  start: string;
  end: string;
  minimumReplies: number;
  minimumRetweets: number;
  maxItems: number
}

export interface TokenResponse {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap_change_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  ath_date: string | null;
  atl: number | null;
  atl_change_percentage: number | null;
  atl_date: string | null;
  last_updated: string | null;
}