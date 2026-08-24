import type { TimelineEntry } from "@/lib/types";

const entries: TimelineEntry[] = [
  {
    id: "edu-bachelor",
    category: "education",
    title: "Bachelor's Degree in Computer Science and Engineering",
    institution: "Universidade da Beira Interior",
    dateLabel: "2016 – 2020",
    sortDate: "2016-09-01",
    description: "Foundational degree in computer science and engineering.",
    highlights: [],
  },
  {
    id: "proj-ur3",
    category: "project",
    featured: true,
    title: "UR3 Robotic Arm — Pick & Place",
    dateLabel: "Feb 2020 – Jul 2020",
    sortDate: "2020-02-01",
    description:
      "ROS pick-and-place system for a Universal Robots UR3: a fixed-pose baseline and a camera-guided depth point-cloud pipeline, both running identically in simulation or on the real arm. Most recently revamped in 2026.",
    tech: ["ROS Melodic", "MoveIt", "RealSense", "Gazebo", "RANSAC", "ArUco", "Python"],
    links: {
      repo: "https://github.com/gab-es21/ur3-robotic-arm-pick-place",
      docs: "https://gab-es21.github.io/ur3-robotic-arm-pick-place/",
    },
    media: { type: "video", src: "/videos/ur3-demo.mp4" },
  },
  {
    id: "edu-postgrad",
    category: "education",
    title: "Postgraduate Degree in Computer Science and Engineering",
    institution: "Universidade da Beira Interior",
    dateLabel: "2021 – 2023",
    sortDate: "2021-09-01",
    description:
      "Thesis: an end-to-end computer vision object detection system for marine wildlife identification from drone imagery.",
    highlights: [
      "Built an end-to-end CV object detection system (Python, PyTorch, YOLO)",
      "Curated and annotated a custom drone-imagery dataset with advanced augmentation",
      "Benchmarked multiple architectures; selected YOLOv9c achieving mAP50 ≈ 95.5%",
    ],
    relatedProjectId: "proj-sea-turtles",
  },
  {
    id: "proj-sea-turtles",
    category: "project",
    featured: true,
    title: "Marine Wildlife Object Detection",
    dateLabel: "2021 – 2023",
    sortDate: "2021-09-01",
    description:
      "Computer vision pipeline for sea turtle identification from drone imagery — the applied research behind the postgraduate thesis above.",
    tech: ["PyTorch", "YOLOv8", "YOLOv9", "OpenCV", "Python"],
    links: { repo: "https://github.com/gab-es21/sea-turtles-detection" },
    media: { type: "stat-panel" },
  },
  {
    id: "proj-financial-risk",
    category: "project",
    employerProject: true,
    title: "Financial Risk Forecasting Engine",
    dateLabel: "Jul 2022 – Ongoing",
    sortDate: "2022-07-01",
    description:
      "Applied ML for debt prediction and early anomaly detection — time-series forecasting with feature engineering and automated risk-scoring integration.",
    tech: ["Prophet", "Python", "FastAPI", "Feature Engineering"],
    links: {},
  },
  {
    id: "proj-chatbot",
    category: "project",
    featured: true,
    title: "AI Chatbot & Poll Intelligence Platform",
    dateLabel: "2026",
    sortDate: "2026-03-01",
    description:
      "LLM-driven conversational system for Portugal's 2026 presidential elections, with contextual retrieval and citation-grounded answers.",
    tech: ["Next.js", "React", "TypeScript", "Gemini", "Genkit", "RAG", "Firebase"],
    links: {
      live: "https://botpresidencial.blog",
      repo: "https://github.com/gab-es21/presidential-elections-rag-chatbot-2026",
    },
    media: { type: "stat-panel" },
  },
  {
    id: "proj-finance-pt",
    category: "project",
    title: "Personal Finance Comparison — Portugal",
    dateLabel: "2026",
    sortDate: "2026-03-01",
    description:
      "Comparison tool for Portuguese bank cards, salary accounts and savings products, with an AI-powered analysis layer and a compound interest simulator.",
    tech: ["TypeScript", "AI Analysis", "Static Site"],
    links: {
      repo: "https://github.com/gab-es21/personal-finance-pt",
      live: "https://gab-es21.github.io/personal-finance-pt/simulator.html",
    },
  },
  {
    id: "proj-round-table",
    category: "project",
    title: "Round Table — Multi-Agent AI Chat",
    dateLabel: "2026",
    sortDate: "2026-06-01",
    description:
      "Messenger-style app where up to 5 AI agents with distinct personalities debate ideas — each one thinks, speaks, and remembers.",
    tech: ["Ollama", "Claude API", "Flet", "Python"],
    links: { repo: "https://github.com/gab-es21/messenger-ai" },
  },
  {
    id: "proj-interview-assistant",
    category: "project",
    privateRepo: true,
    title: "Interview Assistant",
    dateLabel: "2026",
    sortDate: "2026-03-15",
    description:
      "Real-time desktop app that listens to interview audio, detects questions, and streams AI-generated answers live.",
    tech: ["faster-whisper", "WASAPI", "Ollama", "Claude API", "OpenAI API", "Python"],
    links: {},
  },
];

export const timeline: TimelineEntry[] = [...entries].sort((a, b) =>
  a.sortDate.localeCompare(b.sortDate)
);

export const educationEntries = timeline.filter(
  (e): e is Extract<TimelineEntry, { category: "education" }> => e.category === "education"
);

export const featuredProjects = timeline.filter(
  (e): e is Extract<TimelineEntry, { category: "project" }> =>
    e.category === "project" && !!e.featured
);

export const otherProjects = timeline.filter(
  (e): e is Extract<TimelineEntry, { category: "project" }> =>
    e.category === "project" && !e.featured
);
