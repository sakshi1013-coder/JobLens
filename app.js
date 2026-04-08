/**
 * JobLens App — Main Application Controller
 */

(function () {
    'use strict';

    // ===== STATE =====
    let currentResult = null;
    let applications = JSON.parse(localStorage.getItem('joblens_apps') || '[]');

    // ===== DOM REFERENCES =====
    const $ = (id) => document.getElementById(id);
    const $$ = (sel) => document.querySelectorAll(sel);

    const els = {
        // Nav
        navAnalyzer: $('nav-analyzer'),
        navTracker: $('nav-tracker'),
        viewAnalyzer: $('view-analyzer'),
        viewTracker: $('view-tracker'),
        trackerCount: $('tracker-count'),

        // Input
        jobInput: $('job-input'),
        charCount: $('char-count'),
        btnAnalyze: $('btn-analyze'),
        btnPaste: $('btn-paste'),
        btnClear: $('btn-clear'),
        btnSample: $('btn-sample'),

        // Loading
        loadingSection: $('loading-section'),
        loadingText: $('loading-text'),
        stepExtract: $('step-extract'),
        stepSkills: $('step-skills'),
        stepResume: $('step-resume'),

        // Results
        resultsSection: $('results-section'),
        inputSection: $('input-section'),
        heroSection: $('hero-section'),
        valCompany: $('val-company'),
        valRole: $('val-role'),
        valSeniority: $('val-seniority'),
        valLocation: $('val-location'),
        requiredSkillsList: $('required-skills-list'),
        niceSkillsList: $('nice-skills-list'),
        requiredCount: $('required-count'),
        niceCount: $('nice-count'),
        resumeList: $('resume-list'),
        btnCopyResume: $('btn-copy-resume'),
        btnJson: $('btn-json'),
        btnSave: $('btn-save'),
        btnNewAnalysis: $('btn-new-analysis'),

        // Modal
        jsonModal: $('json-modal'),
        jsonOutput: $('json-output'),
        btnCloseModal: $('btn-close-modal'),
        btnCopyJson: $('btn-copy-json'),

        // Tracker
        trackerSearch: $('tracker-search'),
        filterStatus: $('filter-status'),
        trackerList: $('tracker-list'),
        emptyTracker: $('empty-tracker'),
        btnGoAnalyze: $('btn-go-analyze'),
        tstatTotal: $('tstat-total'),
        tstatApplied: $('tstat-applied'),
        tstatInterview: $('tstat-interview'),
        tstatOffer: $('tstat-offer'),

        // Toast
        toast: $('toast'),
        toastText: $('toast-text'),
    };

    // ===== SAMPLE JOB DESCRIPTION =====
    const SAMPLE_JD = `Senior Frontend Engineer — Acme Corp

Location: San Francisco, CA (Hybrid)

About Acme Corp:
Acme Corp is a fast-growing fintech startup building the next generation of payment infrastructure. We serve over 50,000 businesses worldwide and process billions in transactions annually.

About the Role:
We're looking for a Senior Frontend Engineer to join our Platform team. You'll be responsible for building beautiful, performant user interfaces that power our merchant dashboard and developer tools.

Requirements:
• 5+ years of professional experience in frontend development
• Expert-level proficiency in React and TypeScript
• Strong understanding of HTML, CSS, and responsive design principles
• Experience with state management libraries (Redux, Zustand, or similar)
• Proficiency with RESTful APIs and GraphQL
• Experience with testing frameworks (Jest, Playwright, or Cypress)
• Strong understanding of web performance optimization
• Experience with Git and CI/CD pipelines
• Excellent communication and collaboration skills

Nice to Have:
• Experience with Next.js or similar SSR frameworks
• Familiarity with design systems (Storybook, Figma)
• Experience with WebGL or Three.js for data visualization
• Knowledge of accessibility standards (WCAG)
• Experience mentoring junior developers
• Exposure to backend technologies (Node.js, Python)

What We Offer:
• Competitive salary ($180K - $230K) + equity
• Comprehensive health, dental, and vision insurance
• Flexible PTO and remote work options
• Learning & development budget
• Team offsites and company events

Acme Corp is an equal opportunity employer.`;

    // ===== NAVIGATION =====
    function switchView(viewName) {
        $$('.nav-tab').forEach(t => t.classList.remove('active'));
        $$('.view').forEach(v => v.classList.remove('active'));

        if (viewName === 'analyzer') {
            els.navAnalyzer.classList.add('active');
            els.viewAnalyzer.classList.add('active');
        } else {
            els.navTracker.classList.add('active');
            els.viewTracker.classList.add('active');
            renderTracker();
        }
    }

    els.navAnalyzer.addEventListener('click', () => switchView('analyzer'));
    els.navTracker.addEventListener('click', () => switchView('tracker'));

    // ===== INPUT HANDLING =====
    els.jobInput.addEventListener('input', () => {
        const len = els.jobInput.value.length;
        els.charCount.textContent = `${len.toLocaleString()} character${len !== 1 ? 's' : ''}`;
    });

    els.btnPaste.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            els.jobInput.value = text;
            els.jobInput.dispatchEvent(new Event('input'));
            showToast('Pasted from clipboard');
        } catch {
            showToast('Unable to access clipboard');
        }
    });

    els.btnClear.addEventListener('click', () => {
        els.jobInput.value = '';
        els.jobInput.dispatchEvent(new Event('input'));
    });

    els.btnSample.addEventListener('click', () => {
        els.jobInput.value = SAMPLE_JD;
        els.jobInput.dispatchEvent(new Event('input'));
        showToast('Sample loaded');
    });

    // Go to analyze from tracker
    if (els.btnGoAnalyze) {
        els.btnGoAnalyze.addEventListener('click', () => switchView('analyzer'));
    }

    // ===== ANALYSIS =====
    els.btnAnalyze.addEventListener('click', runAnalysis);

    // Allow cmd+enter to analyze
    els.jobInput.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            runAnalysis();
        }
    });

    async function runAnalysis() {
        const text = els.jobInput.value.trim();
        if (!text) {
            showToast('Please paste a job description first');
            els.jobInput.focus();
            return;
        }

        // Show loading
        els.inputSection.classList.add('hidden');
        els.heroSection.classList.add('hidden');
        els.resultsSection.classList.add('hidden');
        els.loadingSection.classList.remove('hidden');

        // Animate loading steps
        const steps = [els.stepExtract, els.stepSkills, els.stepResume];
        steps.forEach(s => { s.className = 'loading-step'; });

        await delay(300);
        steps[0].classList.add('active');
        els.loadingText.textContent = 'Extracting key information...';

        await delay(800);
        steps[0].classList.remove('active');
        steps[0].classList.add('done');
        steps[1].classList.add('active');
        els.loadingText.textContent = 'Identifying skills & requirements...';

        await delay(700);
        steps[1].classList.remove('active');
        steps[1].classList.add('done');
        steps[2].classList.add('active');
        els.loadingText.textContent = 'Generating resume suggestions...';

        // Parse
        currentResult = JobParser.parse(text);

        await delay(600);
        steps[2].classList.remove('active');
        steps[2].classList.add('done');
        els.loadingText.textContent = 'Done!';

        await delay(400);

        // Show results
        els.loadingSection.classList.add('hidden');
        renderResults(currentResult);
        els.resultsSection.classList.remove('hidden');

        window.scrollTo({ top: els.resultsSection.offsetTop - 80, behavior: 'smooth' });
    }

    // ===== RENDER RESULTS =====
    function renderResults(data) {
        // Stats
        els.valCompany.textContent = data.company_name || '—';
        els.valRole.textContent = data.role || '—';
        els.valSeniority.textContent = data.seniority_level || '—';
        els.valLocation.textContent = data.location || '—';

        // Required skills
        els.requiredCount.textContent = data.required_skills.length;
        if (data.required_skills.length > 0) {
            els.requiredSkillsList.innerHTML = data.required_skills
                .map((s, i) => `<span class="skill-tag required" style="animation-delay: ${i * 0.04}s">${escapeHtml(s)}</span>`)
                .join('');
        } else {
            els.requiredSkillsList.innerHTML = '<div class="empty-state">No required skills detected</div>';
        }

        // Nice to have
        els.niceCount.textContent = data.nice_to_have_skills.length;
        if (data.nice_to_have_skills.length > 0) {
            els.niceSkillsList.innerHTML = data.nice_to_have_skills
                .map((s, i) => `<span class="skill-tag nice" style="animation-delay: ${i * 0.04}s">${escapeHtml(s)}</span>`)
                .join('');
        } else {
            els.niceSkillsList.innerHTML = '<div class="empty-state">No preferred skills detected</div>';
        }

        // Resume suggestions
        if (data.resume_suggestions.length > 0) {
            els.resumeList.innerHTML = data.resume_suggestions
                .map((s, i) => `
                    <div class="resume-item" style="animation-delay: ${i * 0.08}s">
                        <div class="resume-bullet"></div>
                        <div class="resume-text">${escapeHtml(s)}</div>
                    </div>
                `).join('');
        } else {
            els.resumeList.innerHTML = '<div class="empty-state">Unable to generate suggestions</div>';
        }
    }

    // ===== ACTIONS =====
    els.btnJson.addEventListener('click', () => {
        if (!currentResult) return;
        els.jsonOutput.innerHTML = syntaxHighlightJSON(JSON.stringify(currentResult, null, 2));
        els.jsonModal.classList.remove('hidden');
    });

    els.btnCloseModal.addEventListener('click', () => {
        els.jsonModal.classList.add('hidden');
    });

    els.jsonModal.addEventListener('click', (e) => {
        if (e.target === els.jsonModal) {
            els.jsonModal.classList.add('hidden');
        }
    });

    els.btnCopyJson.addEventListener('click', () => {
        if (!currentResult) return;
        copyToClipboard(JSON.stringify(currentResult, null, 2));
        showToast('JSON copied to clipboard');
    });

    els.btnCopyResume.addEventListener('click', () => {
        if (!currentResult || !currentResult.resume_suggestions.length) return;
        const text = currentResult.resume_suggestions.map(s => `• ${s}`).join('\n');
        copyToClipboard(text);
        showToast('Resume bullets copied');
    });

    els.btnSave.addEventListener('click', () => {
        if (!currentResult) return;

        const app = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            ...currentResult,
            status: 'saved',
            savedAt: new Date().toISOString(),
            jobDescription: els.jobInput.value.trim().slice(0, 500),
        };

        applications.unshift(app);
        saveApplications();
        updateTrackerCount();
        showToast('Saved to tracker!');
    });

    els.btnNewAnalysis.addEventListener('click', () => {
        currentResult = null;
        els.resultsSection.classList.add('hidden');
        els.inputSection.classList.remove('hidden');
        els.heroSection.classList.remove('hidden');
        els.jobInput.value = '';
        els.jobInput.dispatchEvent(new Event('input'));
        els.jobInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== TRACKER =====
    function renderTracker() {
        updateTrackerStats();
        const search = els.trackerSearch.value.toLowerCase();
        const status = els.filterStatus.value;

        let filtered = applications;
        if (search) {
            filtered = filtered.filter(a =>
                (a.company_name || '').toLowerCase().includes(search) ||
                (a.role || '').toLowerCase().includes(search) ||
                (a.required_skills || []).some(s => s.toLowerCase().includes(search))
            );
        }
        if (status !== 'all') {
            filtered = filtered.filter(a => a.status === status);
        }

        if (filtered.length === 0) {
            els.trackerList.innerHTML = '';
            els.trackerList.appendChild(createEmptyTracker());
            return;
        }

        els.trackerList.innerHTML = filtered.map((app, i) => createAppCard(app, i)).join('');

        // Bind events
        els.trackerList.querySelectorAll('.status-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const app = applications.find(a => a.id === id);
                if (app) {
                    app.status = e.target.value;
                    e.target.className = `status-select status-${app.status}`;
                    saveApplications();
                    updateTrackerStats();
                }
            });
        });

        els.trackerList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                applications = applications.filter(a => a.id !== id);
                saveApplications();
                updateTrackerCount();
                renderTracker();
                showToast('Application removed');
            });
        });
    }

    function createAppCard(app, idx) {
        const skills = (app.required_skills || []).slice(0, 4);
        const date = app.savedAt ? new Date(app.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

        return `
        <div class="app-card glass-card" style="animation-delay: ${idx * 0.05}s">
            <div class="app-info">
                <div class="app-role">${escapeHtml(app.role || 'Unknown Role')}</div>
                <div class="app-meta">
                    ${app.company_name ? `<span class="app-company">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/></svg>
                        ${escapeHtml(app.company_name)}
                    </span>` : ''}
                    ${app.location ? `<span class="app-location">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${escapeHtml(app.location)}
                    </span>` : ''}
                    ${date ? `<span class="app-date">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${date}
                    </span>` : ''}
                </div>
                ${skills.length > 0 ? `
                <div class="app-skills">
                    ${skills.map(s => `<span class="app-skill-tag">${escapeHtml(s)}</span>`).join('')}
                    ${(app.required_skills || []).length > 4 ? `<span class="app-skill-tag">+${(app.required_skills || []).length - 4}</span>` : ''}
                </div>` : ''}
            </div>
            <div class="app-actions">
                <select class="status-select status-${app.status}" data-id="${app.id}">
                    <option value="saved" ${app.status === 'saved' ? 'selected' : ''}>Saved</option>
                    <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
                    <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>Interview</option>
                    <option value="offer" ${app.status === 'offer' ? 'selected' : ''}>Offer</option>
                    <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
                <button class="btn-delete" data-id="${app.id}" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        </div>`;
    }

    function createEmptyTracker() {
        const div = document.createElement('div');
        div.className = 'empty-tracker';
        div.innerHTML = `
            <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </div>
            <h3>No results found</h3>
            <p>Try adjusting your search or filters.</p>
        `;
        return div;
    }

    function updateTrackerStats() {
        els.tstatTotal.textContent = applications.length;
        els.tstatApplied.textContent = applications.filter(a => a.status === 'applied').length;
        els.tstatInterview.textContent = applications.filter(a => a.status === 'interview').length;
        els.tstatOffer.textContent = applications.filter(a => a.status === 'offer').length;
    }

    function updateTrackerCount() {
        els.trackerCount.textContent = applications.length;
    }

    els.trackerSearch.addEventListener('input', renderTracker);
    els.filterStatus.addEventListener('change', renderTracker);

    // ===== PERSISTENCE =====
    function saveApplications() {
        localStorage.setItem('joblens_apps', JSON.stringify(applications));
        updateTrackerCount();
    }

    // ===== UTILITIES =====
    function delay(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    function escapeHtml(str) {
        const el = document.createElement('span');
        el.textContent = str;
        return el.innerHTML;
    }

    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    }

    function showToast(message) {
        els.toastText.textContent = message;
        els.toast.classList.remove('hidden');
        els.toast.classList.add('show');
        clearTimeout(els.toast._timer);
        els.toast._timer = setTimeout(() => {
            els.toast.classList.remove('show');
            setTimeout(() => els.toast.classList.add('hidden'), 300);
        }, 2500);
    }

    function syntaxHighlightJSON(json) {
        return json.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
                (match) => {
                    let cls = 'json-number';
                    if (/^"/.test(match)) {
                        cls = /:$/.test(match) ? 'json-key' : 'json-string';
                    } else if (/true|false/.test(match)) {
                        cls = 'json-string';
                    } else if (/null/.test(match)) {
                        cls = 'json-null';
                    }
                    return `<span class="${cls}">${match}</span>`;
                }
            );
    }

    // Keyboard shortcut: Escape to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            els.jsonModal.classList.add('hidden');
        }
    });

    // ===== INIT =====
    updateTrackerCount();
})();
