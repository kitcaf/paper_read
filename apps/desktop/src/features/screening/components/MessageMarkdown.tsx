import { memo, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_TYPING_STEP = 3;
const DEFAULT_TYPING_INTERVAL_MS = 18;

interface MessageMarkdownProps {
  content: string;
  animate?: boolean;
  streaming?: boolean;
}

interface MarkdownSegments {
  completedBlocks: string[];
  activeBlock: string;
}

function useAnimatedMarkdown(content: string, animate: boolean) {
  const [visibleLength, setVisibleLength] = useState(animate ? 0 : content.length);

  useEffect(() => {
    if (!animate) {
      setVisibleLength(content.length);
      return;
    }

    setVisibleLength(0);
    const timer = window.setInterval(() => {
      setVisibleLength((currentLength) => {
        if (currentLength >= content.length) {
          window.clearInterval(timer);
          return content.length;
        }

        return Math.min(currentLength + DEFAULT_TYPING_STEP, content.length);
      });
    }, DEFAULT_TYPING_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [animate, content]);

  return {
    animatedContent: content.slice(0, visibleLength),
    isAnimating: animate && visibleLength < content.length
  };
}

function normalizeMarkdownLine(value: string) {
  return value.replace(/\r/gu, "");
}

function isFenceLine(line: string) {
  return /^\s*```/u.test(line);
}

function isTableSeparatorLine(line: string) {
  return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+(?:\s*:?-{3,}:?\s*)?\|?\s*$/u.test(line);
}

function isTableRowLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  return trimmed.includes("|");
}

function trimBlock(block: string) {
  return block.replace(/\n+$/u, "").trim();
}

function pushCompletedBlock(blocks: string[], lines: string[]) {
  const nextBlock = trimBlock(lines.join("\n"));
  if (nextBlock) {
    blocks.push(nextBlock);
  }
}

function parseMarkdownSegments(content: string, allowActiveBlock: boolean): MarkdownSegments {
  if (!content.trim()) {
    return {
      completedBlocks: [],
      activeBlock: ""
    };
  }

  const lines = normalizeMarkdownLine(content).split("\n");
  const completedBlocks: string[] = [];
  let currentLines: string[] = [];
  let lineIndex = 0;
  let isInCodeFence = false;

  const flushCurrentLines = () => {
    if (!currentLines.length) {
      return;
    }

    pushCompletedBlock(completedBlocks, currentLines);
    currentLines = [];
  };

  while (lineIndex < lines.length) {
    const line = lines[lineIndex] ?? "";
    const nextLine = lines[lineIndex + 1] ?? "";

    if (isInCodeFence) {
      currentLines.push(line);
      lineIndex += 1;

      if (isFenceLine(line)) {
        isInCodeFence = false;
        flushCurrentLines();
      }
      continue;
    }

    if (isFenceLine(line)) {
      flushCurrentLines();
      currentLines.push(line);
      isInCodeFence = true;
      lineIndex += 1;
      continue;
    }

    if (isTableRowLine(line) && isTableSeparatorLine(nextLine)) {
      flushCurrentLines();
      const tableLines = [line, nextLine];
      lineIndex += 2;

      while (lineIndex < lines.length && isTableRowLine(lines[lineIndex] ?? "")) {
        tableLines.push(lines[lineIndex] ?? "");
        lineIndex += 1;
      }

      const tableBlock = trimBlock(tableLines.join("\n"));
      const hasTrailingBoundary = lineIndex < lines.length;
      const currentLine = lines[lineIndex] ?? "";

      if (
        allowActiveBlock &&
        (!hasTrailingBoundary || (currentLine.trim() !== "" && !isFenceLine(currentLine)))
      ) {
        return {
          completedBlocks,
          activeBlock: tableBlock
        };
      }

      if (tableBlock) {
        completedBlocks.push(tableBlock);
      }

      while (lineIndex < lines.length && !(lines[lineIndex] ?? "").trim()) {
        lineIndex += 1;
      }
      continue;
    }

    if (!line.trim()) {
      flushCurrentLines();
      lineIndex += 1;
      continue;
    }

    currentLines.push(line);
    lineIndex += 1;
  }

  if (!currentLines.length) {
    return {
      completedBlocks,
      activeBlock: ""
    };
  }

  const trailingBlock = trimBlock(currentLines.join("\n"));
  if (!trailingBlock) {
    return {
      completedBlocks,
      activeBlock: ""
    };
  }

  if (allowActiveBlock || isInCodeFence) {
    return {
      completedBlocks,
      activeBlock: trailingBlock
    };
  }

  return {
    completedBlocks: [...completedBlocks, trailingBlock],
    activeBlock: ""
  };
}

function createMarkdownComponents() {
  return {
    p: ({ children }: { children?: ReactNode }) => <p className="mb-4 last:mb-0">{children}</p>,
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="mb-4 list-disc space-y-2 pl-6 last:mb-0">{children}</ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="mb-4 list-decimal space-y-2 pl-6 last:mb-0">{children}</ol>
    ),
    li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="mb-4 border-l-2 border-ink-300/45 pl-4 text-ink-700/88 italic last:mb-0">
        {children}
      </blockquote>
    ),
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="mb-4 text-[1.55rem] font-semibold leading-tight text-ink-900 last:mb-0">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="mb-3 text-[1.28rem] font-semibold leading-tight text-ink-900 last:mb-0">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="mb-3 text-[1.08rem] font-semibold leading-tight text-ink-900 last:mb-0">
        {children}
      </h3>
    ),
    a: ({ children, href }: { children?: ReactNode; href?: string }) => (
      <a
        className="font-medium text-sky-500 underline decoration-sky-500/35 underline-offset-4"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {children}
      </a>
    ),
    code: ({
      children,
      className
    }: {
      children?: ReactNode;
      className?: string;
    }) => {
      const isBlock = Boolean(className);

      if (isBlock) {
        return (
          <code className="block overflow-x-auto rounded-2xl bg-ink-900 px-4 py-3 font-mono text-[0.82rem] leading-7 text-paper-50">
            {children}
          </code>
        );
      }

      return (
        <code className="rounded-md bg-paper-100 px-1.5 py-0.5 font-mono text-[0.84em] text-ink-900">
          {children}
        </code>
      );
    },
    pre: ({ children }: { children?: ReactNode }) => <div className="mb-4">{children}</div>,
    table: ({ children }: { children?: ReactNode }) => (
      <div className="mb-4 overflow-x-auto rounded-2xl border border-ink-300/35 bg-white/92 last:mb-0">
        <table className="min-w-full border-collapse text-left text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: ReactNode }) => (
      <thead className="bg-paper-50/85 text-ink-900">{children}</thead>
    ),
    tbody: ({ children }: { children?: ReactNode }) => (
      <tbody className="divide-y divide-ink-300/20">{children}</tbody>
    ),
    tr: ({ children }: { children?: ReactNode }) => <tr>{children}</tr>,
    th: ({ children }: { children?: ReactNode }) => (
      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
        {children}
      </th>
    ),
    td: ({ children }: { children?: ReactNode }) => (
      <td className="px-4 py-3 align-top text-sm leading-7 text-ink-800">{children}</td>
    )
  };
}

const markdownComponents = createMarkdownComponents();

const MarkdownBlock = memo(function MarkdownBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
});

function ActiveMarkdownBlock({ content }: { content: string }) {
  if (!content) {
    return null;
  }

  return <div className="whitespace-pre-wrap break-words">{content}</div>;
}

export function MessageMarkdown({
  content,
  animate = false,
  streaming = false
}: MessageMarkdownProps) {
  const { animatedContent, isAnimating } = useAnimatedMarkdown(content, animate);
  const segments = useMemo(
    () => parseMarkdownSegments(animatedContent, streaming || isAnimating),
    [animatedContent, isAnimating, streaming]
  );

  return (
    <div className="min-w-0 text-[15px] leading-8 text-ink-800">
      {segments.completedBlocks.map((block, index) => (
        <MarkdownBlock key={`${index}:${block.slice(0, 24)}`} content={block} />
      ))}

      {segments.activeBlock ? (
        streaming || isAnimating ? (
          <ActiveMarkdownBlock content={segments.activeBlock} />
        ) : (
          <MarkdownBlock content={segments.activeBlock} />
        )
      ) : null}
    </div>
  );
}
