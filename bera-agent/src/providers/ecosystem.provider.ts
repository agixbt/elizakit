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

interface ProcessedEcosystemProject {
  name: string;
  category: string;
  keyFeatures: string[];
  integrations: string[];
  status: string;
  links: string[];
  technicalDetails: string[];
  summary: string;
}

interface EcosystemMetrics {
  totalProjects: number;
  categoryCounts: { [key: string]: number };
  integrationMatrix: { [key: string]: string[] };
  projectStatuses: { [key: string]: number };
  recentUpdates: string[];
}

let lastKnowledgeUpdate = 0;
const CACHE_FILE = path.join(process.cwd(), "out", "berchain-ecosystem.json");
const ONE_DAY = 24 * 60 * 60 * 1000;

const identifyProjectCategory = (content: string): string => {
  const categories = [
    { name: 'DeFi', keywords: ['defi', 'swap', 'lending', 'yield', 'liquidity', 'amm', 'trading'] },
    { name: 'Infrastructure', keywords: ['infrastructure', 'protocol', 'bridge', 'oracle', 'api'] },
    { name: 'NFT', keywords: ['nft', 'collectible', 'marketplace', 'art'] },
    { name: 'Gaming', keywords: ['game', 'gaming', 'play', 'metaverse'] },
    { name: 'Social', keywords: ['social', 'community', 'messaging', 'communication'] },
    { name: 'Tools', keywords: ['tool', 'analytics', 'dashboard', 'explorer'] }
  ];

  const contentLower = content.toLowerCase();
  for (const category of categories) {
    if (category.keywords.some(keyword => contentLower.includes(keyword))) {
      return category.name;
    }
  }
  return 'Other';
};

const extractKeyFeatures = (content: string): string[] => {
  const features: string[] = [];
  
  const featurePatterns = [
    /• ([^•\n]+)/g,
    /\* ([^*\n]+)/g,
    /Features:([^.]+)/gi,
    /provides ([^.]+)/gi,
    /enables ([^.]+)/gi
  ];

  featurePatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      features.push(match[1].trim());
    }
  });

  return Array.from(new Set(features));
};

const extractIntegrations = (content: string): string[] => {
  const integrations: string[] = [];
  
  const integrationPatterns = [
    /integrates? with ([^.]+)/gi,
    /integrated with ([^.]+)/gi,
    /connects? to ([^.]+)/gi,
    /partnership with ([^.]+)/gi
  ];

  integrationPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      integrations.push(match[1].trim());
    }
  });

  return Array.from(new Set(integrations));
};

const determineProjectStatus = (content: string): string => {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('mainnet') || contentLower.includes('live')) {
    return 'Live';
  } else if (contentLower.includes('testnet') || contentLower.includes('beta')) {
    return 'Testing';
  } else if (contentLower.includes('development') || contentLower.includes('building')) {
    return 'In Development';
  } else if (contentLower.includes('upcoming') || contentLower.includes('soon')) {
    return 'Upcoming';
  }
  
  return 'Announced';
};

const processProject = (section: DocSection): ProcessedEcosystemProject => {
  const allContent = section.subsections.map(sub => sub.content).join(' ');
  
  const keyFeatures = extractKeyFeatures(section.overview + ' ' + allContent);
  const integrations = extractIntegrations(allContent);
  const status = determineProjectStatus(allContent);
  
  const technicalDetails = section.subsections
    .filter(sub => sub.content.includes('technical') || 
                   sub.content.includes('architecture') ||
                   sub.content.includes('specification'))
    .map(sub => sub.content.trim());

  const summary = `${section.overview}\n\nKey Features:\n${
    keyFeatures.map(feature => `• ${feature}`).join('\n')
  }`;

  return {
    name: section.topic,
    category: identifyProjectCategory(allContent),
    keyFeatures,
    integrations,
    status,
    links: [section.url],
    technicalDetails,
    summary
  };
};

const calculateEcosystemMetrics = (projects: ProcessedEcosystemProject[]): EcosystemMetrics => {
  const metrics: EcosystemMetrics = {
    totalProjects: projects.length,
    categoryCounts: {},
    integrationMatrix: {},
    projectStatuses: {},
    recentUpdates: []
  };

  projects.forEach(project => {
    metrics.categoryCounts[project.category] = (metrics.categoryCounts[project.category] || 0) + 1;

    metrics.projectStatuses[project.status] = (metrics.projectStatuses[project.status] || 0) + 1;

    project.integrations.forEach(integration => {
      if (!metrics.integrationMatrix[project.name]) {
        metrics.integrationMatrix[project.name] = [];
      }
      metrics.integrationMatrix[project.name].push(integration);
    });

    if (project.technicalDetails.length > 0) {
      metrics.recentUpdates.push(project.name);
    }
  });

  return metrics;
};

const formatEcosystemReport = (docs: DocsContent): string => {
  const processedProjects = docs.data.sections.map(processProject);
  const metrics = calculateEcosystemMetrics(processedProjects);

  return `🌐 BERACHAIN ECOSYSTEM ANALYSIS
Last Updated: ${new Date(docs.data.last_updated).toLocaleDateString()}
Total Projects: ${metrics.totalProjects}

📊 ECOSYSTEM OVERVIEW:
• Categories: ${Object.entries(metrics.categoryCounts)
    .map(([cat, count]) => `${cat}: ${count}`)
    .join(', ')}
• Project Statuses: ${Object.entries(metrics.projectStatuses)
    .map(([status, count]) => `${status}: ${count}`)
    .join(', ')}
• Recent Updates: ${metrics.recentUpdates.length} projects

${processedProjects.map(project => `
🔍 PROJECT: ${project.name.toUpperCase()}
Category: ${project.category}
Status: ${project.status}

📝 SUMMARY:
${project.summary}

⚙️ KEY FEATURES:
${project.keyFeatures.map(feature => `• ${feature}`).join('\n')}

🔗 INTEGRATIONS:
${project.integrations.length > 0 
  ? project.integrations.map(integration => `• ${integration}`).join('\n')
  : '• No integrations listed'}

🛠️ TECHNICAL DETAILS:
${project.technicalDetails.length > 0
  ? project.technicalDetails.map(detail => `• ${detail}`).join('\n')
  : '• No technical details available'}

-------------------`).join('\n')}

🔄 INTEGRATION HIGHLIGHTS:
${Object.entries(metrics.integrationMatrix)
  .filter(([_, integrations]) => integrations.length > 0)
  .map(([project, integrations]) => `• ${project} ↔️ ${integrations.join(', ')}`)
  .join('\n')}

Note: This ecosystem analysis covers ${metrics.totalProjects} projects across ${
    Object.keys(metrics.categoryCounts).length
  } categories, with ${metrics.recentUpdates.length} recent updates.`;
};

async function getEcosystemDocs(): Promise<DocsContent | null> {
  try {
    try {
      await fs.access(CACHE_FILE);
      console.log("\n📦 Cache file found for ecosystem, reading from cache...");
    } catch {
      console.log("📭 No cache file found for ecosystem, fetching fresh docs...");
      const response = await fetch(
        `${process.env.SCRAPER_URL}/docs/scrape?url=https://ecosystem.berachain.com`
      );
      if (!response.ok) throw new Error("Failed to fetch new docs for ecosystem");

      const newData = await response.json();
      await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
      await fs.writeFile(CACHE_FILE, JSON.stringify(newData, null, 2));
      return newData;
    }

    const fileContent = await fs.readFile(CACHE_FILE, "utf-8");
    const data = JSON.parse(fileContent) as DocsContent;
    const cacheAge = Date.now() - new Date(data.data.last_updated).getTime();

    if (cacheAge > ONE_DAY) {
      console.log("📅 Cache expired, fetching new docs for ecosystem...");
      const response = await fetch(
        "${process.env.SCRAPER_URL}/docs/scrape?url=https://ecosystem.berachain.com"
      );
      if (!response.ok) throw new Error("Failed to fetch new docs for ecosystem");

      const newData = await response.json();
      await fs.writeFile(CACHE_FILE, JSON.stringify(newData, null, 2));
      return newData;
    }

    return data;
  } catch (error) {
    console.error("❌ Error accessing ecosystem docs:", error);
    return null;
  }
}

const ecosystemDocsProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state?: State
  ): Promise<string> => {
    try {
      const docs = await getEcosystemDocs();
      if (!docs) return "";

      const currentTime = Date.now();
      const timeSinceLastUpdate = currentTime - lastKnowledgeUpdate;

      if (timeSinceLastUpdate > ONE_DAY) {
        // Process and extract knowledge items
        const knowledgeItems = docs.data.sections.flatMap(section => {
          const processed = processProject(section);
          return [
            section.topic,
            processed.category,
            ...processed.keyFeatures,
            ...processed.integrations,
            ...section.subsections.map(sub => sub.title)
          ];
        });

        // Update runtime knowledge with processed items
        runtime.character.knowledge = Array.from(new Set(knowledgeItems));
        lastKnowledgeUpdate = currentTime;
        console.log("🧠 Updated agent knowledge base with enhanced ecosystem data");

        const formattedDocs = formatEcosystemReport(docs);

        // Log analytics about processed ecosystem data
        const processedProjects = docs.data.sections.map(processProject);
        const metrics = calculateEcosystemMetrics(processedProjects);
        
        console.log(`\n📊 Ecosystem Analytics:
• Total Projects: ${metrics.totalProjects}
• Categories: ${Object.keys(metrics.categoryCounts).length}
• Integration Connections: ${
  Object.values(metrics.integrationMatrix)
    .reduce((sum, arr) => sum + arr.length, 0)
}
• Recent Updates: ${metrics.recentUpdates.length}`);

        return formattedDocs;
      }

      console.log("📚 Ecosystem knowledge base is current, maintaining existing context");
      return "";
    } catch (error) {
      console.error("🚨 Error in ecosystem docs provider:", error);
      return "";
    }
  },
};

export default ecosystemDocsProvider;