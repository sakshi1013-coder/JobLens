# JobLens //

An intelligent, AI-powered job application tracker designed for modern job seekers. JobLens instantly parses complex job descriptions and converts them into structured metrics with customized resume power-bullets, organizing everything into a sleek, dark-mode Kanban board.

## Features ✨

### 🔮 AI Job Description Analyzer
- **Instant Decoding**: Paste any job description into the Analyzer, and JobLens will instantly extract the Company, Role, Location, Seniority, and Required Skills using OpenAI.
- **Resume Power-Bullets**: Automatically generates tailored resume points highlighting precisely what the prospective employer is looking for based on the parsed data.
- **Distraction-Free Parsing**: A full-screen, grid-backed neumorphic extraction zone designed to process job descriptions without clutter.

### 📋 Interactive Kanban Dashboard
- **Drag-and-Drop Workflow**: Visually track your applications across the entire pipeline (`Applied`, `Phone Screen`, `Interview`, `Offer`, `Rejected`) using intuitive drag-and-drop mechanics.
- **Statistical Overview**: A quick-scan header containing dynamic widgets summarizing total applications, active processes, and offers at a glance.
- **Detailed Card Editor**: Click any application card to pull up a comprehensive detail modal. Store the original Job Description link, expected salary ranges, and personal notes like recruiter feedback.

## Technology Stack 💻

JobLens is built using a modern **MERN + TypeScript** Architecture.

*   **Frontend**: 
    *   **React + Vite**: For blazing-fast compilation and highly responsive component structures.
    *   **Tailwind CSS**: A fully custom design system using rich dark modes, glassmorphism (`backdrop-blur`), mesh gradients, and micro-animations.
    *   **TanStack React Query**: Manages complex server state, optimistic updates, and cache invalidation automatically.
*   **Backend**: 
    *   **Node.js / Express**: Robust REST Architecture.
    *   **MongoDB**: Flexible document structures to house deep analytics on job postings.
    *   **OpenAI SDK**: Handles semantic analysis of raw text using zero-configuration fallback logic if quota is exceeded.

## Getting Started 🚀

To get this project running on your local machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sakshi1013-coder/JobLens.git
   cd JobLens
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   ```
   *Create a `.env` file in the `server` folder with:* `PORT`, `MONGO_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `CLIENT_URL`.
   ```bash
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../client
   npm install
   ```
   *Create a `.env` file in the `client` folder with:* `VITE_API_URL`.
   ```bash
   npm run dev
   ```

4. **Access the application:** Open `http://localhost:5173` in your browser.
