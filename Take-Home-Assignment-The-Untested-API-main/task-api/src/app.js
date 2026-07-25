const express = require('express');
const taskRoutes = require('./routes/tasks');

const app = express();

app.use(express.json());

// ─── Landing / API Explorer ───────────────────────────────────────────────────
app.get('/', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task Manager API — Explorer</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #0d0f14;
      --surface:   #13161d;
      --card:      #1a1e28;
      --border:    #252a37;
      --accent:    #6c63ff;
      --accent2:   #00d4aa;
      --text:      #e2e8f0;
      --muted:     #64748b;
      --get:       #10b981;
      --post:      #3b82f6;
      --put:       #f59e0b;
      --patch:     #8b5cf6;
      --delete:    #ef4444;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      line-height: 1.6;
    }

    /* ── Hero ─────────────────────────────────────────────── */
    .hero {
      background: linear-gradient(135deg, #1a1e28 0%, #0d0f14 50%, #13101f 100%);
      border-bottom: 1px solid var(--border);
      padding: 56px 24px 48px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(108,99,255,.18) 0%, transparent 70%);
      pointer-events: none;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(0,212,170,.12);
      border: 1px solid rgba(0,212,170,.3);
      color: var(--accent2);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .06em;
      text-transform: uppercase;
      padding: 4px 14px;
      border-radius: 999px;
      margin-bottom: 20px;
    }
    .status-dot {
      width: 7px; height: 7px;
      background: var(--accent2);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%,100% { opacity: 1; transform: scale(1); }
      50%      { opacity: .4; transform: scale(.8); }
    }
    .hero h1 {
      font-size: clamp(28px, 5vw, 48px);
      font-weight: 800;
      background: linear-gradient(120deg, #e2e8f0 30%, var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 12px;
    }
    .hero p {
      color: var(--muted);
      font-size: 16px;
      max-width: 540px;
      margin: 0 auto 28px;
    }
    .base-url {
      display: inline-block;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      color: var(--accent2);
      letter-spacing: .02em;
    }

    /* ── Layout ───────────────────────────────────────────── */
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }

    /* ── Stats strip ──────────────────────────────────────── */
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      margin-bottom: 48px;
    }
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      transition: border-color .2s, transform .2s;
    }
    .stat-card:hover { border-color: var(--accent); transform: translateY(-2px); }
    .stat-num { font-size: 28px; font-weight: 800; color: var(--accent); }
    .stat-lbl { font-size: 12px; color: var(--muted); margin-top: 4px; text-transform: uppercase; letter-spacing: .05em; }

    /* ── Section heading ──────────────────────────────────── */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }

    /* ── Endpoint card ────────────────────────────────────── */
    .endpoint-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px 24px;
      margin-bottom: 12px;
      transition: border-color .25s, box-shadow .25s, transform .25s;
      cursor: default;
    }
    .endpoint-card:hover {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px rgba(108,99,255,.2), 0 8px 32px rgba(0,0,0,.3);
      transform: translateY(-2px);
    }
    .endpoint-header {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .method {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .05em;
      padding: 4px 10px;
      border-radius: 6px;
      min-width: 62px;
      text-align: center;
    }
    .method.GET    { background: rgba(16,185,129,.15); color: var(--get);    border: 1px solid rgba(16,185,129,.3); }
    .method.POST   { background: rgba(59,130,246,.15); color: var(--post);   border: 1px solid rgba(59,130,246,.3); }
    .method.PUT    { background: rgba(245,158,11,.15); color: var(--put);    border: 1px solid rgba(245,158,11,.3); }
    .method.PATCH  { background: rgba(139,92,246,.15); color: var(--patch);  border: 1px solid rgba(139,92,246,.3); }
    .method.DELETE { background: rgba(239,68,68,.15);  color: var(--delete); border: 1px solid rgba(239,68,68,.3); }

    .path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      color: var(--text);
      font-weight: 500;
    }
    .new-badge {
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      letter-spacing: .06em;
    }
    .desc {
      color: var(--muted);
      font-size: 14px;
      margin-top: 8px;
    }

    /* details / body example */
    .body-example {
      margin-top: 12px;
      background: rgba(0,0,0,.3);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .body-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--muted);
      padding: 6px 14px;
      border-bottom: 1px solid var(--border);
      background: rgba(255,255,255,.02);
    }
    .body-example pre {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      color: var(--accent2);
      padding: 12px 16px;
      overflow-x: auto;
      line-height: 1.7;
    }

    /* try-it link */
    .try-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--accent);
      text-decoration: none;
      background: rgba(108,99,255,.1);
      border: 1px solid rgba(108,99,255,.25);
      padding: 5px 14px;
      border-radius: 8px;
      transition: background .2s, border-color .2s;
    }
    .try-link:hover { background: rgba(108,99,255,.2); border-color: var(--accent); }

    /* ── Footer ───────────────────────────────────────────── */
    footer {
      text-align: center;
      padding: 32px 24px;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-size: 13px;
    }
    footer a { color: var(--accent); text-decoration: none; }
    footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>

<!-- ── Hero ──────────────────────────────────────────────────────────────── -->
<div class="hero">
  <div class="status-pill"><span class="status-dot"></span> API Online</div>
  <h1>Task Manager API</h1>
  <p>A fully-tested RESTful API built with Node.js &amp; Express.
     Browse every endpoint below and click <strong>Try it</strong> to test GET routes live.</p>
  <div class="base-url">${base}</div>
</div>

<!-- ── Main ──────────────────────────────────────────────────────────────── -->
<div class="container">

  <!-- Stats -->
  <div class="stats">
    <div class="stat-card"><div class="stat-num">9</div><div class="stat-lbl">Endpoints</div></div>
    <div class="stat-card"><div class="stat-num">3</div><div class="stat-lbl">Bugs Fixed</div></div>
    <div class="stat-card"><div class="stat-num">1</div><div class="stat-lbl">New Feature</div></div>
    <div class="stat-card"><div class="stat-num">80%+</div><div class="stat-lbl">Test Coverage</div></div>
  </div>

  <!-- ── Read endpoints ─────────────────────────────────────────────────── -->
  <div class="section-title">Read &amp; Filter</div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method GET">GET</span>
      <span class="path">/tasks</span>
    </div>
    <p class="desc">Return all tasks as a JSON array.</p>
    <a class="try-link" href="${base}/tasks" target="_blank">↗ Try it</a>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method GET">GET</span>
      <span class="path">/tasks?status=todo</span>
    </div>
    <p class="desc">Filter tasks by exact status. Valid values: <code>todo</code>, <code>in_progress</code>, <code>done</code>.</p>
    <a class="try-link" href="${base}/tasks?status=todo" target="_blank">↗ Try it</a>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method GET">GET</span>
      <span class="path">/tasks?page=1&amp;limit=10</span>
    </div>
    <p class="desc">Paginated task list. <code>page</code> is 1-indexed; <code>limit</code> controls page size.</p>
    <a class="try-link" href="${base}/tasks?page=1&limit=10" target="_blank">↗ Try it</a>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method GET">GET</span>
      <span class="path">/tasks/stats</span>
    </div>
    <p class="desc">Returns count of tasks by status plus the number of overdue tasks.</p>
    <a class="try-link" href="${base}/tasks/stats" target="_blank">↗ Try it</a>
  </div>

  <!-- ── Write endpoints ────────────────────────────────────────────────── -->
  <div class="section-title" style="margin-top:36px">Create &amp; Update</div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method POST">POST</span>
      <span class="path">/tasks</span>
    </div>
    <p class="desc">Create a new task. <code>title</code> is required; all other fields are optional.</p>
    <div class="body-example">
      <div class="body-label">Request Body</div>
      <pre>{
  "title": "Finish the report",
  "description": "Q3 summary doc",
  "status": "todo",
  "priority": "high",
  "dueDate": "2025-12-31T00:00:00.000Z"
}</pre>
    </div>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method PUT">PUT</span>
      <span class="path">/tasks/:id</span>
    </div>
    <p class="desc">Update any fields on an existing task. Returns the updated task or <code>404</code> if not found.</p>
    <div class="body-example">
      <div class="body-label">Request Body (any subset)</div>
      <pre>{
  "title": "Updated title",
  "priority": "low",
  "status": "in_progress"
}</pre>
    </div>
  </div>

  <!-- ── Action endpoints ───────────────────────────────────────────────── -->
  <div class="section-title" style="margin-top:36px">Actions</div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method PATCH">PATCH</span>
      <span class="path">/tasks/:id/complete</span>
    </div>
    <p class="desc">Mark a task as <code>done</code> and record <code>completedAt</code>. No body required. Returns <code>404</code> if task not found.</p>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method PATCH">PATCH</span>
      <span class="path">/tasks/:id/assign</span>
      <span class="new-badge">NEW</span>
    </div>
    <p class="desc">Assign a person to a task. The <code>assignee</code> is trimmed and stored on the task object. Returns <code>400</code> for empty/missing assignee, <code>404</code> if task not found.</p>
    <div class="body-example">
      <div class="body-label">Request Body</div>
      <pre>{
  "assignee": "Alice"
}</pre>
    </div>
  </div>

  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method DELETE">DELETE</span>
      <span class="path">/tasks/:id</span>
    </div>
    <p class="desc">Permanently delete a task. Returns <code>204 No Content</code> on success or <code>404</code> if not found.</p>
  </div>

  <!-- ── Task shape ─────────────────────────────────────────────────────── -->
  <div class="section-title" style="margin-top:36px">Task Schema</div>
  <div class="endpoint-card" style="cursor:default;">
    <div class="body-example" style="margin-top:0;">
      <div class="body-label">Task Object</div>
      <pre>{
  "id":          "uuid-v4",
  "title":       "string  (required)",
  "description": "string  (default: '')",
  "status":      "todo | in_progress | done  (default: todo)",
  "priority":    "low | medium | high  (default: medium)",
  "dueDate":     "ISO 8601 string | null",
  "completedAt": "ISO 8601 string | null",
  "assignee":    "string | undefined",
  "createdAt":   "ISO 8601 string"
}</pre>
    </div>
  </div>

</div>

<footer>
  Built by <a href="https://github.com/yogiraj151" target="_blank">Yogiraj</a> &mdash;
  <a href="https://github.com/yogiraj151/Full_Stack_Assignment" target="_blank">View on GitHub</a>
</footer>

</body>
</html>`);
});

// ─── Task routes ──────────────────────────────────────────────────────────────
app.use('/tasks', taskRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Task API running on port ${PORT}`);
  });
}

module.exports = app;
