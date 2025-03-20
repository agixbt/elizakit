import { Pool } from 'pg';
import { CoingeckoService } from './coingecko';

export class TokenTracker {
  private coingeckoService: CoingeckoService;
  private pool: Pool;

  constructor(apiKey: string) {
    this.coingeckoService = new CoingeckoService(apiKey);
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async updateTokenData(
    currency: string,
    category: string
  ) {
    const client = await this.pool.connect();
    try {
      console.log(`🔄 Fetching ecosystem tokens for ${category}`);
      const tokens = await this.coingeckoService.getEcosystemTokens(
        category,
        currency
      );

      console.log(`🔄 Updating token data for ${tokens.length} tokens`);
      
      await client.query('BEGIN');  
      for (const token of tokens) {
        const query = `
          INSERT INTO token_data (
            id, symbol, name, image, current_price, market_cap, market_cap_rank,
            fully_diluted_valuation, total_volume, high_24h, low_24h,
            price_change_24h, price_change_percentage_24h, market_cap_change_24h,
            market_cap_change_percentage_24h, circulating_supply, total_supply,
            max_supply, ath, ath_change_percentage, ath_date, atl,
            atl_change_percentage, atl_date, last_updated
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
            $17, $18, $19, $20, $21, $22, $23, $24, $25)
          ON CONFLICT (id) DO UPDATE SET
            symbol = $2,
            name = $3,
            image = $4,
            current_price = $5,
            market_cap = $6,
            market_cap_rank = $7,
            fully_diluted_valuation = $8,
            total_volume = $9,
            high_24h = $10,
            low_24h = $11,
            price_change_24h = $12,
            price_change_percentage_24h = $13,
            market_cap_change_24h = $14,
            market_cap_change_percentage_24h = $15,
            circulating_supply = $16,
            total_supply = $17,
            max_supply = $18,
            ath = $19,
            ath_change_percentage = $20,
            ath_date = $21,
            atl = $22,
            atl_change_percentage = $23,
            atl_date = $24,
            last_updated = $25
        `;
        
        const values = [
          token.id,
          token.symbol,
          token.name,
          token.image,
          token.current_price,
          token.market_cap,
          token.market_cap_rank,
          token.fully_diluted_valuation,
          token.total_volume,
          token.high_24h,
          token.low_24h,
          token.price_change_24h,
          token.price_change_percentage_24h,
          token.market_cap_change_24h,
          token.market_cap_change_percentage_24h,
          token.circulating_supply,
          token.total_supply,
          token.max_supply,
          token.ath,
          token.ath_change_percentage,
          token.ath_date ? new Date(token.ath_date) : null,
          token.atl,
          token.atl_change_percentage,
          token.atl_date ? new Date(token.atl_date) : null,
          token.last_updated ? new Date(token.last_updated) : new Date()
        ];
        
        await client.query(query, values);
        console.log(`🔄 Updated token data for ${token.symbol}`);
      }
      
      await client.query('COMMIT');
      
      return { success: true, count: tokens.length };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating token data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getLatestTokenData(symbol?: string) {
    const client = await this.pool.connect();
    try {
      if (symbol) {
        const query = `
          SELECT * FROM token_data
          WHERE LOWER(symbol) = LOWER($1)
          ORDER BY last_updated DESC
          LIMIT 1
        `;
        
        const result = await client.query(query, [symbol]);
        
        if (result.rows.length === 0) {
          throw new Error(`Token details not found in db.`);
        }
        
        return result.rows[0];
      }

      const query = `
        SELECT * FROM token_data
        ORDER BY last_updated DESC
      `;
      
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching latest token data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}