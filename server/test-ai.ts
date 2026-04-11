import { AIService } from "./src/aiService";
import "dotenv/config";

const ai = new AIService(process.env.OPENAI_API_KEY || "");
ai.parseJobDescription("Hiring a senior frontend developer for Amazon in Bangalore. Needs React and TypeScript. 3+ years experience.").then(r => console.log("Success:", r)).catch(e => console.error("Error:", e));
