import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    pool = new Pool({ connectionString });
  
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
}

export async function checkDbConnection(): Promise<boolean> {
  console.log('\nAttempting to connect to database...');
  let client;
  
  try {
    const connectPromise = getPool().connect();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
    );
    
    client = await Promise.race([connectPromise, timeoutPromise]);
    await client.query('SELECT 1');
    console.log('㏈ Database connection successful');
    return true;

  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    if (error.message.includes('timeout')) {
      console.error('💡 This could indicate the database is unreachable or credentials are incorrect');
    }
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function initializeDatabase(): Promise<void> {
  const client = await getPool().connect();
  
  try {
    console.log('🚀 Starting database initialization...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS token_data (
        db_id SERIAL PRIMARY KEY,
        id TEXT UNIQUE NOT NULL,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        image TEXT NOT NULL,
        current_price DECIMAL(18,8),
        market_cap DECIMAL(36,2),
        market_cap_rank DECIMAL(65,30),
        fully_diluted_valuation DECIMAL(36,2),
        total_volume DECIMAL(36,2),
        high_24h DECIMAL(18,8),
        low_24h DECIMAL(18,8),
        price_change_24h DECIMAL(18,8),
        price_change_percentage_24h DECIMAL(10,2),
        market_cap_change_24h DECIMAL(36,2),
        market_cap_change_percentage_24h DECIMAL(10,2),
        circulating_supply DECIMAL(36,8),
        total_supply DECIMAL(36,8),
        max_supply DECIMAL(36,8),
        ath DECIMAL(18,8),
        ath_change_percentage DECIMAL(10,2),
        ath_date TIMESTAMP,
        atl DECIMAL(18,8),
        atl_change_percentage DECIMAL(10,2),
        atl_date TIMESTAMP,
        last_updated TIMESTAMP NOT NULL
      )
    `);

    console.log('✨ Database initialization complete!\n');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}