export type EntryCategory = "education" | "project";

interface BaseEntry {
  id: string;
  category: EntryCategory;
  title: string;
  /** Display string, e.g. "2021 – 2023" */
  dateLabel: string;
  /** ISO date (start of range), used only for chronological ordering */
  sortDate: string;
  description: string;
  featured?: boolean;
}

export interface EducationEntry extends BaseEntry {
  category: "education";
  institution: string;
  highlights: string[];
  /** id of a ProjectEntry this coursework/thesis produced */
  relatedProjectId?: string;
}

export interface ProjectLinks {
  repo?: string;
  live?: string;
  docs?: string;
}

export interface ProjectMedia {
  type: "video" | "stat-panel";
  src?: string;
  poster?: string;
}

export interface ProjectEntry extends BaseEntry {
  category: "project";
  tech: string[];
  links?: ProjectLinks;
  media?: ProjectMedia;
  privateRepo?: boolean;
  employerProject?: boolean;
}

export type TimelineEntry = EducationEntry | ProjectEntry;

export interface CareerEntry {
  id: string;
  /** Display label, e.g. "2022 – Present" or "NOW" */
  dateLabel: string;
  /** ISO date (start of range), used only for chronological ordering */
  sortDate: string;
  role: string;
  subtitle: string;
  description: string;
  /** id of a ProjectEntry this role/degree produced, for cross-linking */
  relatedProjectId?: string;
  isNow?: boolean;
}
