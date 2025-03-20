import axios from 'axios';
import { TokenResponse } from '../types';

export class CoingeckoService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://pro-api.coingecko.com/api/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getEcosystemTokens(
    category: string,
    currency: string
  ): Promise<TokenResponse[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/coins/markets`,
        {
          params: {
            vs_currency: currency,
            category: category
          },
          headers: {
            'accept': 'application/json',
            'x-cg-pro-api-key': this.apiKey
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Berachain tokens:', error);
      throw error;
    }
  }
}