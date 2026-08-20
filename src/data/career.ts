import type { CareerEntry } from "@/lib/types";

const entries: CareerEntry[] = [
  {
    id: "career-now",
    dateLabel: "NOW",
    sortDate: "2026-08-01",
    role: "Exploring & Building",
    subtitle: "Self-Directed R&D",
    description:
      "Researching LLM orchestration frameworks, agent-based systems, vector databases and semantic search, and scalable model-serving infrastructure.",
    isNow: true,
  },
  {
    id: "career-runtime-revolution",
    dateLabel: "2022 – Present",
    sortDate: "2022-07-01",
    role: "Software Developer",
    subtitle: "Runtime Revolution",
    description:
      "Designing LLM/RAG pipelines and time-series forecasting models, and building the FastAPI services and AWS/Terraform infrastructure that put them into production.",
  },
  {
    id: "career-postgrad",
    dateLabel: "2021 – 2023",
    sortDate: "2021-09-01",
    role: "Postgraduate Degree, Computer Science and Engineering",
    subtitle: "Universidade da Beira Interior",
    description:
      "Thesis: an end-to-end computer vision object detection system for marine wildlife identification from drone imagery — built with Python, PyTorch and YOLO, benchmarking multiple architectures up to YOLOv9c at mAP50 ≈ 95.5%.",
    relatedProjectId: "proj-sea-turtles",
  },
  {
    id: "career-capgemini",
    dateLabel: "2021 – 2022",
    sortDate: "2021-01-01",
    role: "Junior Consultant / Engineer",
    subtitle: "Capgemini Engineering",
    description:
      "Built and maintained full-stack features with Angular and TypeScript, integrating modular UI components with backend REST APIs as part of a client-facing consulting team.",
  },
  {
    id: "career-bachelor",
    dateLabel: "2016 – 2020",
    sortDate: "2016-09-01",
    role: "Bachelor's Degree, Computer Science and Engineering",
    subtitle: "Universidade da Beira Interior",
    description: "Foundational degree in computer science and engineering.",
  },
];

export const career: CareerEntry[] = [...entries].sort((a, b) =>
  b.sortDate.localeCompare(a.sortDate)
);
