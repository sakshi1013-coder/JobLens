import OpenAI from "openai";
import { z } from "zod";
import type { ParsedJobData } from "./types";

const ParseSchema = z.object({
  company: z.string().default("Unknown"),
  role: z.string().default(""),
  requiredSkills: z.array(z.string()).default([]),
  niceToHaveSkills: z.array(z.string()).default([]),
  seniority: z.string().default(""),
  location: z.string().default(""),
});

const ResumeSchema = z.object({
  bullets: z.array(z.string()).min(3).max(5),
});

const SYSTEM_PROMPT = "You are a strict JSON extractor for job descriptions.";

export class AIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey, maxRetries: 0 });
  }

  private normalizeSkills(skills: string[]): string[] {
    return skills
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s, i, arr) => arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i);
  }

  private fallbackParse(jobDescription: string): ParsedJobData {
    const text = jobDescription;
    const lowerText = text.toLowerCase();

    const companyMatch = 
      text.match(/(?:at|with|for)\s+([A-Z][A-Za-z0-9&.\-\s]+?)(?:\s+(?:hiring|looking|we are)|[.!?\n]|$)/i) ||
      text.match(/about\s+([A-Z][A-Za-z0-9&.\-\s]+?)(?:\s*[:.\n]|$)/i) ||
      text.match(/company\s*:\s*([A-Z][A-Za-z0-9&.\-\s]+)/i);
    let companyName = "Unknown";
    if (companyMatch?.[1] && companyMatch[1].length < 30) {
      companyName = companyMatch[1].trim();
    }

    const roleMatch = 
      text.match(/(?:hiring|looking for)\s+(?:a|an|the)?\s*([A-Za-z0-9\-\s]+?(?:Engineer|Developer|Manager|Analyst|Designer|Director|Architect|Consultant|Specialist|Lead))/i) ||
      text.match(/^([A-Za-z0-9\-\s]+?(?:Engineer|Developer|Manager|Analyst|Designer|Director|Architect|Consultant|Specialist|Lead))\b/im) ||
      text.match(/role\s*:\s*([^\n]+)/i);
    const role = roleMatch?.[1]?.trim() || "";

    let seniority = "";
    const yearsMatch = text.match(/\b(\d+[-+to\s]*\d*\s*years?)\b/i);
    if (yearsMatch) {
      seniority = yearsMatch[1].trim();
    } else {
      const levelMatch = text.match(/\b(Junior|Senior|Lead|Staff|Principal|Intern|Entry[\-\s]*level|Director|VP)\b/i);
      if (levelMatch) seniority = levelMatch[1].trim();
    }

    const locationMatch = text.match(/location\s*:\s*([^\n]+)/i);
    let location = locationMatch?.[1]?.trim() || "";
    if (!location) {
      const typeMatch = text.match(/\b(Remote|Hybrid|On-site|Onsite)\b/i);
      if (typeMatch) location = typeMatch[1].trim();
    }

    const commonSkills = [
      "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js", "Node", "Python", 
      "Java", "C#", "C++", "Go", "Golang", "Ruby", "PHP", "Swift", "Kotlin", "Rust",
      "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra",
      "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Terraform",
      "GraphQL", "REST", "API", "HTML", "CSS", "Tailwind", "SASS", "LESS",
      "Git", "CI/CD", "Jenkins", "GitHub Actions", "GitLab", "Linux", "Unix"
    ];

    const requiredSkills: string[] = [];
    const niceToHaveSkills: string[] = [];
    const bonusIndex = lowerText.search(/\b(nice to have|bonus|plus|preferred|advantage)\b/);

    commonSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const matchIndex = lowerText.search(regex);
      if (matchIndex !== -1) {
        if (bonusIndex !== -1 && matchIndex > bonusIndex) {
          niceToHaveSkills.push(skill);
        } else {
          requiredSkills.push(skill);
        }
      }
    });

    return {
      companyName: companyName.replace(/[.,]+$/, "").trim(),
      role,
      requiredSkills: this.normalizeSkills(requiredSkills),
      niceToHaveSkills: this.normalizeSkills(niceToHaveSkills),
      seniority,
      location,
    };
  }

  async parseJobDescription(jobDescription: string): Promise<ParsedJobData> {
    try {
      const prompt = `
You are an AI that extracts structured data from job descriptions.

Return ONLY valid JSON. No explanation. No extra text.

Extract the following fields:
- company
- role
- requiredSkills (array)
- niceToHaveSkills (array)
- seniority
- location

Rules:
- If company is not mentioned, return "Unknown"
- Extract seniority like "1-3 years", "Senior", etc.
- Skills must be arrays of strings
- Do NOT return text like "Seniority Level: ..."
- ONLY JSON

Example output:
{
  "company": "Amazon",
  "role": "Frontend Developer",
  "requiredSkills": ["React", "TypeScript"],
  "niceToHaveSkills": ["Next.js"],
  "seniority": "1-3 years",
  "location": "Bangalore, India"
}

Job Description:
${jobDescription}
`;

      const response = await this.client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "job_parse",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                company: { type: "string" },
                role: { type: "string" },
                requiredSkills: { type: "array", items: { type: "string" } },
                niceToHaveSkills: { type: "array", items: { type: "string" } },
                seniority: { type: "string" },
                location: { type: "string" },
              },
              required: ["company", "role", "requiredSkills", "niceToHaveSkills", "seniority", "location"],
            },
            strict: true,
          },
        },
      });

      const parsed = ParseSchema.parse(JSON.parse(response.output_text));
      return {
        companyName: parsed.company || "Unknown",
        role: parsed.role,
        requiredSkills: this.normalizeSkills(parsed.requiredSkills),
        niceToHaveSkills: this.normalizeSkills(parsed.niceToHaveSkills),
        seniority: parsed.seniority,
        location: parsed.location,
      };
    } catch (e) {
      console.error("AI parsing error:", e);
      return this.fallbackParse(jobDescription);
    }
  }

  async generateResumeBullets(jobDescription: string, parsed: ParsedJobData): Promise<string[]> {
    try {
      const response = await this.client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: "Generate role-specific resume bullets. No generic filler." },
          {
            role: "user",
            content:
              `Generate 3-5 resume bullets for role ${parsed.role} at ${parsed.companyName}.` +
              `Use required skills: ${parsed.requiredSkills.join(", ")}.` +
              `Context:\n${jobDescription}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "resume_bullets",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                bullets: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
              },
              required: ["bullets"],
            },
            strict: true,
          },
        },
      });

      return ResumeSchema.parse(JSON.parse(response.output_text)).bullets;
    } catch (e) {
      console.error("AI bullets error:", e);
      const skillsPart = parsed.requiredSkills.length > 0 
        ? ` using ${parsed.requiredSkills.slice(0, 3).join(", ")}` 
        : "";
      return [
        `Developed and maintained scalable applications${skillsPart}.`,
        `Collaborated with cross-functional teams to deliver high-quality software solutions.`,
        `Optimized performance and scalability of existing systems.`
      ];
    }
  }
}
