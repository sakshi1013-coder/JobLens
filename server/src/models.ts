import mongoose, { Schema } from "mongoose";
import type { ApplicationStatus } from "./types";

export interface UserDoc extends mongoose.Document {
  email: string;
  passwordHash: string;
}

export interface ApplicationDoc extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  company: string;
  role: string;
  jdLink?: string;
  notes?: string;
  dateApplied: string;
  status: ApplicationStatus;
  salaryRange?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  seniority?: string;
  location?: string;
  resumeSuggestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const applicationSchema = new Schema<ApplicationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    jdLink: { type: String, trim: true },
    notes: { type: String, trim: true },
    dateApplied: { type: String, required: true },
    status: {
      type: String,
      enum: ["Applied", "Phone Screen", "Interview", "Offer", "Rejected"],
      required: true,
      default: "Applied",
    },
    salaryRange: { type: String, trim: true },
    requiredSkills: { type: [String], default: [] },
    niceToHaveSkills: { type: [String], default: [] },
    seniority: { type: String, trim: true },
    location: { type: String, trim: true },
    resumeSuggestions: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<UserDoc>("User", userSchema);
export const ApplicationModel =
  mongoose.models.Application || mongoose.model<ApplicationDoc>("Application", applicationSchema);
