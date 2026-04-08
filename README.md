# 🔍 JobLens — AI-Powered Job Description Analyzer & Application Tracker

<div align="center">

**Decode any job description instantly. Extract structured insights, identify key skills, and get tailored resume bullet points — all in your browser.**

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

</div>

---

## ✨ Features

### 📄 Job Description Analyzer
- **Smart Parsing** — Paste any job description and instantly extract structured data including company name, role title, seniority level, and location.
- **Skill Extraction** — Automatically identifies **required skills** and **nice-to-have skills** from a catalog of 200+ technologies, frameworks, tools, and concepts.
- **Resume Bullet Generator** — Produces 3–5 tailored, action-verb-driven resume bullet points based on the detected role type (frontend, backend, full-stack, DevOps, data/ML, leadership).
- **JSON Export** — View and copy the full parsed output as structured JSON with syntax highlighting.
- **Clipboard Integration** — Paste from clipboard, copy resume bullets, and copy JSON output with one click.
- **Sample Job Description** — Try the analyzer instantly with a built-in sample JD.

### 📋 Application Tracker
- **Save & Organize** — Save analyzed job descriptions to a persistent tracker stored in `localStorage`.
- **Status Management** — Track application progress with statuses: **Saved → Applied → Interview → Offer → Rejected**.
- **Search & Filter** — Search by company, role, or skills, and filter by application status.
- **Dashboard Stats** — At-a-glance counters for total applications, applied, interviews, and offers.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Structure** | HTML5, Semantic Elements, SVG Icons |
| **Styling** | Vanilla CSS — Glassmorphism, CSS Grid, Flexbox, Custom Properties, Animations |
| **Logic** | Vanilla JavaScript (ES6+) — No frameworks, no dependencies |
| **Fonts** | [Inter](https://fonts.google.com/specimen/Inter) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts |
| **Storage** | Browser `localStorage` for persistence |

**Zero dependencies. No build step. No API keys required.**

---

## 🏗️ Project Structure

```
JobLens/
├── index.html      # Main HTML — full app layout, modals, and semantic structure
├── style.css       # Complete design system — tokens, components, animations, responsive
├── parser.js       # JobParser module — NLP-style regex engine for JD analysis
├── app.js          # App controller — UI state, event handling, rendering, persistence
└── README.md
```

---

## 🔍 How It Works

### Parser Engine (`parser.js`)

The parser uses a multi-pass, regex-based extraction pipeline — no external AI/API required:

1. **Company Extraction** — Matches patterns like `"About [Company]:"`, `"— [Company]"`, `"at [Company]"`, and `"[Company] is looking for..."`.
2. **Role Detection** — Scans the first 15 lines for structured role titles (e.g., *Senior Frontend Engineer*), then falls back to generic patterns.
3. **Seniority Classification** — Determines level (Intern → Junior → Mid → Senior → Lead) by checking the role title first, then the full text.
4. **Location Parsing** — Extracts city/state from location patterns, and appends `(Remote)` or `(Hybrid)` qualifiers when detected.
5. **Skill Identification** — Matches against a 200+ item catalog organized by category:
   - Languages (JavaScript, Python, Go, etc.)
   - Frameworks (React, Django, Flutter, etc.)
   - Tools (Docker, AWS, PostgreSQL, etc.)
   - Concepts (Microservices, Agile, TDD, etc.)
6. **Section-Aware Classification** — Distinguishes between "Required" and "Nice to Have" sections using heading detection, so skills are categorized correctly.
7. **Resume Generation** — Produces contextual bullet points using domain-specific action verbs and realistic performance metrics.

### App Controller (`app.js`)

- IIFE-scoped module managing all UI interactions
- Animated multi-step loading sequence with visual feedback
- Toast notification system for user actions
- JSON syntax highlighting for the export modal
- Keyboard shortcuts: `Cmd/Ctrl + Enter` to analyze, `Escape` to close modals

---

## 🎨 Design

- **Dark Theme** — Deep navy/charcoal background (`#0a0a0f`) with vibrant accent gradients
- **Glassmorphism** — Frosted glass cards with backdrop blur and subtle borders
- **Animated Background** — Floating gradient orbs and a subtle CSS grid overlay
- **Micro-Animations** — Slide-up reveals, scale-in skill tags, pulsing indicators, and smooth transitions
- **Responsive Layout** — CSS Grid with mobile-friendly breakpoints
- **Typography** — Inter for UI text, JetBrains Mono for code/counts

---

## 📸 Key Sections

| Section | Description |
|---------|-------------|
| **Hero** | Gradient headline with AI-powered badge and pulsing status dot |
| **Input Card** | Textarea with character counter, paste/clear actions, and analyze button |
| **Stats Row** | 4-column grid showing Company, Role, Seniority, and Location |
| **Skills Cards** | Required skills (emerald tags) and Nice-to-Have skills (amber tags) |
| **Resume Bullets** | Tailored action-verb bullet points with copy-all functionality |
| **JSON Modal** | Syntax-highlighted JSON output with copy support |
| **Tracker View** | Searchable, filterable application list with status management |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by <strong>JobLens</strong></sub>
</div>
