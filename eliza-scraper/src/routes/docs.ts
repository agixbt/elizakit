import Elysia from "elysia";
import { siteScraper } from "../lib/scraper";
import { isValidUrl, formatUrl } from "../lib/utils";
import { existsSync } from "fs";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; 

export const docsRoutes = new Elysia({ prefix: "/docs" }).get(
  "/scrape",
  async ({ query }) => {
    if (!query.url) {
      throw new Error("URL is required");
    }

    if (!isValidUrl(query.url)) {
      return {
        status: "error",
        message: "Invalid URL format",
      };
    }

    try {
      const fileName = `./out/${formatUrl(query.url)}.json`;
      
      if (existsSync(fileName)) {
        const fileContent = await Bun.file(fileName).json();
        const lastUpdated = new Date(fileContent.last_updated);
        const now = new Date();
        
        if (now.getTime() - lastUpdated.getTime() < ONE_WEEK_MS) {
          console.log(`📂 Using cached data from ${lastUpdated.toLocaleString()}`);
          return {
            status: "success",
            data: fileContent,
            source: "cache"
          };
        }
        console.log("🔄 Cache expired, fetching fresh data...");
      }

      console.log("🌐 Starting scrape for:", query.url);
      const scrapedData = await siteScraper(query.url);
      console.log(`✨ Scraping complete for ${query.url}`);

      return {
        status: "success",
        data: scrapedData,
        source: "fresh"
      };
    } catch (error: any) {
      console.error("❌ Scraping failed:", error);
      return {
        status: "error",
        message: error.message || "Failed to scrape URL",
      };
    }
  }
);
