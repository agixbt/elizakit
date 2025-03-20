# Integration Guide

This guide explains how to integrate the Eliza Scraper with an eliza agent to create an intelligent agent with context of latest tweets on configured topics, latest token data on any coin gecko ecosystem and docs.

## Architecture Overview

The system consists of three main components:

1. **Eliza Scraper**: A data collection service that gathers:
   - Twitter conversations and engagement
   - Token prices and market data
   - Documentation from ecosystem websites

2. **Bera Bot**: An Eliza spun AI agent that:
   - Processes and responds to user queries
   - Utilizes scraped data through custom providers
   - Maintains up-to-date ecosystem knowledge
   - Has providers and actions configured to leverage the scraper
     - `docs.provider.ts` provides docs / any site context to eliza memories
           - runs on every new tweet / reply 
           - caches scraped data to be referenced later, instead of making a api call to the scraper
           - the cache refreshes every X days(depends on your config, defaults to one week)
           
     - `ecosystem.provider.ts` similar to docs, for another site
  
     - `latest-tweets.provider.ts` provides a set of random tweets for context to the eliza LLM on any topic (based on a set of topics coming from the config) 

     - `token.provider.ts` fetches token data from the scraper db (you can configure what tokens to be scraped based on coin-gecko category in the scraper )

     - `reply.actions.ts` handles context for eliza replies
           - runs on every question the bot gets asked
           - takes the question, sends it over the scraper
           - there, it gets converted to an embedding and that is searched across the vector db for similar tweets
           - api returns the similar tweets to help with latest updated context

     - `token.actions.ts` handles question related to tokens
           - runs on every token related question
           - dynamically figures out the token ticker, sends it over to the scraper
           - scraper returns with latest information
           - formats categorically and sends the reply to user


3. **Eliza Terminal UI**: A chatbot UI integrated with berabot
      - Persists user chat history with localstorage
      - Deducts a small balance of eth on every message
      - Maintains multi context (every account is connected to a different room)
      - A cute matrix ui to top it of
  


## Quick Start Guide

This guide will help you set up and deploy your Eliza agent quickly and efficiently.

### Prerequisites
- Node.js (v22 or higher)
- pnpm (or any package manager)
- Docker and Docker Compose
- Git

## Installation

### 1. Setup your eliza agent
```bash
git clone https://github.com/elizaOS/eliza-starter
cd eliza-starter
cp .env.example .env (make sure to file your env)
pnpm i
pnpm build
pnpm start
```
You'll see your starter bot running, now we'll start with setting up scraper cron and adding custom actions and providers to work with the bot.


### 2. Install Scraper CLI globally
```bash
pnpm i -g eliza-scraper
```

### 3. Start DB Docker Containers
```bash
docker-compose up -d

```

`sample docker-compose.yml file`

```docker
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: token-scraper-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: token_scraper
    ports:
      - "5432:5432"
    volumes:
      - token_scraper_data:/var/lib/postgresql/data

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  token_scraper_data:
  qdrant_data:

```

### 4. Add to eliza `.env`
```env
# Required APIs
APIFY_API_KEY=your_apify_key
COINGECKO_API_KEY=your_coingecko_key
OPENAI_API_KEY=
SCRAPER_URL=

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/token_scraper

# Vector DB
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=twitter_embeddings

# Optional
TWITTER_SEARCH_TAGS=berachain,bera
APP_TOPICS=berachain launch,berachain token
```

### 5. Set Up Crons and start Server
We have three crons, each responsible for handling a particular type of data with further (optional) configs.


#### Start API Server
```bash
elizascraper server --port <number>

```

#### Tweet Scraping Service
```bash
elizascraper tweets-cron [options]

Options:
--port Port number (default: 3000)
--interval Cron interval in minutes (default: 60)
--tags Custom search tags (comma-separated)
--start Start date (YYYY-MM-DD)
--end End date (YYYY-MM-DD)
--min-replies Minimum replies threshold (default: 4)
--retweets Minimum retweets threshold (default: 2)
--handles Twitter handles to track
--max-items Maximum tweets to fetch (default: 3)
```


#### Tracking Latest Token Data
```bash
elizascraper token-cron [options]

Options:
-p, --port <number> Port to listen on (default: 3008)
-i, --interval <number> Interval in minutes (default: 60)
--currency <string> Currency to track (default: 'usd')
--cg_category <string> CoinGecko category (default: 'berachain-ecosystem')
```


#### Documentation Scraping Service
```bash
elizascraper site-cron [options]

Options:
-p, --port <number> Port to listen on (default: 3010)
-i, --interval <number> Interval in minutes (default: 60)
-l, --link <string> URL to scrape (default: 'https://docs.berachain.com')

```


## API Documentation

Check the Api Documentation in the scraper's `README.md` for any custom implementations.

## Custom Actions and Providers

As mentioned above, you can use the custom actions / providers existing in bera-agent folder, to leverage the scraper. 

`docs.provider.ts`
`ecosystem.provider.ts`
`latest-tweets.provider.ts`
`reply.actions.ts`
`token.actions.ts`

These are examples we use for our berachain agent, you can leverage them to finetune it according to your needs

Also, you could write custom actions from scratch to your usecase, based on the scraper apis.

#### Customising Bot Character

To customise bot character, you can edit the personality in `charater.ts` and you can have muliple agents as well, refer to [this](https://elizaos.github.io/eliza/docs/core/characterfile/) 


## Setting Up the Terminal Interface

The terminal interface should be installed in a separate directory:

```bash
# In a new terminal window
git clone https://github.com/repo/eliza-terminal
cd eliza-terminal

# Install dependencies
pnpm i

# Start the development server
pnpm run dev
```

TERMINAL DEMO -
[part 1](https://www.loom.com/share/363732ea97d247178493f162fe6be1b1?sid=2482bd6d-fa59-4a0e-a4cf-16c43c4f8dcc)
[part 2](https://www.loom.com/share/c619ea36681b45aab16eeecdb64f5641?sid=0420e62f-044a-4926-a29f-3abf5eabd623)


## Next Steps

- Visit the chatbot at `http://localhost:3000`
- Configure your agent's personality and responses to finetune it based on your needs.


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
