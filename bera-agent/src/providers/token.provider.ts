import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

interface TokenData {
  db_id: number;
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: string | null;
  market_cap: string | null;
  market_cap_rank: string | null;
  fully_diluted_valuation: string | null;
  total_volume: string | null;
  high_24h: string | null;
  low_24h: string | null;
  price_change_24h: string | null;
  price_change_percentage_24h: string | null;
  market_cap_change_24h: string | null;
  market_cap_change_percentage_24h: string | null;
  circulating_supply: string | null;
  total_supply: string | null;
  max_supply: string | null;
  ath: string | null;
  ath_change_percentage: string | null;
  ath_date: string | null;
  atl: string | null;
  atl_change_percentage: string | null;
  atl_date: string | null;
  roi: any;
  last_updated: string;
}

interface APIResponse {
  status: string;
  results: TokenData[];
}

interface TokenMetrics {
  price: {
    value: number;
    change24h: number;
    volatility: number;
    confidence: 'high' | 'medium' | 'low';
    athDistance: number;
    atlDistance: number;
  };
  volume: {
    value24h: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    health: 'high' | 'medium' | 'low';
    changePercentage: number;
  };
  marketCap: {
    value: number;
    rank: number;
    dominance: number;
    trend: 'growing' | 'shrinking' | 'stable';
    changePercentage: number;
  };
  supply: {
    circulating: number;
    total: number;
    max: number | null;
    utilization: number;
    concentration: 'high' | 'medium' | 'low';
  };
}

interface MarketOverview {
  totalTokens: number;
  activeTokens: number;
  totalMarketCap: number;
  averageMarketCap: number;
  totalVolume24h: number;
  averageVolume24h: number;
  marketMovement24h: {
    up: number;
    down: number;
    stable: number;
  };
}

const formatNumber = (num: number, decimals: number = 2): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
  return num.toFixed(decimals);
};

const formatPrice = (price: string | null): string => {
  if (!price) return "N/A";
  const num = parseFloat(price);
  return num < 0.01 ? num.toExponential(4) : num.toFixed(4);
};

const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const calculateTokenMetrics = (token: TokenData): TokenMetrics => {
  const currentPrice = token.current_price ? parseFloat(token.current_price) : 0;
  const high24h = token.high_24h ? parseFloat(token.high_24h) : currentPrice;
  const low24h = token.low_24h ? parseFloat(token.low_24h) : currentPrice;
  const volatility = ((high24h - low24h) / currentPrice) * 100;
  const priceChange = token.price_change_percentage_24h ? parseFloat(token.price_change_percentage_24h) : 0;
  const marketCap = token.market_cap ? parseFloat(token.market_cap) : 0;
  const volume24h = token.total_volume ? parseFloat(token.total_volume) : 0;

  return {
    price: {
      value: currentPrice,
      change24h: priceChange,
      volatility,
      confidence: volatility < 5 ? 'high' : volatility < 15 ? 'medium' : 'low',
      athDistance: token.ath ? ((currentPrice - parseFloat(token.ath)) / parseFloat(token.ath)) * 100 : 0,
      atlDistance: token.atl ? ((currentPrice - parseFloat(token.atl)) / parseFloat(token.atl)) * 100 : 0
    },
    volume: {
      value24h: volume24h,
      trend: priceChange > 1 ? 'increasing' : priceChange < -1 ? 'decreasing' : 'stable',
      health: volume24h > 1000000 ? 'high' : volume24h > 100000 ? 'medium' : 'low',
      changePercentage: token.market_cap_change_percentage_24h ? parseFloat(token.market_cap_change_percentage_24h) : 0
    },
    marketCap: {
      value: marketCap,
      rank: token.market_cap_rank ? parseInt(token.market_cap_rank) : 9999,
      dominance: token.market_cap_rank ? (1000 - parseInt(token.market_cap_rank)) / 1000 : 0,
      trend: token.market_cap_change_percentage_24h && parseFloat(token.market_cap_change_percentage_24h) > 0 ? 'growing' : 'shrinking',
      changePercentage: token.market_cap_change_percentage_24h ? parseFloat(token.market_cap_change_percentage_24h) : 0
    },
    supply: {
      circulating: token.circulating_supply ? parseFloat(token.circulating_supply) : 0,
      total: token.total_supply ? parseFloat(token.total_supply) : 0,
      max: token.max_supply ? parseFloat(token.max_supply) : null,
      utilization: token.circulating_supply && token.total_supply ? 
        (parseFloat(token.circulating_supply) / parseFloat(token.total_supply)) * 100 : 0,
      concentration: token.circulating_supply && token.total_supply ?
        (parseFloat(token.circulating_supply) / parseFloat(token.total_supply)) > 0.8 ? 'low' :
        (parseFloat(token.circulating_supply) / parseFloat(token.total_supply)) > 0.5 ? 'medium' : 'high'
        : 'high'
    }
  };
};

const calculateMarketOverview = (tokens: TokenData[]): MarketOverview => {
  const activeTokens = tokens.filter(t => t.current_price !== null);
  const totalMarketCap = activeTokens.reduce((sum, token) => 
    sum + (token.market_cap ? parseFloat(token.market_cap) : 0), 0);
  const totalVolume = activeTokens.reduce((sum, token) => 
    sum + (token.total_volume ? parseFloat(token.total_volume) : 0), 0);

  const priceMovements = activeTokens.reduce((acc, token) => {
    const change = token.price_change_percentage_24h ? parseFloat(token.price_change_percentage_24h) : 0;
    if (change > 1) acc.up++;
    else if (change < -1) acc.down++;
    else acc.stable++;
    return acc;
  }, { up: 0, down: 0, stable: 0 });

  return {
    totalTokens: tokens.length,
    activeTokens: activeTokens.length,
    totalMarketCap,
    averageMarketCap: totalMarketCap / activeTokens.length,
    totalVolume24h: totalVolume,
    averageVolume24h: totalVolume / activeTokens.length,
    marketMovement24h: priceMovements
  };
};

const formatTokenAnalysis = (token: TokenData, metrics: TokenMetrics): string => {
  return `🪙 ${token.name} (${token.symbol.toUpperCase()})
💰 Price: $${formatPrice(token.current_price)} (${formatPercentage(metrics.price.change24h)})
📊 Market Cap: $${formatNumber(metrics.marketCap.value)} (Rank #${metrics.marketCap.rank})
📈 Volume 24h: $${formatNumber(metrics.volume.value24h)}

📉 Market Analysis:
• Volatility: ${formatPercentage(metrics.price.volatility)} (${metrics.price.confidence})
• Volume Health: ${metrics.volume.health}
• Market Trend: ${metrics.marketCap.trend} (${formatPercentage(metrics.marketCap.changePercentage)})

💎 Supply Metrics:
• Circulating/Total: ${formatNumber(metrics.supply.circulating)}/${formatNumber(metrics.supply.total)}
• Utilization: ${formatPercentage(metrics.supply.utilization)}
• Concentration: ${metrics.supply.concentration}

📅 Historical:
• ATH Distance: ${formatPercentage(metrics.price.athDistance)}
• ATL Distance: ${formatPercentage(metrics.price.atlDistance)}

⏰ Last Updated: ${new Date(token.last_updated).toLocaleString()}
-------------------`;
};

const formatMarketOverview = (overview: MarketOverview): string => {
  return `📊 Market Overview
• Total Active Tokens: ${overview.activeTokens}/${overview.totalTokens}
• Total Market Cap: $${formatNumber(overview.totalMarketCap)}
• 24h Volume: $${formatNumber(overview.totalVolume24h)}
• Market Movement (24h):
  ↗️ Up: ${overview.marketMovement24h.up}
  ↘️ Down: ${overview.marketMovement24h.down}
  ➡️ Stable: ${overview.marketMovement24h.stable}
-------------------\n\n`;
};

const tokenProvider: Provider = {
  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state?: State
  ): Promise<string> => {
    try {
      console.log(`🔍 Fetching token data`);
      const response = await fetch(`${process.env.SCRAPER_URL}/tokens`);
      console.log("🌐 Token API Status:", response.status);

      if (!response.ok) {
        throw new Error(`API response was not ok: ${response.status}`);
      }

      const data = (await response.json()) as APIResponse;
      console.log(`✨ Found ${data.results.length} tokens`);

      if (!data.results || data.results.length === 0) {
        return "No token data available at this time.";
      }

      const marketOverview = calculateMarketOverview(data.results);
      const tokenAnalyses = data.results
        .filter(token => token.current_price !== null)
        .map(token => {
          const metrics = calculateTokenMetrics(token);
          return formatTokenAnalysis(token, metrics);
        });

      return formatMarketOverview(marketOverview) + tokenAnalyses.join("\n\n");

    } catch (error) {
      console.error("🚨 Error in token provider:", error);
      return "Unable to fetch token information. Please try again later.";
    }
  },
};

export default tokenProvider;