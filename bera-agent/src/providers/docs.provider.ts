import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import fs from "fs/promises";
import path from "path";

interface DocSection {
  topic: string;
  url: string;
  overview: string;
  subsections: Array<{
    title: string;
    content: string;
  }>;
}

interface DocsContent {
  status: string;
  data: {
    title: string;
    last_updated: string;
    total_sections: number;
    sections: DocSection[];
  };
}

interface ProcessedSection {
  topic: string;
  summary: string;
  keyPoints: string[];
  technicalDetails: string[];
}

let lastKnowledgeUpdate = 0;
const CACHE_FILE = path.join(process.cwd(), "out", "docs-berachain.json");
const ONE_DAY = 24 * 60 * 60 * 1000;
const MAX_SUMMARY_LENGTH = 250;
const MAX_POINTS_PER_SECTION = 5;

const extractEssentials = (text: string): string[] => {
  return text
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => 
      s.length > 0 && 
      (s.includes('must') || 
       s.includes('is') || 
       s.includes('are') || 
       s.includes('can') ||
       s.includes('will'))
    )
    .slice(0, MAX_POINTS_PER_SECTION);
};

const createSummary = (overview: string, content: string): string => {
  const combined = `${overview} ${content}`;
  if (combined.length <= MAX_SUMMARY_LENGTH) return combined;
  return combined.substring(0, MAX_SUMMARY_LENGTH) + '...';
};

const processSection = (section: DocSection): ProcessedSection => {
  const allContent = section.subsections
    .map(sub => sub.content)
    .join(' ');

  const keyPoints = extractEssentials(allContent);
  
  const technicalDetails = section.subsections
    .filter(sub => 
      sub.content.includes('```') || 
      /\d+/.test(sub.content))
    .map(sub => sub.title)
    .slice(0, 3);

  return {
    topic: section.topic,
    summary: createSummary(section.overview, allContent),
    keyPoints,
    technicalDetails
  };
};

async function getDocs(): Promise<DocsContent | null> {
  try {
    try {
      await fs.access(CACHE_FILE);
      console.log("\n📦 Cache file found, reading from cache...");
    } catch {
      console.log("📭 No cache file found, fetching fresh docs...");
      const response = await fetch(
        `${process.env.SCRAPER_URL}/docs/scrape?url=https%3A%2F%2Fdocs.berachain.com`
      );
      if (!response.ok) throw new Error("Failed to fetch new docs");

      const newData = await response.json();
      await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
      await fs.writeFile(CACHE_FILE, JSON.stringify(newData, null, 2));
      return newData;
    }

    const fileContent = await fs.readFile(CACHE_FILE, "utf-8");
    const data = JSON.parse(fileContent) as DocsContent;
    const cacheAge = Date.now() - new Date(data.data.last_updated).getTime();

    if (cacheAge > ONE_DAY) {
      console.log("📅 Cache expired, fetching new docs...");
      const response = await fetch(
        "${process.env.SCRAPER_URL}/docs/scrape?url=https%3A%2F%2Fdocs.berachain.com"
      );
      if (!response.ok) throw new Error("Failed to fetch new docs");

      const newData = await response.json();
      await fs.writeFile(CACHE_FILE, JSON.stringify(newData, null, 2));
      return newData;
    }

    return data;
  } catch (error) {
    console.error("❌ Error accessing docs:", error);
    return null;
  }
}

const formatDocumentation = (docs: DocsContent): string => {
  const processedSections = docs.data.sections
    .map(processSection)
    .slice(0, 50);

  return `BERACHAIN DOCUMENTATION SUMMARY
Last Updated: ${new Date(docs.data.last_updated).toLocaleDateString()}

${processedSections.map(section => `
${section.topic}
${section.summary}

Key Points:
${section.keyPoints.map(point => `• ${point}`).join('\n')}
${section.technicalDetails.length > 0 ? `\nTechnical Aspects: ${section.technicalDetails.join(', ')}` : ''}
---`).join('\n')}

Total Sections: ${processedSections.length}`;
};

const docsProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state?: State
  ): Promise<string> => {
    try {
      const docs = await getDocs();
      if (!docs) return "";

      const currentTime = Date.now();
      const timeSinceLastUpdate = currentTime - lastKnowledgeUpdate;

      if (timeSinceLastUpdate > ONE_DAY) {
        const knowledgeItems = docs.data.sections.flatMap(section => {
          const processed = processSection(section);
          return [
            section.topic,
            ...processed.keyPoints,
            ...processed.technicalDetails
          ];
        });

        runtime.character.knowledge = Array.from(new Set(knowledgeItems));
        lastKnowledgeUpdate = currentTime;
        console.log("\n🧠 Updated agent knowledge base");

        const formattedDocs = formatDocumentation(docs);
        console.log(`📊 Processed ${docs.data.sections.length} sections\n`);

        return formattedDocs;
      }

      console.log("📚 Knowledge base is recent, skipping update\n");
      return "";
    } catch (error) {
      console.error("🚨 Error in docs provider:", error);
      return "";
    }
  },
};

export default docsProvider;