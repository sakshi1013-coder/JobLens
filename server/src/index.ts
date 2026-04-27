import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ApplicationModel, UserModel } from "./models";
import { AIService } from "./aiService";
import type { ApplicationStatus } from "./types";

const app = express();
app.use(cors({ 
  origin: process.env.CLIENT_URL || true, // Allow all if CLIENT_URL is not set (easier for first deployment)
  credentials: true 
}));
app.use(express.json());

const statuses: ApplicationStatus[] = ["Applied", "Phone Screen", "Interview", "Offer", "Rejected"];
const jwtSecret = process.env.JWT_SECRET || "";
const aiService = process.env.OPENAI_API_KEY ? new AIService(process.env.OPENAI_API_KEY) : null;

if (!process.env.MONGO_URI || !jwtSecret) {
  throw new Error("Missing MONGO_URI or JWT_SECRET in environment.");
}

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

type AuthedRequest = express.Request & { userId?: string };

function authMiddleware(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
  try {
    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, jwtSecret) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/register", async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input" });

  const { email, password } = parsed.data;
  const exists = await UserModel.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ email, passwordHash });
  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });
  res.json({ token });
});

app.post("/api/auth/login", async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input" });

  const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });
  res.json({ token });
});

app.get("/api/applications", authMiddleware, async (req: AuthedRequest, res) => {
  const applications = await ApplicationModel.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(applications);
});

app.post("/api/applications", authMiddleware, async (req: AuthedRequest, res) => {
  const schema = z.object({
    company: z.string().min(1),
    role: z.string().min(1),
    jdLink: z.string().optional(),
    notes: z.string().optional(),
    dateApplied: z.string().min(1),
    status: z.enum(statuses as [ApplicationStatus, ...ApplicationStatus[]]),
    salaryRange: z.string().optional(),
    requiredSkills: z.array(z.string()).default([]),
    niceToHaveSkills: z.array(z.string()).default([]),
    seniority: z.string().optional(),
    location: z.string().optional(),
    resumeSuggestions: z.array(z.string()).default([]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
  const created = await ApplicationModel.create({ ...parsed.data, userId: req.userId });
  res.status(201).json(created);
});

app.put("/api/applications/:id", authMiddleware, async (req: AuthedRequest, res) => {
  const updated = await ApplicationModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
});

app.delete("/api/applications/:id", authMiddleware, async (req: AuthedRequest, res) => {
  const removed = await ApplicationModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!removed) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
});

app.post("/api/ai/parse", authMiddleware, async (req, res) => {
  const schema = z.object({ jobDescription: z.string().min(20) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Job description too short" });
  if (!aiService) return res.status(500).json({ message: "OPENAI_API_KEY is missing on server" });

  try {
    const parsedData = await aiService.parseJobDescription(parsed.data.jobDescription);
    const resumeSuggestions = await aiService.generateResumeBullets(parsed.data.jobDescription, parsedData);
    res.json({ ...parsedData, resumeSuggestions });
  } catch {
    res.status(500).json({ message: "AI parsing failed. Please retry." });
  }
});

if (process.env.NODE_ENV !== "production") {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;
