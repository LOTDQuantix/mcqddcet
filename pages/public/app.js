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

    init() {
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
            // Supabase returns results as arrays for selects
            return await response.json();
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
                    // MathML tags for KaTeX resilience
                    'math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn', 'mtext'
                ],
                ADD_ATTR: ['onclick', 'data-key', 'data-correct', 'style', 'class', 'href', 'target', 'aria-hidden']
            });
            el.innerHTML = clean;
        }
    },

    route() {
        const path = window.location.pathname;
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === path);
        });

        if (path === '/') this.renderHome();
        else if (path === '/practice') this.renderPractice();
        else if (path === '/exam') this.renderExam();
        else if (path === '/browse') this.renderBrowse();
        else if (path === '/admin') this.renderAdmin();
        else if (path.startsWith('/batch/')) this.renderBatchDetails(path.split('/').pop());
        else this.setHTML(this.content, '<div style="text-align:center;padding:4rem"><h1 style="font-size:4rem">404</h1><p>Page not found</p><a href="/" class="btn mt">Home</a></div>');
    },

    renderHome() {
        this.setHTML(this.content, '<div class="loader"></div>');

        // Fetch stats from Supabase directly
        Promise.all([
            this.safeFetch('/mcqs?select=id', { headers: { 'Prefer': 'count=exact', 'Range': '0-0' } }),
            this.safeFetch('/mcqs?subject=eq.Maths&select=id', { headers: { 'Prefer': 'count=exact', 'Range': '0-0' } }),
            this.safeFetch('/mcqs?subject=eq.Physics&select=id', { headers: { 'Prefer': 'count=exact', 'Range': '0-0' } })
        ]).then(([total, maths, physics]) => {
            const stats = {
                total: total.length === 0 ? 0 : (total.length), // Placeholder if count header not parsed
                Maths: maths.length === 0 ? 0 : 0,
                Physics: physics.length === 0 ? 0 : 0
            };

            // Note: In real fetch, we would read the 'Content-Range' header for exact counts. 
            // For simplicity in this demo, we'll try to find metadata or just show the total.
            this.setHTML(this.content,
                '<div class="hero">' +
                '<h1>DDCET MCQ Practice</h1>' +
                '<p>Conceptual MCQs for Maths & Physics. Practice directly with Supabase.</p>' +
                '<div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">' +
                '<a href="/practice" class="btn">Practice Mode</a>' +
                '<a href="/exam" class="btn btn-outline" style="border-color:var(--danger);color:var(--danger)">Exam Mode (Timed)</a>' +
                '<a href="/browse" class="btn btn-outline">Browse All</a>' +
                '</div>' +
                '</div>' +
                '<div class="grid">' +
                '<div class="card" style="text-align:center">' +
                '<div class="stat-label">Database Connected</div>' +
                '<div class="stat-val" style="font-size:1.5rem">SUPABASE REST</div>' +
                '<p class="mt" style="font-size:0.8rem;color:var(--text-muted)">Read-only access enabled</p>' +
                '</div>' +
                '<div class="card" style="text-align:center">' +
                '<div class="stat-label">Maths & Physics</div>' +
                '<div class="stat-val">Live</div>' +
                '</div>' +
                '<div class="card" style="text-align:center">' +
                '<div class="stat-label">Platform Status</div>' +
                '<div class="stat-val" style="color:var(--success)">Decoupled</div>' +
                '</div>' +
                '</div>');
        }).catch(e => {
            this.setHTML(this.content, '<div class="card" style="border-color:red"><h3>Supabase Connection Error</h3><p class="mt">' + e.message + '</p></div>');
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
        this.setHTML(area, '<div class="loader"></div>');

        var subj = document.getElementById('pf-subject').value;
        var diff = document.getElementById('pf-difficulty').value;

        // PostgREST doesn't have a direct random helper. 
        // We fetch a batch of 20 and pick one that hasn't been seen.
        let path = '/mcqs?select=*&limit=20';
        if (subj) path += `&subject=eq.${subj}`;
        if (diff) path += `&difficulty=eq.${diff}`;

        this.safeFetch(path)
            .then(data => {
                if (!data || data.length === 0) throw new Error("No questions found");

                // Pick one random question from the batch that isn't in seen list
                const unseen = data.filter(q => !this.score.seen.includes(q.id));
                const q = unseen.length > 0
                    ? unseen[Math.floor(Math.random() * unseen.length)]
                    : data[Math.floor(Math.random() * data.length)];

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
                opts.forEach(function (o) {
                    html += '<button class="mcq-option" data-key="' + o.key + '" data-correct="' + q.correct_answer + '" onclick="app.selectAnswer(this)">' +
                        '<strong>' + o.key + '.</strong> ' + o.text +
                        '</button>';
                });
                html += '</div>' +
                    '<div id="feedback" class="hidden mt"></div>' +
                    '<button id="next-btn" class="btn mt hidden" onclick="app.loadQuestion()">Next Question →</button>' +
                    '</div>';
                this.setHTML(area, html);
            })
            .catch(e => {
                this.setHTML(area, '<div class="card" style="border-color:red"><p>Error loading question: ' + e.message + '</p></div>');
            });
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
            .then(data => {
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

    renderAdmin() {
        this.setHTML(this.content,
            '<h2 class="mt">Admin Tools</h2>' +
            '<p style="color:var(--text-muted)">Generation is now handled via local scripts only.</p>' +
            '<div class="card mt">' +
            '<h3>Worker-less Architecture</h3>' +
            '<p class="mt" style="font-size:0.9rem">The Cloudflare Worker has been removed. You are connecting directly to Supabase REST API.</p>' +
            '<div class="mt" style="padding:1rem;background:rgba(0,188,212,0.1);border-radius:8px">' +
            '<code style="color:var(--primary)">Architecture: Pages $\to$ Supabase REST</code>' +
            '</div>' +
            '</div>'
        );
    },

    triggerGen() {
        alert('Remote generation is disabled. Please use "npm run generate" locally instead.');
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
            '<p style="color:var(--text-muted)">20 random questions. No instant feedback. 20 minutes timer.</p>' +
            '<div class="card mt">' +
            '<h3>Ready to start?</h3>' +
            '<div class="filter-bar mt">' +
            '<select id="ef-subject">' +
            '<option value="">All Subjects</option>' +
            '<option value="Maths">Maths</option>' +
            '<option value="Physics">Physics</option>' +
            '</select>' +
            '</div>' +
            '<button class="btn mt" onclick="app.startExam()">Start 20-Minute Exam</button>' +
            '</div>'
        );
    },

    async startExam() {
        this.setHTML(this.content, '<div class="loader"></div>');
        const subj = document.getElementById('ef-subject').value;

        let path = '/mcqs?select=*&limit=20';
        if (subj) path += `&subject=eq.${subj}`;

        try {
            const data = await this.safeFetch(path);
            if (!data || data.length === 0) throw new Error("No questions found");

            this.exam = {
                active: true,
                questions: data.sort(() => Math.random() - 0.5),
                currentIndex: 0,
                answers: {},
                timeLeft: 1200, // 20 mins
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

        let html = '<div style="display:flex;justify-content:space-between;align-items:center" class="mt">' +
            '<h2>Question ' + (this.exam.currentIndex + 1) + ' / ' + this.exam.questions.length + '</h2>' +
            '<div class="exam-timer">Time Left: <span id="exam-timer-val">' + m + ':' + s.toString().padStart(2, '0') + '</span></div>' +
            '</div>' +
            '<div class="card mt">' +
            '<h3>' + q.question + '</h3>' +
            '<div class="q-meta"><span>' + q.subject + '</span><span>' + q.difficulty + '</span></div>' +
            '<div id="options" style="margin-top:1.5rem">';

        ['A', 'B', 'C', 'D'].forEach(key => {
            const text = q['option_' + key.toLowerCase()];
            const selected = this.exam.answers[this.exam.currentIndex] === key;
            html += '<button class="mcq-option ' + (selected ? 'correct-highlight' : '') + '" onclick="app.saveExamAnswer(\'' + key + '\')">' +
                '<strong>' + key + '.</strong> ' + text +
                '</button>';
        });

        html += '</div>' +
            '<div style="display:flex;justify-content:space-between" class="mt">' +
            '<button class="btn btn-outline" ' + (this.exam.currentIndex === 0 ? 'disabled' : '') + ' onclick="app.moveExam(-1)">Previous</button>' +
            (this.exam.currentIndex === this.exam.questions.length - 1 ?
                '<button class="btn" onclick="app.finishExam()">Finish Exam</button>' :
                '<button class="btn" onclick="app.moveExam(1)">Next Question</button>') +
            '</div>' +
            '</div>';

        this.setHTML(this.content, html);
    },

    saveExamAnswer(key) {
        this.exam.answers[this.exam.currentIndex] = key;
        this.showExamQuestion();
    },

    moveExam(dir) {
        this.exam.currentIndex += dir;
        this.showExamQuestion();
    },

    finishExam() {
        if (this.exam.timerId) clearInterval(this.exam.timerId);
        let correctCount = 0;
        this.exam.questions.forEach((q, i) => {
            if (this.exam.answers[i] === q.correct_answer) correctCount++;
        });

        const score = Math.round((correctCount / this.exam.questions.length) * 100);
        this.setHTML(this.content,
            '<div class="hero"><h1>Exam Result</h1><p>You have successfully completed the exam.</p></div>' +
            '<div class="card" style="text-align:center">' +
            '<div class="stat-label">Your Score</div>' +
            '<div class="stat-val">' + score + '%</div>' +
            '<p class="mt">' + correctCount + ' correct out of ' + this.exam.questions.length + ' questions.</p>' +
            '<a href="/exam" class="btn mt" onclick="app.exam.active=false;app.renderExam()">Try Again</a>' +
            '</div>'
        );
        this.exam.active = false;
    }
};

app.init();
