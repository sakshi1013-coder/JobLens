/**
 * JobLens Parser — Intelligent Job Description Analyzer
 * Extracts structured data from free-text job descriptions.
 */

const JobParser = (() => {

    // ===== KNOWN SKILL CATALOG =====
    const SKILL_CATALOG = {
        languages: [
            'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'C',
            'Go', 'Golang', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala',
            'R', 'Perl', 'Dart', 'Elixir', 'Haskell', 'Lua', 'MATLAB',
            'Objective-C', 'Shell', 'Bash', 'SQL', 'HTML', 'CSS', 'SASS', 'LESS'
        ],
        frameworks: [
            'React', 'React.js', 'ReactJS', 'Angular', 'AngularJS', 'Vue', 'Vue.js', 'VueJS',
            'Next.js', 'NextJS', 'Nuxt.js', 'NuxtJS', 'Svelte', 'SvelteKit',
            'Node.js', 'NodeJS', 'Express', 'Express.js', 'NestJS', 'Nest.js',
            'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot',
            'Rails', 'Ruby on Rails', 'Laravel', 'Symfony',
            '.NET', 'ASP.NET', 'Blazor', 'Entity Framework',
            'jQuery', 'Bootstrap', 'Tailwind', 'TailwindCSS',
            'Material UI', 'MUI', 'Chakra UI', 'Ant Design',
            'Redux', 'MobX', 'Zustand', 'Recoil', 'Vuex', 'Pinia',
            'GraphQL', 'Apollo', 'Relay',
            'Flutter', 'React Native', 'Ionic', 'Xamarin', 'SwiftUI',
            'Electron', 'Tauri',
            'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy',
            'Hadoop', 'Spark', 'Apache Kafka', 'Kafka',
            'Three.js', 'D3.js', 'WebGL',
            'Playwright', 'Cypress', 'Selenium', 'Jest', 'Mocha', 'Pytest',
            'Storybook'
        ],
        tools: [
            'Docker', 'Kubernetes', 'K8s', 'Terraform', 'Ansible', 'Puppet', 'Chef',
            'Jenkins', 'GitHub Actions', 'CircleCI', 'Travis CI', 'GitLab CI',
            'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP',
            'Firebase', 'Supabase', 'Vercel', 'Netlify', 'Heroku',
            'MongoDB', 'PostgreSQL', 'Postgres', 'MySQL', 'Redis', 'Elasticsearch',
            'DynamoDB', 'Cassandra', 'CouchDB', 'MariaDB', 'SQLite',
            'Git', 'GitHub', 'GitLab', 'Bitbucket',
            'Jira', 'Confluence', 'Trello', 'Asana', 'Linear',
            'Figma', 'Sketch', 'Adobe XD', 'InVision',
            'Webpack', 'Vite', 'Rollup', 'Parcel', 'esbuild',
            'Nginx', 'Apache', 'Caddy',
            'RabbitMQ', 'NATS', 'gRPC', 'REST', 'RESTful',
            'GraphQL', 'Prisma', 'Sequelize', 'TypeORM', 'Mongoose',
            'Datadog', 'New Relic', 'Grafana', 'Prometheus', 'Splunk',
            'Snowflake', 'BigQuery', 'Redshift', 'Airflow',
            'OpenAI', 'LangChain', 'Hugging Face',
            'Stripe', 'Twilio', 'SendGrid',
            'Linux', 'Unix', 'Windows Server',
            'CI/CD', 'DevOps', 'IaC',
            'S3', 'EC2', 'Lambda', 'ECS', 'EKS', 'CloudFormation',
            'npm', 'yarn', 'pnpm'
        ],
        concepts: [
            'Machine Learning', 'Deep Learning', 'NLP', 'Natural Language Processing',
            'Computer Vision', 'AI', 'Artificial Intelligence', 'LLM',
            'Microservices', 'Monolith', 'Serverless', 'Event-Driven',
            'API Design', 'System Design', 'Distributed Systems',
            'Data Structures', 'Algorithms', 'OOP', 'Object-Oriented',
            'Functional Programming', 'Design Patterns', 'SOLID',
            'TDD', 'Test-Driven Development', 'BDD', 'Unit Testing',
            'Agile', 'Scrum', 'Kanban', 'Sprint',
            'OAuth', 'JWT', 'SSO', 'SAML', 'Authentication', 'Authorization',
            'Security', 'Cybersecurity', 'Encryption', 'OWASP',
            'Performance', 'Optimization', 'Caching', 'CDN',
            'SEO', 'Accessibility', 'a11y', 'WCAG', 'i18n', 'Internationalization',
            'Responsive Design', 'Mobile-First', 'Cross-Browser',
            'Data Modeling', 'ETL', 'Data Pipeline', 'Data Engineering',
            'Cloud Architecture', 'Scalability', 'High Availability',
            'Monitoring', 'Observability', 'Logging', 'Alerting',
            'Containerization', 'Orchestration', 'Infrastructure',
            'Version Control', 'Code Review', 'Pair Programming',
            'Technical Writing', 'Documentation',
            'Leadership', 'Mentoring', 'Stakeholder Management',
            'Product Management', 'Project Management'
        ]
    };

    // Flatten catalog for matching
    const ALL_SKILLS = [
        ...SKILL_CATALOG.languages,
        ...SKILL_CATALOG.frameworks,
        ...SKILL_CATALOG.tools,
        ...SKILL_CATALOG.concepts
    ];

    // ===== SENIORITY PATTERNS =====
    const SENIORITY_MAP = [
        { level: 'Intern', patterns: [/\bintern\b/i, /\binternship\b/i, /\bco-?op\b/i] },
        { level: 'Junior', patterns: [/\bjunior\b/i, /\bjr\.?\b/i, /\bentry[\s-]?level\b/i, /\bnew\s+grad\b/i, /\b0[\s-]?[–-][\s-]?2\s+years?\b/i] },
        { level: 'Mid', patterns: [/\bmid[\s-]?level\b/i, /\bmid[\s-]?senior\b/i, /\b[2-4][\s-]?[–-][\s-]?[5-6]\s+years?\b/i, /\b3\+?\s+years?\b/i, /\b4\+?\s+years?\b/i, /\b5\+?\s+years?\b/i] },
        { level: 'Senior', patterns: [/\bsenior\b/i, /\bsr\.?\b/i, /\b[5-9]\+?\s+years?\b/i, /\b[1-9]\d\+?\s+years?\b/i, /\bstaff\b/i, /\bprincipal\b/i] },
        { level: 'Lead', patterns: [/\blead\b/i, /\btech\s*lead\b/i, /\bteam\s*lead\b/i, /\barchitect\b/i, /\bhead\s+of\b/i, /\bdirector\b/i, /\bmanager\b/i, /\bvp\b/i] }
    ];

    // ===== LOCATION PATTERNS =====
    const LOCATION_PATTERNS = [
        /(?:location|based\s+in|located\s+in|office\s+in|headquarters?\s+in|based\s+out\s+of)[:\s]+([^\n.;]{3,80})/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*(?:[A-Z]{2}|[A-Z][a-z]+)(?:\s*\((?:Remote|Hybrid|On[\s-]?site)\))?)/,
        /\b((?:San\s+Francisco|New\s+York|Los\s+Angeles|Chicago|Seattle|Austin|Boston|Denver|Portland|Atlanta|Dallas|Houston|Miami|Phoenix|Philadelphia|San\s+Diego|San\s+Jose|Washington\s+D\.?C\.?|Toronto|Vancouver|London|Berlin|Amsterdam|Paris|Singapore|Sydney|Melbourne|Mumbai|Bangalore|Bengaluru|Hyderabad|Delhi|Pune|Tokyo|Dubai)(?:[\s,]*(?:[A-Z]{2})?)?(?:\s*\((?:Remote|Hybrid)\))?)/,
    ];

    const REMOTE_PATTERNS = [
        /\b(?:fully\s+)?remote\b/i,
        /\bwork\s+from\s+(?:home|anywhere)\b/i,
        /\bremote[\s-]?first\b/i,
        /\b100%\s+remote\b/i,
    ];

    const HYBRID_PATTERN = /\bhybrid\b/i;

    // ===== SECTION DETECTION =====
    const REQUIRED_SECTION_PATTERNS = [
        /(?:requirements?|required|qualifications?|must[\s-]?have|minimum\s+qualifications?|what\s+you(?:'ll)?\s+(?:need|bring)|what\s+we(?:'re)?\s+looking\s+for|key\s+skills|essential|responsibilities)/i
    ];

    const NICE_SECTION_PATTERNS = [
        /(?:nice[\s-]?to[\s-]?have|preferred|bonus|plus|desired|additional|good[\s-]?to[\s-]?have|ideal(?:ly)?|not\s+required\s+but|extra\s+credit|preferred\s+qualifications?)/i
    ];

    // ===== ROLE PATTERNS =====
    const ROLE_TITLE_REGEX = /\b((?:Senior|Junior|Lead|Staff|Principal|Mid[\s-]?Level|Entry[\s-]?Level|Head)?\s*(?:Software|Frontend|Backend|Full[\s-]?Stack|DevOps|Cloud|Data|ML|AI|Mobile|iOS|Android|QA|Test|Security|Platform|Infrastructure|Site\s+Reliability|SRE|Product|Project|Engineering|UX|UI|UX\/UI)\s*(?:Engineer|Developer|Architect|Designer|Manager|Analyst|Scientist|Lead|Director|Specialist|Consultant)(?:\s*(?:I{1,3}|[1-3]))?)\b/i;

    const ROLE_PATTERNS = [
        /^([A-Z][A-Za-z\s\/\-&]+(?:Engineer|Developer|Designer|Manager|Analyst|Scientist|Architect|Lead|Director|Coordinator|Specialist|Consultant|Administrator|Intern))\s*$/m,
        /(?:job\s+title|role|position|title)[:\s]+([^\n]{5,80})/i,
    ];

    // ===== COMPANY PATTERNS =====
    const COMPANY_PATTERNS = [
        /(?:about)\s+([A-Z][A-Za-z0-9\s&.'-]{2,40}?)\s*:/,
        /(?:—|–|-)\s*([A-Z][A-Za-z0-9\s&.'-]{2,40}?)\s*$/m,
        /(?:at|join|@)\s+([A-Z][A-Za-z0-9\s&.'-]{1,40}?)(?:\s*[,.\-–!]|\s+(?:is|we|as|and|are|to))/,
        /([A-Z][A-Za-z0-9\s&.'-]{1,40}?)\s+is\s+(?:looking|hiring|seeking|searching)/i,
        /(?:employer|organization|about\s+us)[:\s]+([^\n]{2,60})/i,
        /(?:work(?:ing)?\s+(?:at|for|with))\s+([A-Z][A-Za-z0-9\s&.'-]{2,40}?)(?:\s*[,.])/i,
    ];

    // ===== CORE PARSER =====

    function extractCompanyName(text) {
        // Reject common false-positive words
        const COMPANY_STOP_WORDS = /^(the|a|an|we|our|this|about|role|position|job|team|company|requirements?|qualifications?|responsibilities|what|nice|have)$/i;

        for (const pattern of COMPANY_PATTERNS) {
            const match = text.match(pattern);
            if (match && match[1]) {
                let name = match[1].trim();
                // Clean up trailing punctuation
                name = name.replace(/[,.\-–!:]+$/, '').trim();
                // Remove leading "the"
                name = name.replace(/^the\s+/i, '').trim();
                if (name.length >= 2 && name.length <= 50 && !COMPANY_STOP_WORDS.test(name)) {
                    return name;
                }
            }
        }
        return null;
    }

    function extractRole(text) {
        // First try: look for known role title patterns anywhere in the text (most reliable)
        const fullText = text.split('\n').slice(0, 15).join(' ');
        const titleMatch = fullText.match(ROLE_TITLE_REGEX);
        if (titleMatch) return titleMatch[1].trim();

        // Second try: structured patterns
        for (const pattern of ROLE_PATTERNS) {
            const match = text.match(pattern);
            if (match && match[1]) {
                let role = match[1].trim();
                role = role.replace(/[,.\-–!:]+$/, '').trim();
                if (role.length >= 5 && role.length <= 80) {
                    // If the extracted role is a full sentence, try to find a title within it
                    const innerMatch = role.match(ROLE_TITLE_REGEX);
                    if (innerMatch) return innerMatch[1].trim();
                    return role;
                }
            }
        }

        return null;
    }

    function extractSeniority(text, role) {
        // Strategy: First check the role/title text (most reliable),
        // then check from highest seniority down in the full text.
        const roleText = role || '';
        const titleArea = text.split('\n').slice(0, 5).join(' ');
        const priorityText = roleText + ' ' + titleArea;

        // Check highest levels first in the title/role area
        const orderedLevels = ['Lead', 'Senior', 'Mid', 'Junior', 'Intern'];
        const levelMap = {};
        for (const entry of SENIORITY_MAP) {
            levelMap[entry.level] = entry.patterns;
        }

        // Pass 1: check role + title area (most reliable signal)
        for (const level of orderedLevels) {
            for (const pattern of levelMap[level]) {
                if (pattern.test(priorityText)) {
                    return level;
                }
            }
        }

        // Pass 2: check full text, still highest-first
        for (const level of orderedLevels) {
            for (const pattern of levelMap[level]) {
                if (pattern.test(text)) {
                    return level;
                }
            }
        }

        return null;
    }

    function extractLocation(text) {
        let location = null;

        // Check for remote/hybrid in dedicated location context only
        // (avoid matching "remote work options" in benefits sections)
        const locationLines = text.split('\n').filter(line =>
            /location|based|office|remote|hybrid|on[\s-]?site/i.test(line)
        ).slice(0, 5).join(' ');

        const isHybrid = HYBRID_PATTERN.test(locationLines) || /\bhybrid\b/i.test(text.split('\n').slice(0, 10).join(' '));
        const isRemote = !isHybrid && REMOTE_PATTERNS.some(p => p.test(locationLines));

        // Try location patterns
        for (const pattern of LOCATION_PATTERNS) {
            const match = text.match(pattern);
            if (match && match[1]) {
                location = match[1].trim().replace(/[.\-–]+$/, '').trim();
                // Clean trailing commas only if not followed by state
                location = location.replace(/,\s*$/, '').trim();
                break;
            }
        }

        if (location) {
            // Only add qualifier if not already present in the location string
            const hasQualifier = /\((Remote|Hybrid|On[\s-]?site)\)/i.test(location);
            if (!hasQualifier) {
                if (isHybrid) {
                    location += ' (Hybrid)';
                } else if (isRemote) {
                    location += ' (Remote)';
                }
            }
        } else if (isRemote) {
            location = 'Remote';
        } else if (isHybrid) {
            location = 'Hybrid';
        }

        return location;
    }

    function extractSkills(text) {
        const lines = text.split('\n');
        const required = new Set();
        const niceToHave = new Set();

        // Try to identify sections
        let currentSection = 'required'; // default
        const requiredSectionIndices = [];
        const niceSectionIndices = [];

        lines.forEach((line, idx) => {
            if (NICE_SECTION_PATTERNS.some(p => p.test(line))) {
                niceSectionIndices.push(idx);
            }
            if (REQUIRED_SECTION_PATTERNS.some(p => p.test(line))) {
                requiredSectionIndices.push(idx);
            }
        });

        // Scan each line for skills
        lines.forEach((line, idx) => {
            // Determine section
            let section = 'required';
            if (niceSectionIndices.length > 0) {
                const lastNice = niceSectionIndices.filter(i => i <= idx).pop();
                const lastReq = requiredSectionIndices.filter(i => i <= idx).pop();
                if (lastNice !== undefined && (lastReq === undefined || lastNice > lastReq)) {
                    section = 'nice';
                }
            }

            // Also check if the line itself mentions "nice to have", "preferred", etc.
            if (NICE_SECTION_PATTERNS.some(p => p.test(line))) {
                section = 'nice';
            }

            // Find skills in the line
            for (const skill of ALL_SKILLS) {
                // Create word-boundary regex for the skill
                const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                if (regex.test(line)) {
                    // Normalize the skill name
                    const normalized = normalizeSkill(skill);
                    if (section === 'nice') {
                        niceToHave.add(normalized);
                    } else {
                        required.add(normalized);
                    }
                }
            }
        });

        // If a skill appears in both, keep it in required only
        niceToHave.forEach(s => {
            if (required.has(s)) niceToHave.delete(s);
        });

        return {
            required: Array.from(required),
            niceToHave: Array.from(niceToHave)
        };
    }

    function normalizeSkill(skill) {
        const normalizations = {
            'react.js': 'React',
            'reactjs': 'React',
            'vue.js': 'Vue.js',
            'vuejs': 'Vue.js',
            'next.js': 'Next.js',
            'nextjs': 'Next.js',
            'nuxt.js': 'Nuxt.js',
            'nuxtjs': 'Nuxt.js',
            'node.js': 'Node.js',
            'nodejs': 'Node.js',
            'nest.js': 'NestJS',
            'nestjs': 'NestJS',
            'express.js': 'Express',
            'angularjs': 'Angular',
            'golang': 'Go',
            'k8s': 'Kubernetes',
            'postgres': 'PostgreSQL',
            'amazon web services': 'AWS',
            'google cloud': 'GCP',
            'tailwindcss': 'Tailwind CSS',
        };
        return normalizations[skill.toLowerCase()] || skill;
    }

    // ===== RESUME SUGGESTIONS =====

    const ACTION_VERBS = {
        engineering: ['Built', 'Engineered', 'Developed', 'Architected', 'Implemented', 'Designed', 'Deployed'],
        optimization: ['Optimized', 'Improved', 'Accelerated', 'Streamlined', 'Enhanced', 'Boosted'],
        leadership: ['Led', 'Directed', 'Mentored', 'Managed', 'Spearheaded', 'Coordinated', 'Drove'],
        analysis: ['Analyzed', 'Evaluated', 'Assessed', 'Investigated', 'Researched'],
        creation: ['Created', 'Launched', 'Established', 'Introduced', 'Pioneered', 'Initiated'],
        maintenance: ['Migrated', 'Refactored', 'Modernized', 'Upgraded', 'Automated', 'Integrated'],
    };

    const METRICS = [
        'reducing load times by 40%',
        'improving performance by 3x',
        'serving 1M+ daily active users',
        'reducing deployment time by 60%',
        'achieving 99.9% uptime',
        'processing 10K+ requests/second',
        'reducing bug count by 50%',
        'improving test coverage to 95%',
        'supporting 500K+ concurrent users',
        'reducing infrastructure costs by 35%',
        'accelerating release cycles by 2x',
        'cutting onboarding time by 40%',
        'handling 100K+ daily transactions',
        'improving conversion rates by 25%',
        'reducing API response time by 65%',
        'scaling from 10K to 1M users',
        'decreasing error rates by 80%',
        'saving 200+ engineering hours/quarter',
    ];

    function generateResumeSuggestions(role, requiredSkills, niceSkills, seniority) {
        const allSkills = [...requiredSkills, ...niceSkills];
        const suggestions = [];
        const usedVerbs = new Set();

        function pickVerb(category) {
            const verbs = ACTION_VERBS[category];
            for (const v of verbs) {
                if (!usedVerbs.has(v)) {
                    usedVerbs.add(v);
                    return v;
                }
            }
            return verbs[Math.floor(Math.random() * verbs.length)];
        }

        function pickMetric() {
            return METRICS[Math.floor(Math.random() * METRICS.length)];
        }

        function pickSkills(count) {
            const shuffled = [...allSkills].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, count);
        }

        const lowerRole = (role || 'software engineer').toLowerCase();
        const isFrontend = /front[\s-]?end|ui|ux|react|angular|vue|css|design/i.test(lowerRole + ' ' + allSkills.join(' '));
        const isBackend = /back[\s-]?end|api|server|database|node|python|java|go|microservice/i.test(lowerRole + ' ' + allSkills.join(' '));
        const isFullStack = /full[\s-]?stack/i.test(lowerRole) || (isFrontend && isBackend);
        const isDevOps = /devops|sre|infrastructure|cloud|platform|reliability/i.test(lowerRole + ' ' + allSkills.join(' '));
        const isData = /data|ml|machine\s+learning|ai|scientist|analytics/i.test(lowerRole + ' ' + allSkills.join(' '));
        const isLead = seniority === 'Lead' || seniority === 'Senior';

        // Generate based on role type
        if (isFrontend || isFullStack) {
            const skills = pickSkills(2);
            suggestions.push(`${pickVerb('engineering')} responsive, high-performance web interfaces using ${skills.length ? skills.join(' and ') : 'modern frontend frameworks'}, ${pickMetric()}.`);
        }

        if (isBackend || isFullStack) {
            const skills = pickSkills(2);
            suggestions.push(`${pickVerb('engineering')} scalable RESTful APIs and microservices with ${skills.length ? skills.join(', ') : 'server-side technologies'}, ${pickMetric()}.`);
        }

        if (isDevOps) {
            suggestions.push(`${pickVerb('maintenance')} CI/CD pipelines and containerized deployments using ${pickSkills(2).join(' and ') || 'cloud-native tools'}, ${pickMetric()}.`);
        }

        if (isData) {
            suggestions.push(`${pickVerb('engineering')} data pipelines and ML models using ${pickSkills(2).join(' and ') || 'data stack'}, ${pickMetric()}.`);
        }

        if (isLead) {
            suggestions.push(`${pickVerb('leadership')} a cross-functional engineering team of 5–8 developers through agile sprints, delivering key features 20% ahead of schedule.`);
        }

        // Generic strong bullets
        if (allSkills.length >= 2) {
            const s = pickSkills(3);
            suggestions.push(`${pickVerb('optimization')} application architecture leveraging ${s.join(', ')}, ${pickMetric()}.`);
        }

        if (suggestions.length < 3) {
            suggestions.push(`${pickVerb('creation')} comprehensive technical documentation and onboarding materials, cutting new developer ramp-up time by 40%.`);
        }

        if (suggestions.length < 4) {
            suggestions.push(`${pickVerb('maintenance')} legacy codebases to modern frameworks with zero downtime, ${pickMetric()}.`);
        }

        if (suggestions.length < 5) {
            suggestions.push(`${pickVerb('analysis')} system bottlenecks and implemented performance improvements, ${pickMetric()}.`);
        }

        // Return 3-5 suggestions
        return suggestions.slice(0, 5);
    }

    // ===== PUBLIC API =====

    function parse(jobDescription) {
        if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
            return {
                company_name: null,
                role: null,
                required_skills: [],
                nice_to_have_skills: [],
                seniority_level: null,
                location: null,
                resume_suggestions: []
            };
        }

        const text = jobDescription.trim();
        const company = extractCompanyName(text);
        const role = extractRole(text);
        const seniority = extractSeniority(text, role);
        const location = extractLocation(text);
        const { required, niceToHave } = extractSkills(text);
        const resumeSuggestions = generateResumeSuggestions(role, required, niceToHave, seniority);

        return {
            company_name: company || null,
            role: role || null,
            required_skills: required,
            nice_to_have_skills: niceToHave,
            seniority_level: seniority || null,
            location: location || null,
            resume_suggestions: resumeSuggestions
        };
    }

    return { parse };
})();
