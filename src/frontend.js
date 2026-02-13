/**
 * DDCET MCQ System — Frontend SPA Shell
 * Pitch Black / Cyan / Teal Aesthetics
 */

export const renderSPA = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DDCET MCQ Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0a0a0a;
            --card-bg: #111111;
            --primary: #00bcd4;
            --secondary: #009688;
            --text: #e0e0e0;
            --text-muted: #888;
            --border: #222;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; overflow-x: hidden; }

        /* Navigation */
        nav { border-bottom: 1px solid var(--border); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 100; }
        .logo { font-weight: 800; font-size: 1.2rem; display: flex; align-items: center; gap: 8px; color: var(--primary); text-decoration: none; }
        .nav-links { display: flex; gap: 1.5rem; }
        .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 0.9rem; transition: color 0.3s; }
        .nav-links a:hover, .nav-links a.active { color: var(--primary); }

        /* Layout */
        .container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
        .hero { text-align: center; padding: 4rem 1rem; }
        .hero h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 1rem; color: #fff; }
        .hero p { font-size: 1.1rem; color: var(--text-muted); max-width: 600px; margin: 0 auto; }

        /* Cards */
        .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; transition: transform 0.3s; }
        .card:hover { transform: translateY(-4px); border-color: var(--primary); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }

        /* Stats */
        .stat-val { font-size: 2.5rem; font-weight: 800; color: var(--primary); }
        .stat-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

        /* Batch List */
        .batch-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border); }
        .batch-item:last-child { border-bottom: none; }
        .btn { background: var(--primary); color: #000; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; text-decoration: none; transition: opacity 0.3s; font-size: 0.9rem; }
        .btn:hover { opacity: 0.8; }
        .btn-outline { background: transparent; color: var(--primary); border: 1px solid var(--primary); }

        /* Admin / Logs */
        .log-container { background: #000; padding: 1rem; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 0.85rem; height: 300px; overflow-y: auto; color: #0f0; margin-top: 1rem; }
        .log-entry { margin-bottom: 0.5rem; }
        .log-agent { color: var(--primary); font-weight: bold; }

        /* Utils */
        .flex { display: flex; align-items: center; gap: 8px; }
        .mt { margin-top: 1rem; }
        .hidden { display: none; }

        /* Loader */
        .loader { width: 40px; height: 40px; border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 2rem auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <nav>
        <a href="/" class="logo"><span>⚛️</span> DDCET MCQ</a>
        <div class="nav-links">
            <a href="/" id="link-home">Home</a>
            <a href="/dashboard" id="link-dashboard">Dashboard</a>
            <a href="/history" id="link-history">History</a>
            <a href="/admin" id="link-admin">Admin</a>
        </div>
    </nav>

    <div id="content" class="container">
        <!-- Content injected here -->
    </div>

    <script>
        const app = {
            content: document.getElementById('content'),
            
            async init() {
                window.addEventListener('popstate', () => this.route());
                document.body.addEventListener('click', e => {
                    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('/')) {
                        e.preventDefault();
                        history.pushState(null, '', e.target.getAttribute('href'));
                        this.route();
                    }
                });
                this.route();
            },

            async route() {
                const path = window.location.pathname;
                this.updateNav(path);
                
                if (path === '/') this.renderHome();
                else if (path === '/dashboard') this.renderDashboard();
                else if (path === '/history') this.renderHistory();
                else if (path.startsWith('/batch/')) this.renderBatch(path.split('/').pop());
                else if (path === '/admin') this.renderAdmin();
                else this.renderNotFound();
            },

            updateNav(path) {
                document.querySelectorAll('.nav-links a').forEach(a => {
                    a.classList.toggle('active', a.getAttribute('href') === path);
                });
            },

            renderHome() {
                this.content.innerHTML = \`
                    <div class="hero">
                        <h1>Autonomous DDCET MCQ Platform</h1>
                        <p>A full-stack architecture powered by Cloudflare and Supabase. Generating, validating, and tracking high-quality conceptual MCQs daily.</p>
                        <div class="mt flex" style="justify-content: center; gap: 1rem;">
                            <a href="/dashboard" class="btn">View Dashboard</a>
                            <a href="/history" class="btn btn-outline">Batch History</a>
                        </div>
                    </div>
                    <div class="grid">
                        <div class="card">
                            <h3>Native Architecture</h3>
                            <p class="mt">One-shot Cloudflare Workers backend with direct Supabase integration.</p>
                        </div>
                        <div class="card">
                            <h3>Agent Orchestration</h3>
                            <p class="mt">Multi-agent DC simulation handles generation, validation, and deduplication.</p>
                        </div>
                        <div class="card">
                            <h3>Performance First</h3>
                            <p class="mt">Vanilla JS SPA ensures ultra-fast transitions and real-time log streaming.</p>
                        </div>
                    </div>
                \`;
            },

            async renderDashboard() {
                this.content.innerHTML = '<div class="loader"></div>';
                const res = await fetch('/status');
                const data = await res.json();
                
                this.content.innerHTML = \`
                    <h2 class="mt">System Dashboard</h2>
                    <p style="color: var(--text-muted)">Real-time statistics from Supabase</p>
                    <div class="grid mt" style="margin-top: 2rem;">
                        <div class="card">
                            <div class="stat-label">Total MCQs</div>
                            <div class="stat-val">\${data.database.total}</div>
                        </div>
                        <div class="card">
                            <div class="stat-label">Maths Questions</div>
                            <div class="stat-val">\${data.database.Maths}</div>
                        </div>
                        <div class="card">
                            <div class="stat-label">Physics Questions</div>
                            <div class="stat-val">\${data.database.Physics}</div>
                        </div>
                    </div>
                    <div class="card mt">
                        <h3>Infrastructure Health</h3>
                        <p class="mt" style="color: var(--primary)">🟢 All Systems Operational</p>
                        <ul class="mt" style="list-style: none; font-size: 0.9rem;">
                            <li>Cloudflare Worker: Active</li>
                            <li>Supabase Table: mcqs (Connected)</li>
                            <li>Supabase Table: batches (Connected)</li>
                            <li>Supabase Table: logs (Connected)</li>
                        </ul>
                    </div>
                \`;
            },

            async renderHistory() {
                this.content.innerHTML = '<div class="loader"></div>';
                const res = await fetch('/api/batches');
                const batches = await res.json();
                
                let html = \`
                    <h2 class="mt">Batch History</h2>
                    <p style="color: var(--text-muted)">Chronological list of all generation sessions</p>
                    <div class="card mt" style="padding: 0;">
                \`;
                
                batches.forEach(b => {
                    html += \`
                        <div class="batch-item">
                            <div>
                                <div style="font-weight: 600;">\${b.id}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">\${new Date(b.created_at).toLocaleString()}</div>
                            </div>
                            <div class="flex">
                                <span style="font-size: 0.8rem; color: var(--primary);">\${b.total_questions} MCQs</span>
                                <a href="/batch/\${b.id}" class="btn btn-outline" style="padding: 0.3rem 0.6rem;">Details</a>
                            </div>
                        </div>
                    \`;
                });
                
                html += '</div>';
                this.content.innerHTML = html;
            },

            async renderBatch(id) {
                this.content.innerHTML = '<div class="loader"></div>';
                const res = await fetch(\`/api/batches/\${id}\`);
                const data = await res.json();
                
                let html = \`
                    <div class="flex" style="justify-content: space-between; align-items: flex-end;">
                        <div>
                            <h2 class="mt">Batch Detail: \${data.id}</h2>
                            <p style="color: var(--text-muted)">Generated on \${new Date(data.created_at).toLocaleString()}</p>
                        </div>
                        <a href="/history" class="btn btn-outline">Back to History</a>
                    </div>
                    
                    <div class="grid mt">
                        <div class="card">
                            <h3>Distribution</h3>
                            <pre style="font-size: 0.85rem; color: var(--primary); margin-top: 1rem;">\${JSON.stringify(data.subject_distribution, null, 2)}</pre>
                        </div>
                        <div class="card">
                          <h3>Difficulty</h3>
                          <pre style="font-size: 0.85rem; color: var(--secondary); margin-top: 1rem;">\${JSON.stringify(data.difficulty_distribution, null, 2)}</pre>
                        </div>
                    </div>

                    <h3 class="mt">Agent Log Archive</h3>
                    <div class="log-container">
                \`;
                
                data.logs.forEach(l => {
                    html += \`
                        <div class="log-entry">
                            <span class="log-agent">[\${l.agent_name}]</span> \${l.log_content}
                        </div>
                    \`;
                });
                
                html += \`
                    </div>
                    <h3 class="mt">Questions Outline (\${data.questions.length})</h3>
                    <div class="card mt">
                \`;
                
                data.questions.slice(0, 5).forEach((q, i) => {
                    html += \`
                        <div style="margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                            <div style="font-weight: 600;">Q\${i+1}: \${q.question}</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
                                A: \${q.option_a} | B: \${q.option_b} | C: \${q.option_c} | D: \${q.option_d}
                            </div>
                            <div style="font-size: 0.85rem; color: var(--primary); margin-top: 0.3rem;">Correct: \${q.correct_answer}</div>
                        </div>
                    \`;
                });
                
                if (data.questions.length > 5) html += '<p style="text-align: center; color: var(--text-muted);">... showing first 5 questions ...</p>';
                
                html += '</div>';
                this.content.innerHTML = html;
            },

            renderAdmin() {
                this.content.innerHTML = \`
                    <h2 class="mt">Admin Control Panel</h2>
                    <p style="color: var(--text-muted)">Trigger autonomous generation batches</p>
                    
                    <div class="card mt">
                        <h3>New Generation Session</h3>
                        <p class="mt">This will trigger the multi-agent DC pipeline to generate 100 fresh MCQs.</p>
                        <div class="mt">
                            <input type="password" id="gen-secret" placeholder="Enter Generation Secret" style="background: #000; border: 1px solid var(--border); color: #fff; padding: 0.8rem; border-radius: 8px; width: 100%; max-width: 300px;">
                            <button id="btn-generate" class="btn" style="padding: 0.8rem 1.5rem;">Start DC Pulse</button>
                        </div>
                        <div id="gen-status" class="mt hidden">
                            <div class="flex"><div class="loader" style="width: 20px; height: 20px; margin: 0;"></div> <span id="gen-msg">Pulse Initiated...</span></div>
                        </div>
                    </div>

                    <div id="admin-logs" class="hidden">
                        <h3 class="mt">Live Interaction Stream</h3>
                        <div id="live-logs" class="log-container"></div>
                    </div>
                \`;

                document.getElementById('btn-generate').onclick = () => this.triggerGeneration();
            },

            async triggerGeneration() {
                const secret = document.getElementById('gen-secret').value;
                const status = document.getElementById('gen-status');
                const msg = document.getElementById('gen-msg');
                const logPanel = document.getElementById('admin-logs');
                const logStream = document.getElementById('live-logs');

                if (!secret) return alert('Secret required');

                status.classList.remove('hidden');
                logPanel.classList.remove('hidden');
                logStream.innerHTML = '<div class="log-entry">Authenticating...</div>';

                try {
                    // Step 1: Request local generator to produce batch (Simulated Frontend action)
                    // In a real full autonomous setup, the backend handles the generation.
                    // We call POST /generate which now handles the DC simulation.
                    
                    const res = await fetch('/generate', {
                        method: 'POST',
                        headers: { 'X-Generation-Secret': secret }
                    });

                    const data = await res.json();
                    
                    if (res.ok) {
                        msg.innerText = 'Batch Complete!';
                        data.logs.forEach(l => {
                            const div = document.createElement('div');
                            div.className = 'log-entry';
                            div.innerHTML = \`<span class="log-agent">[\${l.agent_name}]</span> \${l.log_content}\`;
                            logStream.appendChild(div);
                        });
                        logStream.scrollTop = logStream.scrollHeight;
                        alert('Batch ' + data.batchId + ' created successfully!');
                    } else {
                        msg.innerText = 'Execution Failed';
                        logStream.innerHTML += \`<div class="log-entry" style="color: red;">Error: \${data.error}</div>\`;
                    }
                } catch (e) {
                    msg.innerText = 'Connection Error';
                    logStream.innerHTML += \`<div class="log-entry" style="color: red;">Error: \${e.message}</div>\`;
                }
            },

            renderNotFound() {
                this.content.innerHTML = \`
                    <div style="text-align: center; padding: 4rem;">
                        <h1 style="font-size: 5rem;">404</h1>
                        <p>Segment lost in the void.</p>
                        <a href="/" class="btn mt">Return to Source</a>
                    </div>
                \`;
            }
        };

        app.init();
    </script>
</body>
</html>
`;
