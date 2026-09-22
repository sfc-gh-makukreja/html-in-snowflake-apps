const express = require('express');
const fs = require('fs');
const path = require('path');
const snowflake = require('snowflake-sdk');

const app = express();
const PORT = process.env.PORT || 8080;
const ASSETS_DIR = path.join(__dirname, 'html_assets');

// Middleware for parsing JSON requests
app.use(express.json());

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// ============================================================================
// Snowflake & Cortex AI Execution Helper
// ============================================================================

/**
 * Creates an authenticated connection to Snowflake.
 * In Snowflake App Runtime (SAR), Snowflake mounts the session token
 * at /snowflake/session/token or provides environment credentials.
 */
function getSnowflakeConnection() {
  const tokenPath = '/snowflake/session/token';
  const hasToken = fs.existsSync(tokenPath);

  const connectionConfig = {
    account: process.env.SNOWFLAKE_ACCOUNT || process.env.SNOWPATH_ACCOUNT,
    database: process.env.SNOWFLAKE_DATABASE || 'APPS_DB',
    schema: process.env.SNOWFLAKE_SCHEMA || 'SALES_APPS',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'APPS_WH'
  };

  if (hasToken) {
    try {
      connectionConfig.authenticator = 'OAUTH';
      connectionConfig.token = fs.readFileSync(tokenPath, 'utf8').trim();
    } catch (e) {
      console.warn('Could not read container session token, falling back to env credentials:', e.message);
    }
  } else if (process.env.SNOWFLAKE_PASSWORD) {
    connectionConfig.username = process.env.SNOWFLAKE_USER || process.env.USER;
    connectionConfig.password = process.env.SNOWFLAKE_PASSWORD;
  }

  return snowflake.createConnection(connectionConfig);
}

/**
 * Execute a Cortex LLM Completion query against Snowflake
 */
function executeCortexComplete(prompt, model = 'claude-3-5-sonnet') {
  return new Promise((resolve, reject) => {
    const connection = getSnowflakeConnection();

    connection.connect((err, conn) => {
      if (err) return reject(new Error(`Snowflake connection error: ${err.message}`));

      const sqlText = `SELECT SNOWFLAKE.CORTEX.COMPLETE(?, ?) AS RESPONSE`;
      conn.execute({
        sqlText,
        binds: [model, prompt],
        complete: (err, stmt, rows) => {
          conn.destroy();
          if (err) return reject(new Error(`Cortex query error: ${err.message}`));
          if (rows && rows.length > 0) {
            resolve(rows[0].RESPONSE || '');
          } else {
            resolve('');
          }
        }
      });
    });
  });
}

// ============================================================================
// Cortex AI API Routes (Used by Qualifier and Assessment tools)
// ============================================================================

// Generic Cortex completion endpoint
app.post('/api/cortex/complete', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'prompt is required in request body' });
    }
    const selectedModel = model || 'claude-3-5-sonnet';
    const result = await executeCortexComplete(prompt, selectedModel);
    res.json({ success: true, model: selectedModel, response: result });
  } catch (err) {
    console.error('Cortex /complete error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Domain-specific sales opportunity qualification endpoint
app.post('/api/cortex/qualify', async (req, res) => {
  try {
    const { answers, prospectNotes, model } = req.body;
    
    const formattedAnswers = answers ? (typeof answers === 'object' ? JSON.stringify(answers, null, 2) : answers) : 'None provided';
    const notes = prospectNotes || 'None provided';

    const prompt = `You are an expert Enterprise Sales Strategist and Solution Architect.
Analyze the following sales qualification questionnaire responses and field notes from a prospect meeting:

[QUALIFICATION ANSWERS]
${formattedAnswers}

[MEETING NOTES & CONTEXT]
${notes}

Please provide a structured, concise assessment in Markdown with the following sections:
1. **Deal Fit Score & Tier**: Score from 1-100 and rating (High / Medium / Low priority).
2. **Top 3 Solution Pillars**: The specific capabilities to pitch based on their pain points.
3. **Tailored Opening Pitch & Value Hook**: 2-3 sentences the account executive can use immediately.
4. **Objection Anticipation & Landmines**: What the prospect will likely push back on and how to address it.
5. **Recommended Next Steps**: Concrete actions for the next follow-up.`;

    const selectedModel = model || 'claude-3-5-sonnet';
    const analysis = await executeCortexComplete(prompt, selectedModel);
    res.json({ success: true, model: selectedModel, analysis });
  } catch (err) {
    console.error('Cortex /qualify error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health & status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    cortex_ready: true,
    assets_count: getHtmlFiles().length
  });
});

// ============================================================================
// HTML Asset Resolution & Routing
// ============================================================================

// Get all HTML files in html_assets sorted alphabetically
function getHtmlFiles() {
  if (!fs.existsSync(ASSETS_DIR)) return [];
  return fs.readdirSync(ASSETS_DIR).filter(f => f.toLowerCase().endsWith('.html'));
}

// Dynamically determine the primary (education/overview) asset
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
    } catch (e) {}
  }

  // 3. Fallback to first available file
  return files[0];
}

// Dynamically determine the secondary (qualifier/quiz/tool) asset
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
