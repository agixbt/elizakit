import { chromium } from "playwright";
import { formatUrl } from "./utils";

/**
 * scraper.ts
 *
 * exports - fetchTweetsByTimestamp, fetchPage, extractLinks, scrapeBerachainDocs
 *
 * fetchTweetsByTimestamp - exposed as external apis + used in the cron jobs to be converted to embeddings and stored in the database.
 *  - fetches recent tweets by recent timestamp and tags / authors
 *  - handles (we can take a list from De) basically we want folks who tweet reliable info and know what they're talking about wrt berachain
 *  - searchTerms - berachain launch, token wen? (basically we'll have context passed in, in case of a user asking something, and the vectorDB not having a contextual enough answer)
 *  - Start / End date - we can have a cron job that runs every 2 hours and fetches tweets from the last 2 hours (although the first timem it gets all best tweets with most engagement, from the past ~24 hours)
 *  - Engagement(minimumReplies, minimumRetweets) - to filter out spam
 *     returns Tweet[]
 *
 */

export interface SubSection {
  title: string;
  content: string;
}

export interface DocSection {
  topic: string;
  url: string;
  overview: string;
  subsections: SubSection[];
}

export async function siteScraper(baseUrl: string) {
  const visitedUrls = new Set<string>();
  const urlsToVisit = new Set<string>([baseUrl]);
  const sections: DocSection[] = [];

  console.log('🚀 Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  async function getAllLinks(): Promise<string[]> {
      return page.evaluate((baseUrl) => {

          const cleanUrl = (url: string) => { 
              if (url.startsWith('http')) {
                  return url;
              }
              return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
          };

          const links = new Set<string>();

          document.querySelectorAll('.menu__link, .navbar__item, .table-of-contents__link').forEach(el => {
              const href = el.getAttribute('href');
              if (href && !href.startsWith('#') && !href.startsWith('http')) {
                  links.add(cleanUrl(href));
              }
          });

          document.querySelectorAll('a').forEach(el => {
              const href = el.getAttribute('href');
              if (href && 
                  !href.startsWith('#') && 
                  !href.startsWith('http') && 
                  !href.includes('twitter.com') && 
                  !href.includes('github.com')) {
                  links.add(cleanUrl(href));
              }
          });

          return Array.from(links).filter(url => 
              url.startsWith(baseUrl) && 
              !url.includes('#') && 
              !url.endsWith('.png') && 
              !url.endsWith('.jpg') && 
              !url.endsWith('.svg')
          );
      }, baseUrl);
  }

  try {
      console.log('📄 Starting with main page...');
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      
      const initialLinks = await getAllLinks();
      initialLinks.forEach(link => urlsToVisit.add(link));
      console.log(`🔍 Found ${urlsToVisit.size} initial pages`);

      while (urlsToVisit.size > 0) {
          const url = Array.from(urlsToVisit)[0];
          urlsToVisit.delete(url);

          if (visitedUrls.has(url)) continue;

          console.log(`\n📑 Processing ${url}`);
          try {
              await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
              visitedUrls.add(url);

              const newLinks = await getAllLinks();
              newLinks.forEach(link => {
                  if (!visitedUrls.has(link)) {
                      urlsToVisit.add(link);
                  }
              });

              // Extract content
              const section = await page.evaluate(() => {
                  const title = document.querySelector('h1')?.textContent?.trim() || '';
                  let overview = '';
                  const subsections: { title: string; content: string }[] = [];

                  const content = document.querySelector('article') || 
                                document.querySelector('.theme-doc-markdown') || 
                                document.querySelector('main');

                  if (!content) return null;
                  const extractText = (element: Element) => {
                    let text = '';
                    // Get direct text nodes
                    Array.from(element.childNodes).forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            const trimmed = node.textContent?.trim();
                            if (trimmed) text += trimmed + ' ';
                        }
                    });
                    
                    // Get text from child elements
                    element.querySelectorAll('p, div, span, li, pre, code').forEach(el => {
                        if (el.parentElement === element) { // Only direct children
                            const trimmed = el.textContent?.trim();
                            if (trimmed) text += trimmed + '\n';
                        }
                    });
                    
                    return text.trim();
                };

                // Extract all content before first h2
                const allElements = Array.from(content.children);
                let h2Found = false;
                
                allElements.forEach(element => {
                    if (element.tagName === 'H2') {
                        h2Found = true;
                        return;
                    }
                    
                    if (!h2Found && element.tagName !== 'H1') {
                        const text = extractText(element);
                        if (text) {
                            overview += text + '\n\n';
                        }
                    } });

                  // Get overview (content before first h2)
                  let currentElement = content.querySelector('h1')?.nextElementSibling;
                  while (currentElement && currentElement.tagName !== 'H2') {
                    if (['P', 'PRE', 'CODE', 'UL', 'OL', 'DIV'].includes(currentElement.tagName)) {
                        // For divs, only include if they have direct text content
                        if (currentElement.tagName === 'DIV') {
                            const hasDirectText = Array.from(currentElement.childNodes)
                                .some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
                                console.log('hasDirectText', hasDirectText, currentElement.textContent?.trim());
                            if (hasDirectText || currentElement.classList.contains('text-muted-foreground')) {
                                overview += currentElement.textContent?.trim() + '\n\n';
                            }
                        } else {
                            overview += currentElement.textContent?.trim() + '\n\n';
                        }
                    }
                      currentElement = currentElement.nextElementSibling;
                  }

                  // Get all h2 sections
                  const h2Elements = content.querySelectorAll('h2');
                  h2Elements.forEach(h2 => {
                      let sectionContent = '';
                      let currentEl = h2.nextElementSibling;

                      while (currentEl && currentEl.tagName !== 'H2') {
                          if (['P', 'PRE', 'CODE', 'UL', 'OL'].includes(currentEl.tagName)) {
                              let text = currentEl.textContent?.trim() || '';
                              if (currentEl.tagName === 'PRE' || currentEl.tagName === 'CODE') {
                                  text = '```\n' + text + '\n```';
                              }
                              sectionContent += text + '\n\n';
                          }
                          currentEl = currentEl.nextElementSibling;
                      }

                      if (sectionContent.trim()) {
                          subsections.push({
                              title: h2.textContent?.trim() || '',
                              content: sectionContent.trim()
                          });
                      }
                  });

                  return {
                      title,
                      overview: overview.trim(),
                      subsections
                  };
              });

              if (section) {
                  sections.push({
                      topic: section.title,
                      url,
                      overview: section.overview,
                      subsections: section.subsections
                  });
                  console.log(`✅ Added: ${section.title} with ${section.subsections.length} subsections`);
              }

          } catch (error) {
              console.error(`❌ Error processing ${url}:`, error);
          }

          console.log(`Progress: ${visitedUrls.size} processed, ${urlsToVisit.size} remaining`);
          await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`\n✨ Scraping complete!`);
      console.log(`Total sections: ${sections.length}`);
      console.log(`Total pages processed: ${visitedUrls.size}`);

      const docsContent = {
          title: formatUrl(baseUrl),
          last_updated: new Date().toISOString(),
          total_sections: sections.length,
          sections: sections.map(section => ({
              topic: section.topic,
              source_url: section.url,
              overview: section.overview,
              subsections: section.subsections
          }))
      };

      await Bun.write(`./out/${formatUrl(baseUrl)}.json`, JSON.stringify(docsContent, null, 2));
      console.log(`💾 Documentation saved to ${formatUrl(baseUrl)}.json`);

      return docsContent;

  } finally {
      await browser.close();
      console.log('🏁 Browser closed');
  }
}

