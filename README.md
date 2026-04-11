<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/React-Dark.svg" width="60" alt="React" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/TypeScript.svg" width="60" alt="TypeScript" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/TailwindCSS-Dark.svg" width="60" alt="Tailwind" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/MongoDB.svg" width="60" alt="MongoDB" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NodeJS-Dark.svg" width="60" alt="Node" />

  <h1 align="center">JobLens //</h1>
  <p align="center">
    <strong>Decode. Organize. Dominate your job search.</strong>
  </p>
  <p align="center">
    An intelligent, AI-powered application tracker designed for the modern job seeker. JobLens uses semantic AI parsing to shred complex job descriptions into structured roadmaps—matching exactly what companies are looking for into powerful resume bullet points.
  </p>
</div>

<br />

## ✨ Core Features

### 🧠 The 'Analyzer' Engine
Paste any job description block into the minimalist extraction zone. JobLens’ proprietary API instantly processes and extracts:
- **Core Logistics**: Company Name, Job Title, Geographic Location, and Required Seniority.
- **Skill Matrices**: Ranks and maps out mandatory vs. nice-to-have technical skills.
- **Tailored Resume Powermatches**: Formulates high-impact resume bullet points using the exact keywords and context derived from the employer’s own language.

### 📊 Tactical Kanban Dashboard
Command your entire interview pipeline from a central operations hub.
- **Dynamic Board**: Visually transition your applications through stages (`Applied` → `Phone Screen` → `Interview` → `Offer` → `Rejected`) using fluid drag-and-drop mechanics.
- **Micro-Metric Reporting**: Track aggregate health metrics like active processes versus rejection rates instantly via the interactive top row. 
- **Deep Storage Modals**: Store crucial contextual nodes per application (Expected salary negotiations, JD source links, and private recruiter notes).

<br />

## 🛠️ Architecture & Design Decisions

Designing JobLens required deliberate architectural tradeoffs to ensure scalability and ultra-low latency UX.

1. **Monolithic Monorepo Organization**: We nested the `server` and `client` inside a single repository structure leveraging a root `package.json` with a recursive `postinstall` script. This enforces atomic deployment integrity without requiring complex submodules, making Vercel CI/CD pipelines seamless.
2. **Dual-View UI Paradigms**: We deliberately avoided complex client-side routing libraries (like `react-router-dom`) to minimize bundle size. Instead, we implemented a sophisticated `currentView` local state toggler to flawlessly swap between the AI-Analyzer Landing View and the Kanban Board without triggering total DOM rerenders.
3. **Optimistic UI with React Query**: We heavily utilize `@tanstack/react-query`. Rather than explicitly managing loading states and `useEffect` hooks across multiple components, the frontend optimistically binds to data queries and automatically invalidates caching markers upon successful mutations (drag-and-drops).
4. **Resilient AI Parsing**: The backend utilizes the OpenAI SDK to interpret raw job postings. To protect against unpredictable LLM rate limits or quota errors, the backend is strictly engineered to catch API blocks natively (utilizing `maxRetries: 0`) and instantaneously default to a sophisticated Regex-based local processing script.

<br />

## 🔑 Environment Variables

To properly launch the stack on your local machine, you must feed specific environmental parameters to both ends.

### Backend (`server/.env`)
Create a `.env` file directly inside the `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<your_username>:<your_password>@cluster.mongodb.net/JobLens
JWT_SECRET=super_secret_cryptographic_key_here
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)
Create a `.env` file directly inside the `client/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

<br />

## 🚀 How to Run Locally

You must initialize the backend daemon and the frontend React process simultaneously.

### 1. Boot up the Backend Server
1. Navigate into the backend repository layer:
   ```bash
   cd server
   ```
2. Install NodeJS dependencies:
   ```bash
   npm install
   ```
3. Initialize the development environment:
   ```bash
   npm run dev
   ```
   *The Express server will hook into MongoDB and output `Server running on port 5000`.*

### 2. Boot up the Frontend Client
1. Open a **second, completely separate terminal window**.
2. Navigate into the frontend repository layer:
   ```bash
   cd client
   ```
3. Install the web dependencies:
   ```bash
   npm install
   ```
4. Initialize the Vite environment:
   ```bash
   npm run dev
   ```
5. **Liftoff!** Open [http://localhost:5173](http://localhost:5173) in your Chrome/Safari browser to interact with JobLens locally!
