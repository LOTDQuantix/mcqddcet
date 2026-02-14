/**
 * DDCET MCQ Platform — Student-Facing Frontend
 * Enhanced with Math support (KaTeX) and Date-based grouping
 */

export function renderSPA() {
    const css = `
        :root {
            --bg: #0a0a0a;
            --card-bg: #111111;
            --primary: #00bcd4;
            --secondary: #009688;
            --success: #4caf50;
            --danger: #f44336;
            --text: #e0e0e0;
            --text-muted: #888;
            --border: #222;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; overflow-x: hidden; }

        nav { border-bottom: 1px solid var(--border); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; background: rgba(10,10,10,0.9); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 100; }
        .logo { font-weight: 800; font-size: 1.2rem; color: var(--primary); text-decoration: none; }
        .nav-links { display: flex; gap: 1.5rem; }
        .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 0.9rem; transition: color 0.3s; }
        .nav-links a:hover, .nav-links a.active { color: var(--primary); }

        .container { max-width: 900px; margin: 2rem auto; padding: 0 1.5rem; }
        .hero { text-align: center; padding: 4rem 1rem 2rem; }
        .hero h1 { font-size: 2.8rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; }
        .hero p { color: var(--text-muted); max-width: 500px; margin: 0 auto 2rem; }

        .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; transition: border-color 0.3s; position: relative; }
        .card:hover { border-color: #333; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }

        .group-header { border-left: 3px solid var(--primary); padding-left: 1rem; margin: 2rem 0 1rem; }
        .group-header h2 { font-size: 1.2rem; font-weight: 700; color: #fff; }
        .group-header span { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; }

        .stat-val { font-size: 2.5rem; font-weight: 800; color: var(--primary); }
        .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; }

        .btn { display: inline-block; background: var(--primary); color: #000; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; transition: opacity 0.3s; font-size: 0.9rem; }
        .btn:hover { opacity: 0.85; }
        .btn-outline { background: transparent; color: var(--primary); border: 1px solid var(--primary); }
        .btn-sm { padding: 0.35rem 0.7rem; font-size: 0.8rem; }

        .filter-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .filter-bar select { background: #1a1a1a; color: var(--text); border: 1px solid var(--border); padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.85rem; }

        .mcq-option { display: block; width: 100%; text-align: left; background: #1a1a1a; border: 1px solid var(--border); color: var(--text); padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s; font-size: 0.95rem; }
        .mcq-option:hover { border-color: var(--primary); background: #1f1f1f; }
        .mcq-option.correct { border-color: var(--success); background: rgba(76,175,80,0.15); color: var(--success); }
        .mcq-option.wrong { border-color: var(--danger); background: rgba(244,67,54,0.1); color: var(--danger); }
        .mcq-option.disabled { pointer-events: none; opacity: 0.7; }
        .mcq-option.correct-highlight { border-color: var(--success); background: rgba(76,175,80,0.15); }

        .score-bar { display: flex; gap: 1.5rem; align-items: center; padding: 1rem; background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1.5rem; }
        .score-bar .score { font-size: 1.2rem; font-weight: 700; color: var(--primary); }

        .q-meta { display: flex; gap: 0.75rem; margin-top: 0.5rem; font-size: 0.75rem; }
        .q-meta span { background: #1a1a1a; padding: 0.2rem 0.5rem; border-radius: 4px; color: var(--text-muted); }

        .pagination { display: flex; justify-content: center; gap: 0.5rem; margin-top: 2rem; }

        .loader { width: 36px; height: 36px; border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 3rem auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .mt { margin-top: 1rem; }
        .hidden { display: none; }

        .expand-btn { background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.85rem; padding: 0.3rem 0; }
        .browse-answer { margin-top: 0.5rem; padding: 0.5rem; background: rgba(0,188,212,0.08); border-radius: 6px; font-size: 0.9rem; color: var(--primary); }

        .log-container { background: #000; padding: 1rem; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 0.85rem; height: 300px; overflow-y: auto; color: #0f0; margin-top: 1rem; }
        .log-entry { margin-bottom: 0.5rem; }
        .log-agent { color: var(--primary); font-weight: bold; }

        /* KaTeX Premium Styling */
        .katex-display { 
            overflow-x: auto; 
            overflow-y: hidden; 
            padding: 1.5rem 0; 
            margin: 1rem 0; 
            background: rgba(255,255,255,0.03);
            border-radius: 8px;
            text-align: center;
        }
        .katex { font-size: 1.15em; color: #fff; }
        .katex-html { font-family: 'Times New Roman', serif; }
    `;

    const script = `
        const app = {
            content: document.getElementById('content'),
            score: { correct: 0, total: 0, seen: [] },

            init() {
                window.addEventListener('popstate', () => this.route());
                document.body.addEventListener('click', e => {
                    const a = e.target.closest('a[href]');
                    if (a && a.getAttribute('href').startsWith('/')) {
                        e.preventDefault();
                        history.pushState(null, '', a.getAttribute('href'));
                        this.route();
                    }
                });
                this.route();
            },

            renderMath() {
                if (window.renderMathInElement) {
                    try {
                        renderMathInElement(document.body, {
                            delimiters: [
                                {left: '$$', right: '$$', display: true},
                                {left: '$', right: '$', display: false},
                                {left: '\\\\(', right: '\\\\)', display: false},
                                {left: '\\\\[', right: '\\\\]', display: true}
                            ],
                            throwOnError: false,
                            trust: true,
                            strict: false
                        });
                    } catch (e) {
                        console.error("Math rendering error:", e);
                    }
                }
            },

            route() {
                const path = window.location.pathname;
                document.querySelectorAll('.nav-links a').forEach(a => {
                    a.classList.toggle('active', a.getAttribute('href') === path);
                });

                if (path === '/') this.renderHome();
                else if (path === '/practice') this.renderPractice();
                else if (path === '/browse') this.renderBrowse();
                else if (path === '/admin') this.renderAdmin();
                else this.content.innerHTML = '<div style="text-align:center;padding:4rem"><h1 style="font-size:4rem">404</h1><p>Page not found</p><a href="/" class="btn mt">Home</a></div>';
            },

            renderHome() {
                this.content.innerHTML = '<div class="loader"></div>';
                fetch('/status').then(r => r.json()).then(data => {
                    const db = data.database || { total: 0, Maths: 0, Physics: 0 };
                    this.content.innerHTML =
                        '<div class="hero">' +
                            '<h1>DDCET MCQ Practice</h1>' +
                            '<p>Conceptual MCQs for Maths & Physics. Practice, track, and master your preparation with ease.</p>' +
                            '<div style="display:flex;gap:1rem;justify-content:center">' +
                                '<a href="/practice" class="btn">Start Practice</a>' +
                                '<a href="/browse" class="btn btn-outline">Browse All</a>' +
                            '</div>' +
                        '</div>' +
                        '<div class="grid">' +
                            '<div class="card" style="text-align:center">' +
                                '<div class="stat-label">Total Questions</div>' +
                                '<div class="stat-val">' + db.total + '</div>' +
                            '</div>' +
                            '<div class="card" style="text-align:center">' +
                                '<div class="stat-label">Maths</div>' +
                                '<div class="stat-val">' + db.Maths + '</div>' +
                            '</div>' +
                            '<div class="card" style="text-align:center">' +
                                '<div class="stat-label">Physics</div>' +
                                '<div class="stat-val">' + (db.Physics || 0) + '</div>' +
                            '</div>' +
                        '</div>';
                    this.renderMath();
                }).catch(e => {
                    this.content.innerHTML = '<div class="card" style="border-color:red"><h3>Connection Error</h3><p class="mt">' + e.message + '</p></div>';
                });
            },

            renderPractice() {
                this.score = { correct: 0, total: 0, seen: [] };
                this.content.innerHTML =
                    '<h2 class="mt">Practice Mode</h2>' +
                    '<p style="color:var(--text-muted)">Practice conceptual questions. Select an option to see the result.</p>' +
                    '<div class="filter-bar mt">' +
                        '<select id="pf-subject" onchange="app.resetPractice()">' +
                            '<option value="">All Subjects</option>' +
                            '<option value="Maths">Maths</option>' +
                            '<option value="Physics">Physics</option>' +
                            '<option value="Chemistry" disabled>Chemistry (Coming Soon)</option>' +
                            '<option value="Biology" disabled>Biology (Coming Soon)</option>' +
                        '</select>' +
                        '<select id="pf-difficulty" onchange="app.resetPractice()">' +
                            '<option value="">All Difficulty</option>' +
                            '<option value="Easy">Easy</option>' +
                            '<option value="Medium">Medium</option>' +
                            '<option value="Hard">Hard</option>' +
                        '</select>' +
                        '<button class="btn btn-sm btn-outline" onclick="app.resetPractice()">Reset Score</button>' +
                    '</div>' +
                    '<div id="score-display" class="score-bar">' +
                        '<span>Session Score:</span> <span class="score">0 / 0</span>' +
                    '</div>' +
                    '<div id="question-area"><div class="loader"></div></div>';
                this.loadQuestion();
            },

            resetPractice() {
                this.score = { correct: 0, total: 0, seen: [] };
                const s = document.querySelector('#score-display .score');
                if (s) s.textContent = '0 / 0';
                this.loadQuestion();
            },

            loadQuestion() {
                var area = document.getElementById('question-area');
                if (!area) return;
                area.innerHTML = '<div class="loader"></div>';
                var subj = document.getElementById('pf-subject');
                var diff = document.getElementById('pf-difficulty');
                var params = new URLSearchParams();
                if (subj && subj.value) params.set('subject', subj.value);
                if (diff && diff.value) params.set('difficulty', diff.value);
                if (this.score.seen.length > 0) params.set('exclude', this.score.seen.join(','));

                fetch('/api/mcqs/random?' + params.toString())
                    .then(r => r.json())
                    .then(q => {
                        if (q.error) {
                            area.innerHTML = '<div class="card" style="text-align:center"><h3>All Questions Completed!</h3><p class="mt">Reset your score to repeat or change filters.</p><button class="btn mt" onclick="app.resetPractice()">Restart Practice</button></div>';
                            return;
                        }
                        this.score.seen.push(q.id);
                        var opts = [
                            { key: 'A', text: q.option_a },
                            { key: 'B', text: q.option_b },
                            { key: 'C', text: q.option_c },
                            { key: 'D', text: q.option_d }
                        ];
                        var html = '<div class="card">' +
                            '<h3 style="margin-bottom:0.5rem">' + q.question + '</h3>' +
                            '<div class="q-meta"><span>' + q.subject + '</span><span>' + q.difficulty + '</span><span>' + q.topic + '</span></div>' +
                            '<div id="options" style="margin-top:1.5rem">';
                        opts.forEach(function(o) {
                            html += '<button class="mcq-option" data-key="' + o.key + '" data-correct="' + q.correct_answer + '" onclick="app.selectAnswer(this)">' +
                                '<strong>' + o.key + '.</strong> ' + o.text +
                            '</button>';
                        });
                        html += '</div>' +
                            '<div id="feedback" class="hidden mt"></div>' +
                            '<button id="next-btn" class="btn mt hidden" onclick="app.loadQuestion()">Next Question →</button>' +
                        '</div>';
                        area.innerHTML = html;
                        this.renderMath();
                    })
                    .catch(e => {
                        area.innerHTML = '<div class="card" style="border-color:red"><p>Error loading question: ' + e.message + '</p></div>';
                    });
            },

            selectAnswer(btn) {
                var correct = btn.getAttribute('data-correct');
                var selected = btn.getAttribute('data-key');
                var allBtns = document.querySelectorAll('#options .mcq-option');
                var feedback = document.getElementById('feedback');
                var nextBtn = document.getElementById('next-btn');

                allBtns.forEach(function(b) {
                    b.classList.add('disabled');
                    if (b.getAttribute('data-key') === correct) {
                        b.classList.add('correct-highlight');
                    }
                });

                this.score.total++;
                if (selected === correct) {
                    btn.classList.add('correct');
                    this.score.correct++;
                    feedback.innerHTML = '<span style="color:var(--success);font-weight:700">✓ Correct! Great job!</span>';
                } else {
                    btn.classList.add('wrong');
                    feedback.innerHTML = '<span style="color:var(--danger);font-weight:700">✗ Not quite. The correct answer is ' + correct + '.</span>';
                }

                feedback.classList.remove('hidden');
                nextBtn.classList.remove('hidden');
                document.querySelector('#score-display .score').textContent = this.score.correct + ' / ' + this.score.total;
                this.renderMath();
            },

            renderBrowse() {
                this.content.innerHTML =
                    '<h2 class="mt">Question Library</h2>' +
                    '<p style="color:var(--text-muted)">Grouped by date and topic. Use filters to narrow down.</p>' +
                    '<div class="filter-bar mt">' +
                        '<select id="bf-subject" onchange="app.browsePage(1)">' +
                            '<option value="">All Subjects</option>' +
                            '<option value="Maths">Maths</option>' +
                            '<option value="Physics">Physics</option>' +
                            '<option value="Chemistry" disabled>Chemistry (Soon)</option>' +
                        '</select>' +
                        '<select id="bf-difficulty" onchange="app.browsePage(1)">' +
                            '<option value="">All Difficulty</option>' +
                            '<option value="Easy">Easy</option>' +
                            '<option value="Medium">Medium</option>' +
                            '<option value="Hard">Hard</option>' +
                        '</select>' +
                    '</div>' +
                    '<div id="browse-list"><div class="loader"></div></div>' +
                    '<div id="browse-pagination" class="pagination"></div>';
                this.browsePage(1);
            },

            toggleAnswer(btn) {
                const ans = btn.nextElementSibling;
                ans.classList.toggle('hidden');
                btn.textContent = ans.classList.contains('hidden') ? 'Show Answer' : 'Hide Answer';
            },

            browsePage(page) {
                var list = document.getElementById('browse-list');
                var pagDiv = document.getElementById('browse-pagination');
                if (!list) return;
                list.innerHTML = '<div class="loader"></div>';

                var subj = document.getElementById('bf-subject');
                var diff = document.getElementById('bf-difficulty');
                var params = new URLSearchParams({ page: page, limit: 15 });
                if (subj && subj.value) params.set('subject', subj.value);
                if (diff && diff.value) params.set('difficulty', diff.value);

                fetch('/api/mcqs?' + params.toString())
                    .then(r => r.json())
                    .then(res => {
                        if (!res.data || res.data.length === 0) {
                            list.innerHTML = '<div class="card"><p>No questions found for these filters.</p></div>';
                            pagDiv.innerHTML = '';
                            return;
                        }

                        // Group by date
                        var groups = {};
                        res.data.forEach(function(q) {
                            var dateStr = new Date(q.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                            var dayKey = dateStr;
                            if (!groups[dayKey]) groups[dayKey] = {};
                            if (!groups[dayKey][q.subject]) groups[dayKey][q.subject] = [];
                            groups[dayKey][q.subject].push(q);
                        });

                        var html = '';
                        Object.keys(groups).forEach(function(day) {
                            html += '<div class="group-header"><span>Uploaded on</span><h2>' + day + '</h2></div>';
                            Object.keys(groups[day]).forEach(function(subject) {
                                html += '<div style="margin-top:1rem;font-size:0.8rem;color:var(--primary);font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:0 0.5rem">' + subject + '</div>';
                                groups[day][subject].forEach(function(q, idx) {
                                    html += '<div class="card">' +
                                        '<div><strong>' + (idx + 1) + '.</strong> ' + q.question + '</div>' +
                                        '<div class="q-meta"><span>' + q.difficulty + '</span><span>' + q.topic + '</span></div>' +
                                        '<div style="margin-top:0.75rem;font-size:0.9rem;color:var(--text-muted)">' +
                                            'A: ' + q.option_a + ' &nbsp;|&nbsp; B: ' + q.option_b + ' &nbsp;|&nbsp; C: ' + q.option_c + ' &nbsp;|&nbsp; D: ' + q.option_d +
                                        '</div>' +
                                        '<button class="expand-btn" onclick="app.toggleAnswer(this)">Show Answer</button>' +
                                        '<div class="browse-answer hidden">Correct Answer: <strong>' + q.correct_answer + '</strong></div>' +
                                    '</div>';
                                });
                            });
                        });
                        list.innerHTML = html;

                        var totalPages = Math.ceil(res.total / 15);
                        var pagHtml = '';
                        if (totalPages > 1) {
                            for (var p = 1; p <= totalPages; p++) {
                                pagHtml += '<button class="btn btn-sm ' + (p === page ? '' : 'btn-outline') + '" onclick="app.browsePage(' + p + ')" ' + (p === page ? 'disabled' : '') + '>' + p + '</button>';
                            }
                        }
                        pagDiv.innerHTML = pagHtml;
                        this.renderMath();
                    })
                    .catch(e => {
                        list.innerHTML = '<div class="card" style="border-color:red"><p>Error: ' + e.message + '</p></div>';
                    });
            },

            renderAdmin() {
                this.content.innerHTML =
                    '<h2 class="mt">Admin Tools</h2>' +
                    '<p style="color:var(--text-muted)">Autonomous generation & batch management</p>' +
                    '<div class="card mt">' +
                        '<h3>Generate New Batch</h3>' +
                        '<p class="mt" style="font-size:0.9rem">Triggers the DC pipeline to generate 100 new MCQs with automatic verification and deduplication.</p>' +
                        '<div class="mt" style="display:flex;gap:0.5rem;align-items:center">' +
                            '<input type="password" id="gen-secret" placeholder="Auth Secret" style="background:#000;border:1px solid var(--border);color:#fff;padding:0.6rem;border-radius:8px;width:250px">' +
                            '<button class="btn" onclick="app.triggerGen()">Start Generation</button>' +
                        '</div>' +
                        '<div id="gen-status" class="mt hidden"><div class="loader" style="width:20px;height:20px;margin:0;display:inline-block;vertical-align:middle"></div> <span id="gen-msg">Initializing DC Session...</span></div>' +
                    '</div>' +
                    '<div id="admin-logs" class="hidden">' +
                        '<h3 class="mt">Session Simulation Logs</h3>' +
                        '<div id="live-logs" class="log-container"></div>' +
                    '</div>';
            },

            triggerGen() {
                var secret = document.getElementById('gen-secret').value;
                if (!secret) return alert('Secret required');
                var status = document.getElementById('gen-status');
                var msg = document.getElementById('gen-msg');
                var logPanel = document.getElementById('admin-logs');
                var logStream = document.getElementById('live-logs');

                status.classList.remove('hidden');
                logPanel.classList.remove('hidden');
                logStream.innerHTML = '<div class="log-entry">Authenticating Worker...</div>';

                fetch('/generate', { method: 'POST', headers: { 'X-Generation-Secret': secret } })
                    .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
                    .then(function(res) {
                        if (res.ok) {
                            msg.textContent = 'Generation Successful!';
                            if (res.data.logs) {
                                res.data.logs.forEach(function(l) {
                                    logStream.innerHTML += '<div class="log-entry"><span class="log-agent">[' + l.agent_name + ']</span> ' + l.log_content + '</div>';
                                });
                            }
                            logStream.innerHTML += '<div class="log-entry" style="color:var(--success)">✅ Batch ' + (res.data.batchId || 'sync-complete') + ' processed successfully.</div>';
                        } else {
                            msg.textContent = 'Generation Failed';
                            logStream.innerHTML += '<div class="log-entry" style="color:red">Error: ' + (res.data.error || 'Server rejected request') + '</div>';
                        }
                        logStream.scrollTop = logStream.scrollHeight;
                    })
                    .catch(function(e) {
                        msg.textContent = 'Error';
                        logStream.innerHTML += '<div class="log-entry" style="color:red">' + e.message + '</div>';
                    });
            }
        };

        app.init();
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DDCET MCQ Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    
    <!-- KaTeX for Math Equations -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
    
    <style>${css}</style>
</head>
<body>
    <nav>
        <a href="/" class="logo">⚛️ DDCET MCQ</a>
        <div class="nav-links">
            <a href="/">Home</a>
            <a href="/practice">Practice</a>
            <a href="/browse">Browse</a>
            <a href="/admin">Admin</a>
        </div>
    </nav>
    <div id="content" class="container"></div>
    <script>${script}</script>
</body>
</html>`;
}
