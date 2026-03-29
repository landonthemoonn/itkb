import fs from 'fs-extra';
import path from 'path';
import xml2js from 'xml2js';
import { Article } from './src/types';

async function parseWordPressXML(filePath: string): Promise<Article[]> {
  const xmlData = await fs.readFile(filePath, 'utf-8');
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xmlData);
  
  const items = result.rss.channel[0].item || [];
  const articles: Article[] = [];

  for (const item of items) {
    const postType = item['wp:post_type']?.[0];
    const status = item['wp:status']?.[0];

    if (postType === 'kb_article' && status === 'publish') {
      const meta: Record<string, string> = {};
      if (item['wp:postmeta']) {
        item['wp:postmeta'].forEach((m: any) => {
          meta[m['wp:meta_key'][0]] = m['wp:meta_value'][0];
        });
      }

      const systems: string[] = [];
      const tags: string[] = [];
      if (item.category) {
        item.category.forEach((cat: any) => {
          if (cat.$.domain === 'kb_systems') systems.push(cat._);
          if (cat.$.domain === 'kb_tags') tags.push(cat._);
        });
      }

      articles.push({
        id: parseInt(item['wp:post_id'][0]),
        title: item.title[0],
        slug: item['wp:post_name'][0],
        indexed_at: new Date().toISOString(),
        metadata: {
          systems,
          tags,
          owner: item['dc:creator']?.[0] || 'Admin',
          last_reviewed: meta['kb_review_date'] || '',
        },
        content: {
          employee: {
            summary: meta['kb_employee_summary'] || '',
            steps: meta['kb_employee_steps'] || '',
            escalation: meta['kb_employee_escalation'] || '',
          },
          internal: {
            diagnostics: meta['kb_internal_diagnostics'] || '',
            remediation: meta['kb_internal_remediation'] || '',
            admin_links: meta['kb_internal_admin_links'] || '',
          }
        }
      });
    }
  }

  return articles;
}

async function parseChunksJSON(filePath: string): Promise<Article[]> {
  const data = await fs.readJson(filePath);
  // Assuming chunks.json is an array of articles in the format we expect or similar
  // If it's a different format, we'll need to adjust.
  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      id: item.id || Math.floor(Math.random() * 10000),
      title: item.title || 'Untitled',
      slug: item.slug || '',
      indexed_at: new Date().toISOString(),
      metadata: item.metadata || { systems: [], tags: [], owner: 'Admin', last_reviewed: '' },
      content: item.content || {
        employee: { summary: '', steps: '', escalation: '' },
        internal: { diagnostics: '', remediation: '', admin_links: '' }
      }
    }));
  }
  return [];
}

async function runImport() {
  const importDir = './imports';
  if (!await fs.pathExists(importDir)) {
    console.log('No imports directory found. Please create /imports and place your files there.');
    return;
  }

  const files = await fs.readdir(importDir);
  let allArticles: Article[] = [];

  for (const file of files) {
    const filePath = path.join(importDir, file);
    console.log(`Processing ${file}...`);
    
    try {
      if (file.endsWith('.xml')) {
        const articles = await parseWordPressXML(filePath);
        allArticles = [...allArticles, ...articles];
        console.log(`Imported ${articles.length} articles from ${file}`);
      } else if (file.endsWith('.json')) {
        const articles = await parseChunksJSON(filePath);
        allArticles = [...allArticles, ...articles];
        console.log(`Imported ${articles.length} articles from ${file}`);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }

  if (allArticles.length > 0) {
    const dataDir = './data';
    await fs.ensureDir(dataDir);
    const articlesPath = path.join(dataDir, 'articles.json');
    
    // Merge with existing if any
    let existing: Article[] = [];
    if (await fs.pathExists(articlesPath)) {
      existing = await fs.readJson(articlesPath);
    }

    const merged = [...existing];
    allArticles.forEach(newArt => {
      const idx = merged.findIndex(a => a.id === newArt.id);
      if (idx > -1) {
        merged[idx] = newArt;
      } else {
        merged.push(newArt);
      }
    });

    await fs.writeJson(articlesPath, merged, { spaces: 2 });
    console.log(`Successfully saved ${merged.length} total articles to ${articlesPath}`);
  } else {
    console.log('No articles found to import.');
  }
}

runImport().catch(console.error);
