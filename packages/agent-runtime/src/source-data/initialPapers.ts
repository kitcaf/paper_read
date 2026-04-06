import type { ImportPaperInput } from "../storage/workspace";

export const INITIAL_SOURCE_KEY = "aaai_2026";
export const INITIAL_SOURCE_LABEL = "AAAI 2026";

export const INITIAL_PAPERS: ImportPaperInput[] = [
  {
    sourceKey: INITIAL_SOURCE_KEY,
    sourcePaperId: "aaai2026-seed-001",
    title: "Agentic Planning with Verifiable Tool Use for Long-Horizon Research Tasks",
    abstract:
      "A local planning framework that coordinates tool calls, verification loops, and evidence tracking for multi-step research workflows.",
    authors: ["Lina Chen", "Mark Rivera"],
    venue: "AAAI",
    year: 2026,
    metadata: { sourceLabel: INITIAL_SOURCE_LABEL, track: "AI Agents" }
  },
  {
    sourceKey: INITIAL_SOURCE_KEY,
    sourcePaperId: "aaai2026-seed-002",
    title: "Retrieval-Augmented Scientific Reading with Citation-Grounded Summaries",
    abstract:
      "A retrieval and summarization method for scientific papers that grounds generated summaries in cited evidence and local document context.",
    authors: ["Anika Rao", "Daniel Kim"],
    venue: "AAAI",
    year: 2026,
    metadata: { sourceLabel: INITIAL_SOURCE_LABEL, track: "Scientific AI" }
  },
  {
    sourceKey: INITIAL_SOURCE_KEY,
    sourcePaperId: "aaai2026-seed-003",
    title: "Uncertainty-Aware Paper Screening from Titles and Abstracts",
    abstract:
      "A lightweight screening model that estimates uncertainty when only metadata fields are available during early literature review.",
    authors: ["Maya Torres", "Yuchen Li"],
    venue: "AAAI",
    year: 2026,
    metadata: { sourceLabel: INITIAL_SOURCE_LABEL, track: "Machine Learning" }
  },
  {
    sourceKey: INITIAL_SOURCE_KEY,
    sourcePaperId: "aaai2026-seed-004",
    title: "Benchmarking Multimodal Agents for Interactive Data Analysis",
    abstract:
      "A benchmark suite for measuring how multimodal agents inspect tables, charts, and documents under interactive analysis settings.",
    authors: ["Noah Bennett", "Sara Ahmed"],
    venue: "AAAI",
    year: 2026,
    metadata: { sourceLabel: INITIAL_SOURCE_LABEL, track: "Benchmarks" }
  },
  {
    sourceKey: INITIAL_SOURCE_KEY,
    sourcePaperId: "aaai2026-seed-005",
    title: "Efficient Graph Neural Networks for Molecular Property Prediction",
    abstract:
      "A compact graph model for predicting molecular properties with fewer parameters and faster training on chemistry benchmarks.",
    authors: ["Ethan Zhang", "Priya Shah"],
    venue: "AAAI",
    year: 2026,
    metadata: { sourceLabel: INITIAL_SOURCE_LABEL, track: "Graph Learning" }
  },
  {
    sourceKey: INITIAL_SOURCE_KEY,
    sourcePaperId: "aaai2026-seed-006",
    title: "Human-in-the-Loop Evaluation of LLM Research Assistants",
    abstract:
      "An evaluation protocol for research assistants that combines expert feedback, task completion quality, and provenance auditing.",
    authors: ["Jules Martin", "Hana Sato"],
    venue: "AAAI",
    year: 2026,
    metadata: { sourceLabel: INITIAL_SOURCE_LABEL, track: "Evaluation" }
  },
  {
    sourceKey: INITIAL_SOURCE_KEY,
    sourcePaperId: "aaai2026-seed-007",
    title: "Policy Learning for Autonomous Warehouse Robot Coordination",
    abstract:
      "A reinforcement learning approach for coordinating warehouse robots under route congestion and dynamic demand.",
    authors: ["Oliver Smith", "Mei Huang"],
    venue: "AAAI",
    year: 2026,
    metadata: { sourceLabel: INITIAL_SOURCE_LABEL, track: "Robotics" }
  },
  {
    sourceKey: INITIAL_SOURCE_KEY,
    sourcePaperId: "aaai2026-seed-008",
    title: "Memory Compression for Local Language Model Agents",
    abstract:
      "A memory compression strategy that enables local agents to preserve useful context while controlling latency and storage cost.",
    authors: ["Fatima El-Sayed", "Jonas Weber"],
    venue: "AAAI",
    year: 2026,
    metadata: { sourceLabel: INITIAL_SOURCE_LABEL, track: "Efficient AI" }
  }
];
