#!/usr/bin/env bun
import { Command } from 'commander';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('elizascraper')
  .description('CLI for Bera blockchain data scraping')
  .version(packageJson.version);

program
  .command('tweets-cron')
  .description('Start the tweets cron service')
  .option('-p, --port <number>', 'Port to listen on', '3007')
  .option('-t, --tags <string>', 'Custom search tags (comma-separated)', (val) => val.split(',').map(tag => tag.trim()).filter(Boolean))
  .option('-s, --start <date>', 'Start date (YYYY-MM-DD), defaults to 15 days ago on first run, 4 day ago on subsequent runs (just useful for one off runs, better to keep it default)')
  .option('-e, --end <date>', 'End date (YYYY-MM-DD), defaults to current date')
  .option('-r, --min-replies <number>', 'Minimum replies threshold', '4')
  .option('-w, --retweets <number>', 'Minimum retweets threshold', '2')
  .option('-m, --max-items <number>', 'Maximum number of tweets to fetch', '200')
  .action(async (options) => {
    try {
      const { Elysia } = await import('elysia');
      const { cron, Patterns } = await import('@elysiajs/cron');
      const { scrapeTweetsAndUpload } = await import('./lib/tweets.js');
      const { initializeCollection } = await import('./lib/storage.js');
      
      const port = parseInt(options.port, 10);
      console.log(`Starting tweets cron service on port ${port}, runs everyday at 10PM`);

      const tweetJob = async () => {
        await initializeCollection();
        await scrapeTweetsAndUpload({
          customTags: options.tags,
          startDate: options.start,
          endDate: options.end,
          minReplies: parseInt(options.minReplies, 10),
          minRetweets: parseInt(options.retweets, 10),
          customHandles: options.handles?.split(','),
          maxItems: parseInt(options.maxItems, 10)
        });
      };

      console.log('🤖 Running initial tweet scraper job');
      await tweetJob();

      const cronApp = new Elysia()
        .use(cron({
          name: 'tweets-cron',
          pattern: Patterns.EVERY_DAY_AT_10PM,
          run: async () => {
            console.log('🤖 Starting tweet scraper job');
            try {
              await tweetJob();
              return console.log('✅ Tweet scraper job completed');
            } catch (error) {
              return console.error('❌ Tweet scraper job failed:', error);
            }
          },
        }));

      cronApp.listen(port);
      console.log(`🔄 Tweet scraper running on port ${port}\n`);
      process.stdin.resume();
    } catch (error) {
      console.error('Error starting tweets cron:', error);
      process.exit(1);
    }
  });

  program
  .command('token-cron')
  .description('Start the token cron service')
  .option('-p, --port <number>', 'Port to listen on', '3008')
  .option('-i, --interval <number>', 'Interval in minutes', '60')
  .option('--currency <string>', 'Currency to track', 'usd')
  .option('--cg_category <string>', 'Category to track', 'berachain-ecosystem')
  .action(async (options) => {
    try {
      if (!process.env.COINGECKO_API_KEY || !process.env.DATABASE_URL) {
        console.error('❌ Missing required environment variables:');

        if (!process.env.DATABASE_URL) console.error('  - DATABASE_URL');
        if (!process.env.COINGECKO_API_KEY) console.error('  - COINGECKO_API_KEY');
        process.exit(1);
      }
      
      const { Elysia } = await import('elysia');
      const { cron, Patterns } = await import('@elysiajs/cron');
      const { checkDbConnection, initializeDatabase } = await import('./config/db.js');
      const { TokenTracker } = await import('./lib/token.js');
      
      const port = parseInt(options.port);
      const interval = parseInt(options.interval);
      const currency = options.currency;
      const cgcategory = options.cg_category;
      
      console.log(`Starting token cron service on port ${port}, interval: ${interval} minutes`);
    
      const isConnected = await checkDbConnection();
      
      if (!isConnected) {
        console.error('❌ Cannot connect to database. Please check your DATABASE_URL in .env');
        process.exit(1);
      }
      
      await initializeDatabase();

      const tokenJob = async () => {
        try {
          console.log(`🔄 Starting token update for ${cgcategory} in ${currency}...`);
          const tokenTracker = new TokenTracker(process.env.COINGECKO_API_KEY!);
          await tokenTracker.updateTokenData(currency, cgcategory);
          
          console.log('✅ Token update completed');
        } catch (error) {
          console.error('❌ Token update failed:', error);
          throw error;
        }
      };

      console.log('🤖 Running initial token update job');
      await tokenJob();

      const cronApp = new Elysia()
        .use(cron({
          name: 'token-cron',
          pattern: Patterns.everyMinutes(interval),
          run: async () => {
            console.log('🤖 Starting token update job');
            try {
              await tokenJob();
              return console.log('✅ Token update job completed');
            } catch (error) {
              return console.error('❌ Token update job failed:', error);
            }
          },
        }));

      cronApp.listen(port);
      console.log(`🔄 Token tracker running on port ${port}\n`);
      process.stdin.resume();
    } catch (error) {
      console.error('Error starting token cron:', error);
      process.exit(1);
    }
  });

program
  .command('site-cron')
  .description('Start the site scraper cron service')
  .option('-p, --port <number>', 'Port to listen on', '3010')
  .option('-i, --interval <number>', 'Interval in minutes', '60')
  .option('-l, --link <string>', 'link of the site to scrape', 'https://docs.berachain.com')
  .action(async (options) => {
    try {
      const { Elysia } = await import('elysia');
      const { cron, Patterns } = await import('@elysiajs/cron');
      const { siteScraper } = await import('./lib/scraper.js');
      
      const port = parseInt(options.port);
      const interval = parseInt(options.interval);
      const link = options.link;
      
      console.log(`Starting site cron service on port ${port}, interval: ${interval} minutes`);

      const siteJob = async () => {
        if (typeof siteScraper === 'function') {
          await siteScraper(link);
        } else {
          throw new Error('siteScraper function not found');
        }
      };

      console.log('🤖 Running initial docs scraper job');
      await siteJob();

      const cronApp = new Elysia()
        .use(cron({
          name: 'site-cron',
          pattern: Patterns.everyMinutes(interval),
          run: async () => {
            console.log('🤖 Starting docs scraper job');
            try {
              await siteJob();
              return console.log('✅ Docs scraper job completed');
            } catch (error) {
              return console.error('❌ Docs scraper job failed:', error);
            }
          },
        }));

      cronApp.listen(port);
      console.log(`🔄 Docs scraper running on port ${port}\n`);
      process.stdin.resume();
    } catch (error) {
      console.error('Error starting site cron:', error);
      process.exit(1);
    }
  });

program
  .command('server')
  .description('Start the API server')
  .option('-p, --port <number>', 'Port to listen on', '3000')
  .action(async (options) => {
    try {
      const port = parseInt(options.port);
    
      const { startServer } = await import('./server.js');
      
      if (typeof startServer !== 'function') {
        throw new Error('startServer function not found');
      }
      
      startServer(port);
      
      process.stdin.resume();
    } catch (error) {
      console.error('Error starting server:', error);
      process.exit(1);
    }
  });

if (import.meta.path === Bun.main) {
  program.parse();
}

export default program;