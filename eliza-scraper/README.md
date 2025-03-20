# Eliza Scraper

A powerful scraping and RAG (Retrieval Augmented Generation) toolkit for collecting, processing, and serving blockchain ecosystem data. Built with Bun, TypeScript, and modern vector search capabilities.

## Features

- 🤖 Automated Twitter data scraping with engagement filtering
- 📊 Real-time token price and market data tracking via CoinGecko
- 📑 Documentation site scraping with caching
- 🔄 Configurable cron jobs for automated data collection
- 🔍 Vector search with time-decay relevance scoring
- 🚀 REST API with Swagger documentation

## Architecture

### RAG Pipeline for Tweet Processing

```mermaid
graph TD
    A[Twitter] --> B[Apify Scraper]
    B --> C[Filters]
    C --> D[Text Processing]
    D --> E[OpenAi Embedding]
    E --> F[Qdrant Vector DB]
    F --> G[Search API]
    
    subgraph "filters"
    C --> H[Min Replies]
    C --> I[Min Retweets]
    C --> J[Search Tags]
    C --> K[Kaito Most Mindshare handles]
    end
    
    subgraph "Vector Search"
    F --> L[Semantic Search]
    end 
```

### System Architecture

```mermaid
graph TB
    CLI[CLI Interface] --> Services
    API[REST API] --> Services
    
    subgraph "Services"
    Tweets[Tweet Service]
    Tokens[Token Service]
    Docs[Site Service]
    end
    
    subgraph "Storage"
    Qdrant[(Qdrant Vector DB)]
    Postgres[(PostgreSQL)]
    end
    
    Services --> Storage
```

## Scraper Quick Start

1. Install globally:
```bash
npm i @agixbt/elizascraper
```

2. Create `.env` file:
```env
# Required APIs
APIFY_API_KEY=your_apify_key
COINGECKO_API_KEY=your_coingecko_key
OPENAI_API_KEY=

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/token_scraper

# Vector DB
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=twitter_embeddings

# Optional
TWITTER_SEARCH_TAGS=berachain,bera
APP_TOPICS=berachain launch,berachain token
```

3. Start required services:
```bash
docker-compose up -d
```

## CLI Commands

### Start API Server
```bash
elizascraper server --port <number>

```

### Tweet Scraping Service
```bash
elizascraper tweets-cron [options]

Options:
--port Port number (default: 3000)
--tags Custom search tags, can also pass twitter search strings, check out https://github.com/igorbrigadir/twitter-advanced-search (comma-separated)
--start Start date (YYYY-MM-DD)
--end End date (YYYY-MM-DD)
--min-replies Minimum replies threshold (default: 4)
--retweets Minimum retweets threshold (default: 2)
--max-items Maximum tweets to fetch (default: 200)
```
Disclaimer: make sure you don't run the cron job in a small time interval, with start and end date less than 3 days, fetching less than 50 tweets, would lead to a ban shortly on your apify key.

To prevent ban, same search query, ran multiple times inside an hour would be skipped over.

### Tracking Latest Token Data
```bash
elizascraper token-cron [options]

Options:
-p, --port <number> Port to listen on (default: 3008)
-i, --interval <number> Interval in minutes (default: 60)
--currency <string> Currency to track (default: 'usd')
--cg_category <string> CoinGecko category (default: 'berachain-ecosystem')
```


### Documentation Scraping Service
```bash
elizascraper site-cron [options]

Options:
-p, --port <number> Port to listen on (default: 3010)
-i, --interval <number> Interval in minutes (default: 60)
-l, --link <string> URL to scrape (default: 'https://docs.berachain.com')
```

## API Documentation

### Tweets API

#### GET /tweets/search
Search for tweets based on semantic similarity.

**Query Parameters:**
- `searchString` (required): Text to search for semantically similar tweets

**Response Schema:**
```typescript
{
  status: "success" | "error",
  results: {
    tweet: {
      id: string,
      text: string,
      fullText: string,
      author: {
        name: string,
        userName: string,
        profilePicture: string
      },
      createdAt: string,
      retweetCount: number,
      replyCount: number,
      likeCount: number
    },
    combinedScore: number,
    originalScore: number,
    date: string
  }[]
}
```


#### GET /tweets/random
Get random tweets by predefined topics.

**Response Schema:**
```typescript
{
  topic: string,
  tweet: {
    tweet: {
      id: string,
      text: string,
      fullText: string,
      author: {
        name: string,
        userName: string,
        profilePicture: string
      },
      createdAt: string,
      retweetCount: number,
      replyCount: number,
      likeCount: number
    },
    combinedScore: number,
    originalScore: number,
    date: string
  }[]
}
```

### Tokens API

#### GET /tokens
Get token market data.

**Query Parameters:**
- `symbol` (optional): Token symbol to filter results

**Response Schema:**
```typescript
{
  status: "success" | "error",
  results: {
    id: string,
    symbol: string,
    name: string,
    image: string,
    currentPrice: number,
    marketCap: number,
    marketCapRank: number,
    fullyDilutedValuation: number,
    totalVolume: number,
    high24h: number,
    low24h: number,
    priceChange24h: number,
    priceChangePercentage24h: number,
    marketCapChange24h: number,
    marketCapChangePercentage24h: number,
    circulatingSupply: number,
    totalSupply: number,
    maxSupply: number,
    ath: number,
    athChangePercentage: number,
    athDate: string,
    atl: number,
    atlChangePercentage: number,
    atlDate: string,
    lastUpdated: string
  }
}
```


### Documentation API

#### GET /docs/scrape
Scrape and cache documentation from a given URL.

**Query Parameters:**
- `url` (required): URL of the documentation site to scrape

**Response Schema:**
```typescript
{
  status: "success" | "error",
  data: {
    title: string,
    last_updated: string,
    total_sections: number,
    sections: {
      topic: string,
      source_url: string,
      overview: string,
      subsections: {
        title: string,
        content: string
      }[]
    }[]
  },
  source: "cache" | "fresh"
} | {
  status: "error",
  message: string
}
```

**Cache Behavior:**
- Documentation is cached for 7 days
- Returns cached version if available and not expired
- Automatically refreshes cache if data is older than 7 days


### Error Handling

All routes use a standardized error response format:

```typescript
{
  status: "error",
  code: string,
  message: string
}
```


## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

MIT