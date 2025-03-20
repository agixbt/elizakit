import {
    type ActionExample,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    type Action,
    elizaLogger,
    composeContext,
    generateObjectDeprecated,
    ModelClass
} from "@elizaos/core";

interface TokenData {
    db_id: number;
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: string;
    market_cap: string;
    market_cap_rank: string;
    fully_diluted_valuation: string;
    total_volume: string;
    high_24h: string;
    low_24h: string;
    price_change_24h: string;
    price_change_percentage_24h: string;
    market_cap_change_24h: string;
    market_cap_change_percentage_24h: string;
    circulating_supply: string;
    total_supply: string;
    max_supply: string;
    ath: string;
    ath_change_percentage: string;
    ath_date: string;
    atl: string;
    atl_change_percentage: string;
    atl_date: string;
    roi: null;
    last_updated: string;
}

interface APIResponse {
    status: string;
    results: TokenData;
}

const formatTokenInfo = (data: TokenData, requestType: 'price' | 'full') => {
    const priceChangeEmoji = parseFloat(data.price_change_percentage_24h) >= 0 ? '📈' : '📉';
    
    if (requestType === 'price') {
        return `
${data.name} (${data.symbol.toUpperCase()}) 💰
Current Price: $${parseFloat(data.current_price).toFixed(6)}
24h Change: ${data.price_change_percentage_24h}% ${priceChangeEmoji}
24h High: $${parseFloat(data.high_24h).toFixed(6)}
24h Low: $${parseFloat(data.low_24h).toFixed(6)}
Last Updated: ${new Date(data.last_updated).toLocaleString()}
`.trim();
    }
    
    return `
${data.name} (${data.symbol.toUpperCase()}) 💰 Rank #${data.market_cap_rank}

💵 Price: $${parseFloat(data.current_price).toFixed(6)}
📊 24h Change: ${data.price_change_percentage_24h}% ${priceChangeEmoji}
📈 24h High: $${parseFloat(data.high_24h).toFixed(6)}
📉 24h Low: $${parseFloat(data.low_24h).toFixed(6)}

💎 Market Cap: $${parseFloat(data.market_cap).toLocaleString()}
📊 Market Cap Change (24h): ${data.market_cap_change_percentage_24h}%
💫 Fully Diluted Val.: $${parseFloat(data.fully_diluted_valuation).toLocaleString()}
📊 Volume: $${parseFloat(data.total_volume).toLocaleString()}

📋 Supply Info:
• Circulating: ${parseFloat(data.circulating_supply).toLocaleString()}
• Total: ${parseFloat(data.total_supply).toLocaleString()}
• Max: ${parseFloat(data.max_supply).toLocaleString()}

📈 All Time High: $${parseFloat(data.ath).toFixed(6)} (${data.ath_change_percentage}%)
📉 All Time Low: $${parseFloat(data.atl).toFixed(6)} (${data.atl_change_percentage}%)

⏰ Last Updated: ${new Date(data.last_updated).toLocaleString()}
`.trim();
};

const symbolTemplate = `Respond with a JSON markdown block containing only the extracted token symbol.
The bot name is @berathebot please make sure to ignore that while extracting the token symbol

Example response:
\`\`\`json
{
    "symbol": "YEET"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the token symbol mentioned in the message. 
- Extract only the token symbol (2-5 uppercase letters)
- Prioritize Berachain ecosystem tokens (BERA, HONEY, YEET)
- Don't include the bot name (@berathebot) while extracting symbol

Respond with a JSON markdown block containing only the extracted symbol.`;

export default {
    name: "TOKEN_INFO",
    similes: [
        "GET_TOKEN_PRICE",
        "TOKEN_PRICE",
        "CRYPTO_PRICE",
        "TOKEN_DETAILS",
        "COIN_INFO",
        "CRYPTO_INFO",
        "GET_TOKEN_INFO",
        "TOKEN_STATS",
    ],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        return (
            (text.includes('token') || 
             text.includes('price') || 
             text.includes('crypto') || 
             text.includes('coin')) && 
            (
             text.includes('what') || 
             text.includes('how') || 
             text.includes('tell') || 
             text.includes('show') ||
             text.includes('give'))
        );
    },
    description: "Get token price and details from the API",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("🚀 TOKEN_INFO: Starting token information retrieval process...");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        try {
            const symbolContext = composeContext({
                state,
                template: symbolTemplate,
            });

            console.log("🔍 Extracting token symbol from recent messages...", symbolContext, state.recentMessages);

            const symbolContent = await generateObjectDeprecated({
                runtime,
                context: symbolContext,
                modelClass: ModelClass.SMALL,
            });

            console.log("🔑 Extracted token symbol:", symbolContent);

            const symbol = symbolContent.symbol;

            if (!symbol) {
                elizaLogger.warn("⚠️ TOKEN_INFO: No token symbol could be identified");
                if (callback) {
                    callback({
                        text: "🤷‍♀️ I couldn't identify which token you're asking about. Please specify the token name or symbol clearly.",
                        content: { error: "No token symbol found" },
                    });
                }
                return false;
            }

            elizaLogger.log(`🎯 Selected token symbol: ${symbol}`);

            const response = await fetch(
                `${process.env.SCRAPER_URL}/tokens?symbol=${encodeURIComponent(symbol)}`
            );

            elizaLogger.log(`🌐 Fetching token data for ${symbol}...`);

            if (!response.ok) {
                elizaLogger.error(`❌ API response error: ${response.status}`);
                throw new Error(`API response was not ok: ${response.status}`);
            }

            const data = await response.json() as APIResponse;

            if (data.status === 'error' || !data.results) {
                elizaLogger.warn(`⚠️ No data found for token: ${symbol}`);
                if (callback) {
                    callback({
                        text: `🕵️ I couldn't find any information about the token ${symbol.toUpperCase()}. Is it part of the Berachain ecosystem?`,
                        content: { error: "No token data found" },
                    });
                }
                return false;
            }

            const text = message.content.text.toLowerCase();
            const wantsFullDetails = text.includes('detail') || 
                                   text.includes('info') || 
                                   text.includes('stats') || 
                                   text.includes('about');
            
            elizaLogger.log(`📊 Generating ${wantsFullDetails ? 'detailed' : 'price'} token info`);
            
            const formattedInfo = formatTokenInfo(data.results, wantsFullDetails ? 'full' : 'price');
            
            if (callback) {
                callback({
                    text: formattedInfo,
                    content: { token: data.results },
                });
            }

            elizaLogger.log(`✅ Successfully retrieved and formatted token info for ${symbol}`);
            return true;
        } catch (error) {
            elizaLogger.error(`🚨 Critical error in token info handler: ${error.message}`);
            if (callback) {
                callback({
                    text: `😱 Oops! I encountered an error while fetching token information: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the price of BERA token?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me check the current price of BERA for you.",
                    action: "TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you show me YEET token details?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll fetch the detailed information about the YEET token.",
                    action: "TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "How much is HONEY trading at?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll check the current trading price of HONEY for you.",
                    action: "TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Tell me about the BERA token",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll get you comprehensive information about the BERA token.",
                    action: "TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What are the stats for YEET?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll fetch the current statistics for the YEET token.",
                    action: "TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Give me market info for HONEY token",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll retrieve the market information for HONEY token.",
                    action: "TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the market cap of BERA?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll check the market cap and other details for BERA.",
                    action: "TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show price chart for YEET",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll get you the price information for YEET token.",
                    action: "TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the 24h volume of HONEY?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll fetch the trading volume and other metrics for HONEY.",
                    action: "TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Give me the supply info for BERA token",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll get you the supply information and other details for BERA token.",
                    action: "TOKEN_INFO",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;