import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { Article } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

async function ensureDataFile() {
  await fs.ensureDir(DATA_DIR);
  if (!await fs.pathExists(ARTICLES_FILE)) {
    const initialArticles = [
      {
        id: 201,
        title: "Capture One: Session Management & Backup",
        slug: "capture-one-sessions",
        indexed_at: new Date().toISOString(),
        metadata: {
          systems: ["Capture One 23", "Studio NAS", "Chronosync"],
          tags: ["Workflow", "Backup"],
          owner: "Digital Tech Lead",
          last_reviewed: "2024-03-25"
        },
        content: {
          employee: {
            summary: "Best practices for creating, managing, and backing up Capture One sessions during a photoshoot.",
            steps: "1. Create session on the local SSD using the standard naming convention (YYYYMMDD_Brand_Project).\n2. Set up a 'Backup' folder on the Studio NAS.\n3. Configure Chronosync to mirror the session folder every 30 minutes.",
            escalation: "If Chronosync reports a 'Permission Denied' error, contact the Studio Tech Team."
          },
          internal: {
            diagnostics: "Check NAS mount points (/Volumes/Studio_Backup). Verify user has 'Write' permissions on the target directory.",
            remediation: "Remount the NAS using SMB 3.0. Re-apply ACLs if necessary via the Synology Admin portal.",
            admin_links: "NAS Admin: https://nas.studio.gapinc.com"
          }
        }
      },
      {
        id: 202,
        title: "Studio Lighting: Profoto Air Remote Setup",
        slug: "profoto-setup",
        indexed_at: new Date().toISOString(),
        metadata: {
          systems: ["Profoto Air", "Phase One XF"],
          tags: ["Lighting", "Hardware"],
          owner: "Studio Equipment Manager",
          last_reviewed: "2024-03-24"
        },
        content: {
          employee: {
            summary: "Quick start guide for syncing Profoto Air Remotes with studio strobe systems.",
            steps: "1. Ensure the remote is set to the correct Channel (1-8) and Group (A-F) for your set.\n2. Check that the strobe head is also set to the same Channel/Group.\n3. Test fire using the 'Test' button on the remote.",
            escalation: "If strobes are misfiring, swap the remote batteries or check for local RF interference."
          },
          internal: {
            diagnostics: "Check for 2.4GHz frequency congestion using the Wi-Spy tool. Verify firmware version on the Air Remote.",
            remediation: "Update firmware via Profoto MyPages. Switch to a higher channel (e.g., Channel 8) to avoid interference.",
            admin_links: "Equipment Inventory: https://cheqroom.studio.gapinc.com"
          }
        }
      }
    ];
    await fs.writeJson(ARTICLES_FILE, initialArticles, { spaces: 2 });
  }
}

async function startServer() {
  await ensureDataFile();
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Endpoint for WordPress Sync
  app.post("/api/index", async (req, res) => {
    const article = req.body;
    console.log(`Received article for indexing: ${article.title} (ID: ${article.id})`);

    const articles = await fs.readJson(ARTICLES_FILE);
    const existingIndex = articles.findIndex((a: any) => a.id === article.id);
    
    const updatedArticle = { ...article, indexed_at: new Date().toISOString() };
    
    if (existingIndex > -1) {
      articles[existingIndex] = updatedArticle;
    } else {
      articles.push(updatedArticle);
    }

    await fs.writeJson(ARTICLES_FILE, articles, { spaces: 2 });

    res.json({ 
      status: "success", 
      message: `Article ${article.id} indexed successfully`,
      chunks_created: 5 
    });
  });

  // Endpoint to get indexed data for the UI
  app.get("/api/articles", async (req, res) => {
    const articles = await fs.readJson(ARTICLES_FILE);
    res.json(articles);
  });

  // Endpoint for bulk import from /imports
  app.post("/api/import", async (req, res) => {
    try {
      // In a real scenario, we'd run the import script logic here
      // For now, let's just trigger a shell command to run the import-wordpress.ts
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      const { stdout, stderr } = await execPromise('npx tsx import-wordpress.ts');
      
      res.json({
        status: "success",
        stdout,
        stderr
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
