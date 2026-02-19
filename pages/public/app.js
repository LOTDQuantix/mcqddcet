/**
 * DDCET MCQ Platform — Student-Facing Frontend
 * Extracted for Cloudflare Pages split architecture.
 */

const app = {
    content: document.getElementById('content'),
    score: { correct: 0, total: 0, seen: [] },

    // Supabase Config (Injected via environment variables or index.html)
    supabaseUrl: window.SUPABASE_URL || 'https://ngisjclqxzvfdnphrnif.supabase.co',
    supabaseKey: window.SUPABASE_ANON_KEY || '',

    user: null, // Current logged in user

    async init() {
        // Load session (Use sessionStorage for "everyday/new window" login)
        const savedUser = sessionStorage.getItem('ddcet_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
            } catch (e) {
                sessionStorage.removeItem('ddcet_user');
            }
        }

        if (!this.supabaseKey || this.supabaseKey === 'your-anon-key-here') {
            const msg = '⚠️ Supabase Anon Key is missing. Please set it in index.html or as an environment variable.';
            console.error(msg);
            this.setHTML(this.content, `<div class="card" style="border-color:var(--danger)"><h3>Configuration Required</h3><p class="mt">${msg}</p></div>`);
            return;
        }
        document.body.addEventListener('click', e => {
            const a = e.target.closest('a[href]');
            if (a && a.getAttribute('href').startsWith('/')) {
                e.preventDefault();
                history.pushState(null, '', a.getAttribute('href'));
                this.route();
            }
        });
        this.updateNav();
        this.route();
    },

    async safeFetch(path, options = {}, retries = 1) {
        // Construct Supabase REST URL
        const url = `${this.supabaseUrl}/rest/v1${path}`;

        // Add required Supabase headers
        options.headers = {
            ...options.headers,
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || 'HTTP error! status: ' + response.status);
            }

            const data = options.method === 'HEAD' ? null : await response.json();
            return {
                data,
                headers: response.headers
            };
        } catch (e) {
            if (retries > 0) {
                console.warn('Retrying fetch: ' + path + ' (' + retries + ' left)');
                return this.safeFetch(path, options, retries - 1);
            }
            throw e;
        }
    },

    setHTML(el, html) {
        el.innerHTML = html; // Insert raw LaTeX first

        // Render math immediately on this container
        if (window.renderMathInElement) {
            try {
                renderMathInElement(el, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\\\(', right: '\\\\)', display: false },
                        { left: '\\\\[', right: '\\\\]', display: true }
                    ],
                    throwOnError: false,
                    strict: false
                });
            } catch (e) {
                console.error("KaTeX render error:", e);
            }
        }

        // THEN sanitize non-math content
        if (window.DOMPurify) {
            const clean = DOMPurify.sanitize(el.innerHTML, {
                ALLOWED_TAGS: [
                    'h1', 'h2', 'h3', 'p', 'a', 'span', 'div', 'button', 'strong', 'i', 'br',
                    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub',
                    'form', 'input', 'label', 'select', 'option', 'lottie-player', // Added for interactive elements
                    // MathML tags for KaTeX resilience
                    'math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn', 'mtext'
                ],
                ADD_ATTR: [
                    'onclick', 'data-key', 'data-correct', 'style', 'class', 'href', 'target', 'aria-hidden',
                    'type', 'id', 'required', 'placeholder', 'value', 'onsubmit', 'for', 'src', 'background', 'speed', 'loop', 'autoplay' // Added for lottie/forms
                ]
            });
            el.innerHTML = clean;
        }

        // Trigger Lucide icons
        if (window.lucide) {
            lucide.createIcons({
                attrs: {
                    'stroke-width': 2,
                    'class': 'icon'
                }
            });
        }
    },

    route() {
        const path = window.location.pathname;
        this.updateNav();

        // ** Global Login Barrier **
        // Redirect to /login for EVERYTHING if not logged in, except /login itself
        if (path !== '/login' && !this.user) {
            history.pushState(null, '', '/login');
            return this.renderLogin();
        }

        if (path === '/') this.renderHome();
        else if (path === '/practice') this.renderPractice();
        else if (path === '/exam') this.renderExam();
        else if (path === '/browse') this.renderBrowse();
        else if (path === '/login') this.renderLogin();
        else if (path === '/dashboard') this.renderDashboard();
        else if (path.startsWith('/batch/')) this.renderBatchDetails(path.split('/').pop());
        else this.setHTML(this.content, '<div style="text-align:center;padding:4rem"><h1 style="font-size:4rem">404</h1><p>Page not found</p><a href="/" class="btn mt">Home</a></div>');
    },

    updateNav() {
        document.querySelectorAll('.nav-links a').forEach(a => {
            const href = a.getAttribute('href');
            a.classList.toggle('active', href === window.location.pathname);
        });

        const authLinks = document.getElementById('auth-links');
        if (authLinks) {
            if (this.user) {
                authLinks.innerHTML = `
                    <a href="/dashboard"><i data-lucide="layout-dashboard"></i>Dashboard</a>
                    <a href="#" onclick="event.preventDefault(); app.logout()"><i data-lucide="log-out"></i>Logout</a>
                `;
            } else {
                authLinks.innerHTML = `<a href="/login"><i data-lucide="log-in"></i>Login</a>`;
            }
        }

        // Re-run lucide on nav if needed
        if (window.lucide) lucide.createIcons();
    },

    renderHome() {
        this.setHTML(this.content, '<div class="loader"></div>');

        const getCount = (res) => {
            const range = res.headers.get('content-range');
            return range ? range.split('/').pop() : 0;
        };

        // Fetch stats from Supabase directly
        Promise.all([
            this.safeFetch('/mcqs?select=id', { headers: { 'Prefer': 'count=exact' }, method: 'HEAD' }),
            this.safeFetch('/mcqs?subject=eq.Maths&select=id', { headers: { 'Prefer': 'count=exact' }, method: 'HEAD' }),
            this.safeFetch('/mcqs?subject=eq.Physics&select=id', { headers: { 'Prefer': 'count=exact' }, method: 'HEAD' }),
            this.safeFetch('/batches?select=id', { headers: { 'Prefer': 'count=exact' }, method: 'HEAD' })
        ]).then(([totalRes, mathsRes, physicsRes, batchesRes]) => {
            const stats = {
                total: getCount(totalRes),
                Maths: getCount(mathsRes),
                Physics: getCount(physicsRes),
                Batches: getCount(batchesRes)
            };

            this.setHTML(this.content,
                '<div class="hero">' +
                '<lottie-player src="https://lottie.host/9e0a2992-0545-4de4-a461-893098528994/hN2jJjAEvM.json" background="transparent" speed="1" style="width: 200px; height: 200px;" loop autoplay></lottie-player>' +
                '<h1>DDCET MCQ Practice</h1>' +
                '<p>Conceptual MCQs for Maths & Physics. Practice directly with Supabase.</p>' +
                '<div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-top:2rem">' +
                '<a href="/practice" class="btn"><i data-lucide="play-circle"></i>Practice Mode</a>' +
                '<a href="/exam" class="btn btn-outline" style="border-color:var(--danger);color:var(--danger)"><i data-lucide="clock"></i>Exam Mode (Timed)</a>' +
                '<a href="/browse" class="btn btn-outline"><i data-lucide="layers"></i>Browse All</a>' +
                '</div>' +
                '</div>' +
                '<div class="grid">' +
                '<div class="card stat-card">' +
                '<i data-lucide="database" class="mt" style="color:var(--primary)"></i>' +
                '<div class="stat-label">Total MCQs</div>' +
                '<div class="stat-val">' + stats.total + '</div>' +
                '</div>' +
                '<div class="card stat-card">' +
                '<i data-lucide="sigma" class="mt" style="color:var(--primary)"></i>' +
                '<div class="stat-label">Maths Questions</div>' +
                '<div class="stat-val">' + stats.Maths + '</div>' +
                '</div>' +
                '<div class="card stat-card">' +
                '<i data-lucide="atom" class="mt" style="color:var(--primary)"></i>' +
                '<div class="stat-label">Physics Questions</div>' +
                '<div class="stat-val">' + stats.Physics + '</div>' +
                '</div>' +
                '<div class="card stat-card">' +
                '<i data-lucide="box" class="mt" style="color:var(--primary)"></i>' +
                '<div class="stat-label">Total Batches</div>' +
                '<div class="stat-val">' + stats.Batches + '</div>' +
                '</div>' +
                '</div>');
        }).catch(e => {
            console.error("Home stats error:", e);
            this.setHTML(this.content, '<div class="card" style="border-color:red"><h3>Supabase Connection Error</h3><p class="mt">' + e.message + '</p></div>');
        });
    },

    renderPractice() {
        // Persist seen between resets to avoid duplicates
        const sessionSeen = JSON.parse(sessionStorage.getItem('ddcet_seen_global') || '[]');
        this.score = { correct: 0, total: 0, seen: [], globalSeen: sessionSeen, pool: [] };

        this.setHTML(this.content,
            '<h2 class="mt">Practice Mode</h2>' +
            '<p style="color:var(--text-muted)">Practice conceptual questions. Select an option to see the result.</p>' +
            '<div class="filter-bar mt" style="display:grid;grid-template-columns:1fr 1fr auto;gap:1rem;align-items:center">' +
            '<select id="pf-subject" onchange="app.resetPractice()">' +
            '<option value="">All Subjects</option>' +
            '<option value="Maths">Maths</option>' +
            '<option value="Physics">Physics</option>' +
            '</select>' +
            '<select id="pf-difficulty" onchange="app.resetPractice()">' +
            '<option value="">All Difficulty</option>' +
            '<option value="Easy">Easy</option>' +
            '<option value="Medium">Medium</option>' +
            '<option value="Hard">Hard</option>' +
            '</select>' +
            '<button class="btn btn-outline" onclick="app.resetPractice()"><i data-lucide="rotate-ccw"></i>Reset</button>' +
            '</div>' +
            '<div id="score-display" class="score-bar">' +
            '<span><i data-lucide="target" style="vertical-align:middle;margin-right:0.5rem"></i>Session Score:</span> <span class="score">0 / 0</span>' +
            '</div>' +
            '<div id="question-area"><div class="loader"></div></div>');
        this.loadQuestion();
    },

    resetPractice() {
        // Keep globalSeen but reset local session score
        this.score.correct = 0;
        this.score.total = 0;
        this.score.seen = [];
        this.score.pool = [];
        const s = document.querySelector('#score-display .score');
        if (s) s.textContent = '0 / 0';
    },

    async loadQuestion() {
        const area = document.getElementById('question-area');
        if (!area) return;

        const subjEl = document.getElementById('pf-subject');
        const diffEl = document.getElementById('pf-difficulty');
        const subj = subjEl ? subjEl.value : '';
        const diff = diffEl ? diffEl.value : '';

        // If pool is empty or near empty, fetch more
        const unseenInPool = this.score.pool.filter(q => !this.score.globalSeen.includes(q.id));

        if (unseenInPool.length === 0) {
            this.setHTML(area, '<div class="loader"></div>');

            try {
                // 1. Get total count for this category
                let countPath = '/mcqs?select=id';
                if (subj) countPath += `&subject=eq.${subj}`;
                if (diff) countPath += `&difficulty=eq.${diff}`;

                const { headers } = await this.safeFetch(countPath, { method: 'HEAD' });
                const contentRange = headers.get('content-range');
                const total = contentRange ? parseInt(contentRange.split('/')[1]) : 0;

                // 2. Fetch a random batch of 100 with random offset
                const batchSize = 100;
                let from = 0;
                if (total > batchSize) {
                    from = Math.floor(Math.random() * (total - batchSize));
                }
                const to = from + batchSize - 1;

                let path = `/mcqs?select=*&limit=${batchSize}`;
                if (subj) path += `&subject=eq.${subj}`;
                if (diff) path += `&difficulty=eq.${diff}`;

                const { data } = await this.safeFetch(path, {
                    headers: { 'Range': `${from}-${to}` }
                });

                if (!data || data.length === 0) throw new Error("No questions found");

                // Filter out globalSeen before sorting
                const freshUnseen = data.filter(q => !this.score.globalSeen.includes(q.id));

                if (freshUnseen.length === 0) {
                    this.setHTML(area, `
                        <div class="card" style="text-align:center;animation:slideUp 0.6s ease">
                            <lottie-player src="https://lottie.host/6770281c-6d1a-428a-9a91-4d4b1a134371/No8F0Inh8N.json" background="transparent" speed="1" style="width: 200px; height: 200px;" loop autoplay></lottie-player>
                            <h3>Session Complete!</h3>
                            <p class="mt">Wow! You've gone through all available questions in this category.</p>
                            <button class="btn mt" onclick="app.score.globalSeen=[]; sessionStorage.removeItem('ddcet_seen_global'); app.resetPractice()">
                                <i data-lucide="refresh-cw"></i>Start Over Unseen
                            </button>
                        </div>
                    `);
                    return;
                }

                this.score.pool = freshUnseen.sort(() => Math.random() - 0.5);
                this.displayQuestion(this.score.pool[0]);
            } catch (e) {
                this.setHTML(area, '<div class="card" style="border-color:red"><p>Error: ' + e.message + '</p></div>');
            }
        } else {
            this.displayQuestion(unseenInPool[0]);
        }
    },

    displayQuestion(q) {
        const area = document.getElementById('question-area');
        this.score.seen.push(q.id);
        this.score.globalSeen.push(q.id);

        // Persist to session storage
        sessionStorage.setItem('ddcet_seen_global', JSON.stringify(this.score.globalSeen));

        const opts = [
            { key: 'A', text: q.option_a },
            { key: 'B', text: q.option_b },
            { key: 'C', text: q.option_c },
            { key: 'D', text: q.option_d }
        ];

        let html = '<div class="card">' +
            '<h3 style="margin-bottom:0.5rem">' + q.question + '</h3>' +
            '<div class="q-meta"><span>' + q.subject + '</span><span>' + q.difficulty + '</span><span>' + q.topic + '</span></div>' +
            '<div id="options" style="margin-top:1.5rem">';

        opts.forEach(o => {
            html += '<button class="mcq-option" data-key="' + o.key + '" data-correct="' + q.correct_answer + '" onclick="app.selectAnswer(this)">' +
                '<strong>' + o.key + '.</strong> ' + o.text +
                '</button>';
        });

        html += '</div>' +
            '<div id="feedback" class="hidden mt"></div>' +
            '<button id="next-btn" class="btn mt hidden" onclick="app.loadQuestion()">Next Question →</button>' +
            '</div>';

        this.setHTML(area, html);
    },

    selectAnswer(btn) {
        var correct = btn.getAttribute('data-correct');
        var selected = btn.getAttribute('data-key');
        var allBtns = document.querySelectorAll('#options .mcq-option');
        var feedback = document.getElementById('feedback');
        var nextBtn = document.getElementById('next-btn');

        allBtns.forEach(function (b) {
            b.classList.add('disabled');
            if (b.getAttribute('data-key') === correct) {
                b.classList.add('correct-highlight');
            }
        });

        this.score.total++;
        if (selected === correct) this.score.correct++;

        this.setHTML(feedback, (selected === correct) ?
            '<span style="color:var(--success);font-weight:700">✓ Correct! Great job!</span>' :
            '<span style="color:var(--danger);font-weight:700">✗ Not quite. The correct answer is ' + correct + '.</span>'
        );

        feedback.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        document.querySelector('#score-display .score').textContent = this.score.correct + ' / ' + this.score.total;
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

        var subj = document.getElementById('bf-subject').value;
        var diff = document.getElementById('bf-difficulty').value;
        const limit = 15;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let path = `/mcqs?select=*&order=created_at.desc`;
        if (subj) path += `&subject=eq.${subj}`;
        if (diff) path += `&difficulty=eq.${diff}`;

        this.safeFetch(path, { headers: { 'Range': `${from}-${to}` } })
            .then(({ data }) => {
                if (!data || data.length === 0) {
                    this.setHTML(list, '<div class="card"><p>No questions found for these filters.</p></div>');
                    pagDiv.innerHTML = '';
                    return;
                }

                var groups = {};
                data.forEach(function (q) {
                    var dateStr = new Date(q.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    if (!groups[dateStr]) groups[dateStr] = {};
                    if (!groups[dateStr][q.subject]) groups[dateStr][q.subject] = [];
                    groups[dateStr][q.subject].push(q);
                });

                var html = '';
                Object.keys(groups).forEach(function (day) {
                    html += '<div class="group-header"><span>Uploaded on</span><h2>' + day + '</h2></div>';
                    Object.keys(groups[day]).forEach(function (subject) {
                        html += '<div style="margin-top:1rem;font-size:0.8rem;color:var(--primary);font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:0 0.5rem">' + subject + '</div>';
                        groups[day][subject].forEach(function (q, idx) {
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
                this.setHTML(list, html);

                // For simplicity, we assume there are more pages if we hit the limit
                var pagHtml = '';
                if (page > 1) pagHtml += '<button class="btn btn-sm btn-outline" onclick="app.browsePage(' + (page - 1) + ')">Previous</button>';
                if (data.length === limit) pagHtml += '<button class="btn btn-sm btn-outline" onclick="app.browsePage(' + (page + 1) + ')">Next</button>';

                this.setHTML(pagDiv, pagHtml);
            })
            .catch(e => {
                this.setHTML(list, '<div class="card" style="border-color:red"><p>Error: ' + e.message + '</p></div>');
            });
    },

    triggerGen() {
        alert('Remote generation is disabled. Please use "npm run generate" locally instead.');
    },

    // --- AUTH ---
    async hashPassword(password) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    renderLogin() {
        this.setHTML(this.content, `
            <div class="card mt" style="max-width:400px;margin:2rem auto;animation:slideUp 0.6s ease">
                <lottie-player src="https://lottie.host/5b4f6975-f70d-4c3e-953e-5b1b426034f3/K77qJp69h1.json" background="transparent" speed="1" style="width: 150px; height: 150px;" loop autoplay></lottie-player>
                <h2 style="text-align:center;margin-bottom:0.5rem">Welcome Back</h2>
                <p style="text-align:center;color:var(--text-muted);margin-bottom:2rem">Sign in to access your MCQ platform.</p>
                <form onsubmit="event.preventDefault(); app.handleLogin()">
                    <div class="mt">
                        <label for="login-username" style="display:block;margin-bottom:0.5rem;font-size:0.85rem;color:var(--primary)">Username</label>
                        <input type="text" id="login-username" placeholder="Enter your username" required>
                    </div>
                    <div class="mt">
                        <label for="login-password" style="display:block;margin-bottom:0.5rem;font-size:0.85rem;color:var(--primary)">Password</label>
                        <input type="password" id="login-password" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn mt" style="width:100%;margin-top:2rem">Sign In</button>
                    <p id="login-error" class="card mt hidden" style="color:var(--danger);text-align:center;font-size:0.9rem;padding:0.75rem;border-color:var(--danger);background:rgba(248,113,113,0.1)"></p>
                </form>
                <div class="mt" style="text-align:center;font-size:0.8rem;color:var(--text-muted);opacity:0.7">
                    Restricted Access — Phase 9 Security Active
                </div>
            </div>
        `);
    },

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        errorEl.classList.add('hidden');

        try {
            const hash = await this.hashPassword(password);
            const { data } = await this.safeFetch(`/users?username=eq.${username}&select=*`);

            if (data && data.length > 0 && data[0].password_hash === hash) {
                this.user = { id: data[0].id, username: data[0].username };
                sessionStorage.setItem('ddcet_user', JSON.stringify(this.user));
                this.updateNav();
                history.pushState(null, '', '/dashboard');
                this.renderDashboard();
            } else {
                throw new Error("Invalid username or password");
            }
        } catch (e) {
            errorEl.textContent = e.message;
            errorEl.classList.remove('hidden');
        }
    },

    logout() {
        this.user = null;
        sessionStorage.removeItem('ddcet_user');
        this.updateNav();
        history.pushState(null, '', '/login');
        this.renderLogin();
    },

    async renderDashboard() {
        this.setHTML(this.content, '<div class="loader"></div>');
        try {
            const { data: historyData } = await this.safeFetch(`/user_exam_history?user_id=eq.${this.user.id}&order=created_at.desc`);

            let stats = {
                totalExams: historyData.length,
                bestScore: 0,
                avgScore: 0,
                totalTime: 0
            };

            if (historyData.length > 0) {
                const totalPct = historyData.reduce((acc, curr) => acc + (curr.score / curr.total_questions), 0);
                stats.avgScore = Math.round((totalPct / historyData.length) * 100);
                stats.bestScore = Math.round(Math.max(...historyData.map(h => h.score / h.total_questions)) * 100);
                stats.totalTime = Math.round(historyData.reduce((acc, curr) => acc + curr.time_taken_seconds, 0) / 60);
            }

            const historyRows = historyData.map((h, idx) => `
                <div class="card mt" style="padding:1rem;display:flex;justify-content:space-between;align-items:center; animation: slideUp ${0.4 + (idx * 0.05)}s ease">
                    <div>
                        <strong>${new Date(h.created_at).toLocaleDateString()}</strong>
                        <div class="q-meta"><span>${h.total_questions} Questions</span><span>${Math.round(h.time_taken_seconds / 60)}m taken</span></div>
                    </div>
                    <div style="display:flex; align-items:center; gap:1.5rem">
                        <div style="font-size:1.5rem;font-weight:800;color:var(--primary)">
                            ${Math.round((h.score / h.total_questions) * 100)}%
                        </div>
                        <button class="btn btn-outline" style="padding:0.5rem 1rem; font-size:0.8rem" onclick="app.renderExamReview(app._lastHistory[${idx}])">
                            <i data-lucide="eye"></i>Review
                        </button>
                    </div>
                </div>
            `).join('');

            this._lastHistory = historyData; // Cache for review

            this.setHTML(this.content, `
                <div class="hero">
                    <lottie-player src="https://lottie.host/ef0b3967-0c7f-4422-92fc-5fa8c9354045/L8zB31rT7m.json" background="transparent" speed="1" style="width: 150px; height: 150px;" loop autoplay></lottie-player>
                    <h1>Welcome, ${this.user.username}!</h1>
                    <p>Your Exam Performance Overview</p>
                </div>
                
                <div class="grid mt">
                    <div class="card stat-card">
                        <i data-lucide="award" style="color:var(--primary)"></i>
                        <div class="stat-label">Exams Taken</div>
                        <div class="stat-val">${stats.totalExams}</div>
                    </div>
                    <div class="card stat-card">
                        <i data-lucide="trending-up" style="color:var(--primary)"></i>
                        <div class="stat-label">Best Score</div>
                        <div class="stat-val">${stats.bestScore}%</div>
                    </div>
                    <div class="card stat-card">
                        <i data-lucide="bar-chart-2" style="color:var(--primary)"></i>
                        <div class="stat-label">Average Score</div>
                        <div class="stat-val">${stats.avgScore}%</div>
                    </div>
                    <div class="card stat-card">
                        <i data-lucide="hourglass" style="color:var(--primary)"></i>
                        <div class="stat-label">Total Minutes</div>
                        <div class="stat-val">${stats.totalTime}</div>
                    </div>
                </div>

                <h3 class="mt" style="margin-top:3rem"><i data-lucide="history" style="vertical-align:middle;margin-right:0.5rem"></i>Recent Attempts</h3>
                ${historyData.length > 0 ? historyRows : '<p class="mt" style="text-align:center;color:var(--text-muted)">No exams taken yet. Ready to start?</p>'}
                <div class="mt" style="text-align:center;padding-bottom:4rem">
                    <a href="/exam" class="btn mt"><i data-lucide="plus"></i>Start New Exam</a>
                </div>
            `);
        } catch (e) {
            console.error("Dashboard error:", e);
            this.setHTML(this.content, `<div class="card" style="border-color:var(--danger)"><h3>Dashboard Error</h3><p class="mt">${e.message}</p></div>`);
        }
    },

    // --- EXAM MODE ---
    exam: {
        active: false,
        questions: [],
        currentIndex: 0,
        answers: {},
        timeLeft: 0,
        timerId: null
    },

    renderExam() {
        if (this.exam.active) return this.showExamQuestion();

        this.setHTML(this.content,
            '<h2 class="mt">Exam Mode</h2>' +
            '<p style="color:var(--text-muted)">20 random questions. No instant feedback. 30 minutes timer.</p>' +
            '<div class="card mt">' +
            '<h3>Ready to start?</h3>' +
            '<div class="filter-bar mt">' +
            '<select id="ef-subject">' +
            '<option value="">All Subjects</option>' +
            '<option value="Maths">Maths</option>' +
            '<option value="Physics">Physics</option>' +
            '</select>' +
            '</div>' +
            '<button class="btn mt" onclick="app.startExam()">Start 30-Minute Exam</button>' +
            '</div>'
        );
    },

    async startExam() {
        const subjEl = document.getElementById('ef-subject');
        const subj = subjEl ? subjEl.value : '';
        this.setHTML(this.content, '<div class="loader"></div>');

        let seenIds = [];
        if (this.user) {
            try {
                const { data: hData } = await this.safeFetch(`/user_exam_history?user_id=eq.${this.user.id}&select=results`);
                hData.forEach(h => {
                    if (h.results && Array.isArray(h.results)) {
                        h.results.forEach(r => seenIds.push(r.qid));
                    }
                });
            } catch (e) {
                console.error("Failed to fetch history for deduplication:", e);
            }
        }

        let path = '/mcqs?select=*&limit=150';
        if (subj) path += `&subject=eq.${subj}`;

        try {
            const { data } = await this.safeFetch(path);
            if (!data || data.length === 0) throw new Error("No questions found");

            const unseen = data.filter(q => !seenIds.includes(q.id));

            if (unseen.length < 20) {
                const msg = unseen.length === 0
                    ? "Wow! You've attempted all available questions in this category. Start fresh or try a different subject."
                    : `Only ${unseen.length} new questions remain. We've started an exam with those.`;
                alert(msg);
                if (unseen.length === 0) {
                    this.renderExam();
                    return;
                }
            }

            const shuffled = ([...unseen]).sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, 20);

            this.exam = {
                active: true,
                questions: selected,
                currentIndex: 0,
                answers: {},
                timeLeft: 1800, // 30 mins
                timerId: setInterval(() => this.tickExam(), 1000)
            };
            this.showExamQuestion();
        } catch (e) {
            alert(e.message);
            this.renderExam();
        }
    },

    tickExam() {
        this.exam.timeLeft--;
        const timerEl = document.getElementById('exam-timer-val');
        if (timerEl) {
            const m = Math.floor(this.exam.timeLeft / 60);
            const s = this.exam.timeLeft % 60;
            timerEl.textContent = m + ':' + s.toString().padStart(2, '0');
        }
        if (this.exam.timeLeft <= 0) this.finishExam();
    },

    showExamQuestion() {
        const q = this.exam.questions[this.exam.currentIndex];
        const m = Math.floor(this.exam.timeLeft / 60);
        const s = this.exam.timeLeft % 60;

        let html = `
            <div style="display:flex;justify-content:space-between;align-items:center" class="mt">
                <h2>Question ${this.exam.currentIndex + 1} / ${this.exam.questions.length}</h2>
                <div class="exam-timer">Time Left: <span id="exam-timer-val">${m}:${s.toString().padStart(2, '0')}</span></div>
            </div>
            <div class="card mt">
                <h3>${q.question}</h3>
                <div class="q-meta"><span>${q.subject}</span><span>${q.difficulty}</span></div>
                <div id="options" style="margin-top:1.5rem">
        `;

        ['A', 'B', 'C', 'D'].forEach(key => {
            const text = q['option_' + key.toLowerCase()];
            const selected = this.exam.answers[this.exam.currentIndex] === key;
            html += `
                <button class="mcq-option ${selected ? 'correct-highlight' : ''}" onclick="app.saveExamAnswer('${key}')">
                    <strong>${key}.</strong> ${text}
                </button>
            `;
        });

        html += `
                </div>
                <div style="display:flex;justify-content:space-between" class="mt">
                    <button class="btn btn-outline" ${this.exam.currentIndex === 0 ? 'disabled' : ''} onclick="app.moveExam(-1)">Previous</button>
                    ${this.exam.currentIndex === this.exam.questions.length - 1 ?
                `<button class="btn" style="background:var(--success)" onclick="app.finishExam()">Submit & Finish</button>` :
                `<button class="btn" onclick="app.moveExam(1)">Next Question</button>`}
                </div>
            </div>
        `;

        this.setHTML(this.content, html);
    },

    saveExamAnswer(key) {
        this.exam.answers[this.exam.currentIndex] = key;
        const btns = document.querySelectorAll('#options .mcq-option');
        btns.forEach((btn, idx) => {
            btn.classList.toggle('correct-highlight', ['A', 'B', 'C', 'D'][idx] === key);
        });
    },

    moveExam(dir) {
        this.exam.currentIndex += dir;
        this.showExamQuestion();
    },

    finishExam() {
        if (this.exam.submitting) return;
        if (!confirm('Are you sure you want to finish and submit?')) return;

        this.exam.submitting = true;
        if (this.exam.timerId) clearInterval(this.exam.timerId);

        let correctCount = 0;
        const processedResults = this.exam.questions.map((q, i) => {
            const userAns = this.exam.answers[i] || null;
            const isCorrect = userAns === q.correct_answer;
            if (isCorrect) correctCount++;
            return {
                qid: q.id,
                question: q.question,
                user_ans: userAns,
                correct_ans: q.correct_answer,
                is_correct: isCorrect
            };
        });

        // Sort results for the immediate view: Wrong ones first
        const sortedResults = [...processedResults].sort((a, b) => (a.is_correct === b.is_correct) ? 0 : a.is_correct ? 1 : -1);

        let resultHtml = sortedResults.map((r, i) => `
            <div class="card mt" style="border-left: 4px solid ${r.is_correct ? 'var(--success)' : 'var(--danger)'}; animation: slideUp ${0.3 + (i * 0.05)}s ease">
                <p><strong>${r.question}</strong></p>
                <div class="mt" style="font-size:0.9rem">
                    <span style="color:${r.is_correct ? 'var(--success)' : 'var(--danger)'}">
                        Your Answer: ${r.user_ans || 'Not Answered'}
                    </span>
                    ${!r.is_correct ? ` | <span style="color:var(--success)">Correct: ${r.correct_ans}</span>` : ''}
                </div>
            </div>
        `).join('');

        const scorePct = Math.round((correctCount / this.exam.questions.length) * 100);

        // Save history if logged in
        if (this.user) {
            this.safeFetch('/user_exam_history', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.user.id,
                    score: correctCount,
                    total_questions: this.exam.questions.length,
                    time_taken_seconds: 1800 - this.exam.timeLeft,
                    results: processedResults
                }),
                headers: { 'Prefer': 'return=minimal' }
            })
                .then(() => { this.exam.submitting = false; })
                .catch(e => {
                    console.error("Failed to save history:", e);
                    this.exam.submitting = false;
                });
        } else {
            this.exam.submitting = false;
        }

        this.setHTML(this.content,
            `<div class="hero">
                <h1>Exam Results</h1>
                <div class="stat-val" style="font-size:4rem">${scorePct}%</div>
                <p>${correctCount} / ${this.exam.questions.length} Correct</p>
            </div>
            <div class="mt">
                <a href="/exam" class="btn" onclick="app.exam.active=false">Return to Exam Home</a>
            </div>
            <h3 class="mt" style="margin-top:2rem">Review Questions</h3>
            ${resultHtml}
            <div class="mt" style="padding-bottom:4rem">
                 <a href="/exam" class="btn" onclick="app.exam.active=false">Return to Exam Home</a>
            </div>`
        );
        this.exam.active = false;
    },

    renderExamReview(historyItem) {
        if (!historyItem || !historyItem.results) return;

        // Sort results: Incorrect first
        const sorted = [...historyItem.results].sort((a, b) => (a.is_correct === b.is_correct) ? 0 : a.is_correct ? 1 : -1);

        const resultsHtml = sorted.map((r, i) => `
            <div class="card mt" style="border-left: 4px solid ${r.is_correct ? 'var(--success)' : 'var(--danger)'}; animation: slideUp ${0.3 + (i * 0.05)}s ease">
                <p><strong>${r.question}</strong></p>
                <div class="mt" style="font-size:0.9rem">
                    <span style="color:${r.is_correct ? 'var(--success)' : 'var(--danger)'}">
                        Your Answer: ${r.user_ans || 'Not Answered'}
                    </span>
                    ${!r.is_correct ? ` | <span style="color:var(--success)">Correct: ${r.correct_ans}</span>` : ''}
                </div>
            </div>
        `).join('');

        this.setHTML(this.content, `
            <div class="hero">
                <i data-lucide="history" style="width:48px; height:48px; color:var(--primary); margin-bottom:1rem"></i>
                <h1>Exam Review</h1>
                <p>${new Date(historyItem.created_at).toLocaleDateString()} - Score: ${Math.round((historyItem.score / historyItem.total_questions) * 100)}%</p>
            </div>
            <div class="mt">
                <button class="btn btn-outline" onclick="app.renderDashboard()"><i data-lucide="arrow-left"></i>Back to Dashboard</button>
            </div>
            <h3 class="mt" style="margin-top:2.5rem">Detailed Breakdown</h3>
            ${resultsHtml}
            <div class="mt" style="padding-bottom:5rem; text-align:center">
                <button class="btn" onclick="app.renderDashboard()"><i data-lucide="arrow-left"></i>Back to Dashboard</button>
            </div>
        `);
    }
};

app.init();
