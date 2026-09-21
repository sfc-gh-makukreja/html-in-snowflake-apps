const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const ASSETS_DIR = path.join(__dirname, 'html_assets');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Get all HTML files in html_assets sorted alphabetically
function getHtmlFiles() {
  if (!fs.existsSync(ASSETS_DIR)) return [];
  return fs.readdirSync(ASSETS_DIR).filter(f => f.toLowerCase().endsWith('.html'));
}

// Dynamically determine the primary (education/overview) asset:
// 1. Check for filename containing 'education', 'overview', 'index', or 'home'
// 2. Check metadata inside files for 'education' or 'overview'
// 3. Fallback to the first HTML file found in html_assets/
function resolvePrimaryAsset(files) {
  if (!files || files.length === 0) return null;

  // 1. Filename heuristic
  const nameMatch = files.find(f => {
    const lower = f.toLowerCase();
    return lower.includes('education') || lower.includes('overview') || lower.includes('index') || lower.includes('home');
  });
  if (nameMatch) return nameMatch;

  // 2. Content/Metadata heuristic
  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(ASSETS_DIR, f), 'utf8');
      if (/education|overview|opportunity/i.test(content.slice(0, 2000))) {
        return f;
      }
    } catch (e) {
      // ignore read error
    }
  }

  // 3. Fallback to first available file
  return files[0];
}

// Dynamically determine the secondary (qualifier/quiz/tool) asset if available
function resolveSecondaryAsset(files, primaryFile) {
  if (!files || files.length <= 1) return null;
  const secondary = files.find(f => f !== primaryFile && (
    f.toLowerCase().includes('qualifier') || 
    f.toLowerCase().includes('quiz') || 
    f.toLowerCase().includes('form') ||
    f.toLowerCase().includes('assessment')
  ));
  return secondary || files.find(f => f !== primaryFile) || null;
}

// Root route: dynamically serves the primary (education/overview) asset
app.get('/', (req, res) => {
  const files = getHtmlFiles();
  const primaryFile = resolvePrimaryAsset(files);

  if (primaryFile) {
    res.sendFile(path.join(ASSETS_DIR, primaryFile));
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>No HTML Assets</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 4rem 2rem; text-align: center; color: #1a202c; }
          .card { max-width: 500px; margin: 0 auto; padding: 2rem; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; }
          code { background: #edf2f7; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>No HTML Assets Found</h2>
          <p style="margin-top: 1rem; color: #4a5568;">Drop your HTML files into the <code>html_assets/</code> directory to get started.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Generic route for /qualifier or secondary tool
app.get('/qualifier', (req, res, next) => {
  const files = getHtmlFiles();
  const primary = resolvePrimaryAsset(files);
  const secondary = resolveSecondaryAsset(files, primary);
  if (secondary) {
    return res.sendFile(path.join(ASSETS_DIR, secondary));
  }
  next();
});

// Generic route for /education or primary tool
app.get('/education', (req, res, next) => {
  const files = getHtmlFiles();
  const primary = resolvePrimaryAsset(files);
  if (primary) {
    return res.sendFile(path.join(ASSETS_DIR, primary));
  }
  next();
});

// Clean slug routing: resolves any file by exact slug, prefix, or partial match
app.get('/:slug', (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  const files = getHtmlFiles();
  
  // 1. Exact match with .html extension
  const exactMatch = files.find(f => f.toLowerCase() === `${slug}.html`);
  if (exactMatch) {
    return res.sendFile(path.join(ASSETS_DIR, exactMatch));
  }

  // 2. Exact match against filename without extension
  const noExtMatch = files.find(f => f.replace(/\.html$/i, '').toLowerCase() === slug);
  if (noExtMatch) {
    return res.sendFile(path.join(ASSETS_DIR, noExtMatch));
  }

  // 3. Partial keyword match
  const partialMatch = files.find(f => f.toLowerCase().includes(slug));
  if (partialMatch) {
    return res.sendFile(path.join(ASSETS_DIR, partialMatch));
  }

  next();
});

// Serve all static assets directly (e.g. /my-partner-education.html, /assets/...)
app.use(express.static(ASSETS_DIR));
app.use('/assets', express.static(ASSETS_DIR));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Partner Education & Qualifier App running on http://0.0.0.0:${PORT}`);
});
