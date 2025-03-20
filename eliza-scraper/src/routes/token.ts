/**
 * handle all routes related to token here
 */

import { Elysia } from 'elysia';
import { TokenTracker } from '../lib/token';

export const tokenRoutes = new Elysia({ prefix: '/tokens' })
  .get('/', async ({ query }) => {
    try {
      const tokenTracker = new TokenTracker(process.env.COINGECKO_API_KEY!);
      const symbol = query?.symbol as string | undefined;

      console.log(`🔍 Fetching token data${symbol ? ` for ${symbol}` : ''}`);
      const results = await tokenTracker.getLatestTokenData(symbol);

      return {
        status: 'success',
        results: results
      };
    } catch (error) {
      console.error('Error fetching token data:', error);
      throw error;
    }
  });