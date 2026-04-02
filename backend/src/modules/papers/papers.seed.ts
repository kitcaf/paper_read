import type { PaperRecord } from "@paper-read/shared";

const AAAI_2026 = "aaai_2026";
const NEURIPS_2025 = "neurips_2025";
const ICLR_2026 = "iclr_2026";

export const paperCatalogSeed: PaperRecord[] = [
  {
    id: "paper-aaai-001",
    sourceKey: AAAI_2026,
    sourcePaperId: "AAAI-2026-001",
    title: "Retrieval-Augmented Planning for Long-Horizon Web Agents",
    abstract:
      "We study how retrieval-augmented memory improves long-horizon planning for browser-based agents and show strong gains on multi-step tasks.",
    authors: ["Mina Zhou", "Carlos Rivera"],
    venue: "AAAI",
    year: 2026,
    paperUrl: "https://example.com/aaai-2026-001",
    options: {
      track: "Main Conference",
      keywords: ["agents", "planning", "retrieval"]
    }
  },
  {
    id: "paper-aaai-002",
    sourceKey: AAAI_2026,
    sourcePaperId: "AAAI-2026-002",
    title: "Efficient Multimodal Distillation with Sparse Visual Tokens",
    abstract:
      "A token-sparse distillation pipeline reduces multimodal training cost while preserving downstream performance on captioning and VQA.",
    authors: ["Sara Kim", "Ibrahim Hassan"],
    venue: "AAAI",
    year: 2026,
    paperUrl: "https://example.com/aaai-2026-002",
    options: {
      track: "Main Conference",
      keywords: ["multimodal", "distillation"]
    }
  },
  {
    id: "paper-aaai-003",
    sourceKey: AAAI_2026,
    sourcePaperId: "AAAI-2026-003",
    title: "Coordinating Specialist Agents with Graph-Based Deliberation",
    abstract:
      "This work builds a graph-based deliberation layer that improves coordination between specialist agents on planning and coding benchmarks.",
    authors: ["Wei Tang", "Helen Ortiz"],
    venue: "AAAI",
    year: 2026,
    paperUrl: "https://example.com/aaai-2026-003",
    options: {
      track: "Main Conference",
      keywords: ["multi-agent", "graphs", "planning"]
    }
  },
  {
    id: "paper-aaai-004",
    sourceKey: AAAI_2026,
    sourcePaperId: "AAAI-2026-004",
    title: "Benchmarking Embodied Navigation with Language-Conditioned Priors",
    abstract: null,
    authors: ["Akira Sato", "Noah Bell"],
    venue: "AAAI",
    year: 2026,
    paperUrl: "https://example.com/aaai-2026-004",
    options: {
      track: "Main Conference",
      keywords: ["embodied ai", "navigation"]
    }
  },
  {
    id: "paper-neurips-001",
    sourceKey: NEURIPS_2025,
    sourcePaperId: "NIPS-2025-001",
    title: "Self-Correcting RAG Pipelines with Adaptive Evidence Selection",
    abstract:
      "We present a retrieval pipeline that learns when to query new evidence and when to revise generations, improving factuality under distribution shift.",
    authors: ["Lara Gupta", "Tom Becker"],
    venue: "NeurIPS",
    year: 2025,
    paperUrl: "https://example.com/neurips-2025-001",
    options: {
      track: "Datasets and Benchmarks",
      keywords: ["rag", "retrieval", "factuality"]
    }
  },
  {
    id: "paper-neurips-002",
    sourceKey: NEURIPS_2025,
    sourcePaperId: "NIPS-2025-002",
    title: "Sparse Mixture Routing for Open-Ended Tool Use",
    abstract:
      "Sparse routing across tool-specialized experts enables stronger open-ended tool use without retraining the base model for each domain.",
    authors: ["Daria Mendez", "Jules Porter"],
    venue: "NeurIPS",
    year: 2025,
    paperUrl: "https://example.com/neurips-2025-002",
    options: {
      track: "Main Track",
      keywords: ["tool use", "mixture of experts"]
    }
  },
  {
    id: "paper-neurips-003",
    sourceKey: NEURIPS_2025,
    sourcePaperId: "NIPS-2025-003",
    title: "Temporal Credit Assignment in Collaborative Agent Teams",
    abstract:
      "We investigate temporal credit assignment for agent teams operating over long episodes and introduce a shared hindsight training objective.",
    authors: ["Yan Li", "Priya Menon"],
    venue: "NeurIPS",
    year: 2025,
    paperUrl: "https://example.com/neurips-2025-003",
    options: {
      track: "Main Track",
      keywords: ["multi-agent", "reinforcement learning"]
    }
  },
  {
    id: "paper-neurips-004",
    sourceKey: NEURIPS_2025,
    sourcePaperId: "NIPS-2025-004",
    title: "Fast Preference Alignment for Small Language Models",
    abstract:
      "A compact preference alignment recipe boosts instruction following in small language models with modest compute requirements.",
    authors: ["Leah Kim", "Rafael Costa"],
    venue: "NeurIPS",
    year: 2025,
    paperUrl: "https://example.com/neurips-2025-004",
    options: {
      track: "Main Track",
      keywords: ["alignment", "small language models"]
    }
  },
  {
    id: "paper-iclr-001",
    sourceKey: ICLR_2026,
    sourcePaperId: "ICLR-2026-001",
    title: "Intent-Aware Query Rewriting for Domain-Specific Retrieval",
    abstract:
      "The model decomposes user intent before retrieval and improves recall for domain-specific document collections such as law and medicine.",
    authors: ["Emily Park", "Rui Zhang"],
    venue: "ICLR",
    year: 2026,
    paperUrl: "https://example.com/iclr-2026-001",
    options: {
      track: "Poster",
      keywords: ["query rewriting", "retrieval"]
    }
  },
  {
    id: "paper-iclr-002",
    sourceKey: ICLR_2026,
    sourcePaperId: "ICLR-2026-002",
    title: "Language Models as Coordinators for Scientific Discovery Agents",
    abstract:
      "We show how language models can coordinate simulation, literature review, and hypothesis refinement agents for scientific discovery loops.",
    authors: ["Anita Rao", "Morris Flynn"],
    venue: "ICLR",
    year: 2026,
    paperUrl: "https://example.com/iclr-2026-002",
    options: {
      track: "Oral",
      keywords: ["agents", "science", "coordination"]
    }
  },
  {
    id: "paper-iclr-003",
    sourceKey: ICLR_2026,
    sourcePaperId: "ICLR-2026-003",
    title: "Memory-Efficient Test-Time Adaptation with Lightweight Adapters",
    abstract: null,
    authors: ["Jon Svensson", "Hao Wu"],
    venue: "ICLR",
    year: 2026,
    paperUrl: "https://example.com/iclr-2026-003",
    options: {
      track: "Poster",
      keywords: ["adapters", "test-time adaptation"]
    }
  },
  {
    id: "paper-iclr-004",
    sourceKey: ICLR_2026,
    sourcePaperId: "ICLR-2026-004",
    title: "Retrieval Signals for Grounded Long-Context Reasoning",
    abstract:
      "Grounded long-context reasoning improves when retrieval signals are surfaced explicitly during generation and verification.",
    authors: ["Fatima Ali", "Leon Weber"],
    venue: "ICLR",
    year: 2026,
    paperUrl: "https://example.com/iclr-2026-004",
    options: {
      track: "Poster",
      keywords: ["long context", "retrieval", "reasoning"]
    }
  }
];
