import type { ReactNode } from "react";
import { memo, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_TYPING_STEP = 3;
const DEFAULT_TYPING_INTERVAL_MS = 18;

interface MessageMarkdownProps {
  content: string;
  animate?: boolean;
  streaming?: boolean;
}

type ActiveBlockKind = "text" | "table" | "code" | null;

interface MarkdownSegments {
  completedBlocks: string[];
  activeBlock: string;
  activeBlockKind: ActiveBlockKind;
}

interface IncrementalMarkdownParserState {
  completedBlocks: string[];
  activeLines: string[];
  activeBlockKind: ActiveBlockKind;
  lineBuffer: string;
  isInCodeFence: boolean;
}

const EMPTY_SEGMENTS: MarkdownSegments = {
  completedBlocks: [],
  activeBlock: "",
  activeBlockKind: null
};

function createParserState(): IncrementalMarkdownParserState {
  return {
    completedBlocks: [],
    activeLines: [],
    activeBlockKind: null,
    lineBuffer: "",
    isInCodeFence: false
  };
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

function normalizeMarkdownContent(value: string) {
  return value.replace(/\r/gu, "");
}

function trimBlock(block: string) {
  return block.replace(/\n+$/u, "").trim();
}

function isFenceLine(line: string) {
  return /^\s*```/u.test(line);
}

function countPipeCharacters(line: string) {
  return [...line].filter((character) => character === "|").length;
}

function looksLikeTableLine(line: string) {
  const trimmedLine = line.trim();
  if (!trimmedLine) {
    return false;
  }

  return trimmedLine.startsWith("|") || countPipeCharacters(trimmedLine) >= 2;
}

function isTableSeparatorLine(line: string) {
  return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+(?:\s*:?-{3,}:?\s*)?\|?\s*$/u.test(line);
}

function snapshotParserState(parser: IncrementalMarkdownParserState): MarkdownSegments {
  return {
    completedBlocks: parser.completedBlocks,
    activeBlock: trimBlock(
      [...parser.activeLines, parser.lineBuffer].filter(Boolean).join("\n")
    ),
    activeBlockKind: parser.activeBlockKind
  };
}

function finalizeActiveBlock(parser: IncrementalMarkdownParserState) {
  const blockContent = trimBlock([...parser.activeLines, parser.lineBuffer].join("\n"));
  if (blockContent) {
    parser.completedBlocks = [...parser.completedBlocks, blockContent];
  }

  parser.activeLines = [];
  parser.activeBlockKind = null;
  parser.lineBuffer = "";
  parser.isInCodeFence = false;
}

function appendLineToActiveBlock(parser: IncrementalMarkdownParserState, line: string) {
  parser.activeLines = [...parser.activeLines, line];
}

function beginActiveBlock(
  parser: IncrementalMarkdownParserState,
  kind: Exclude<ActiveBlockKind, null>,
  firstLine: string
) {
  parser.activeBlockKind = kind;
  parser.activeLines = [firstLine];
  parser.lineBuffer = "";
  parser.isInCodeFence = kind === "code";
}

function processMarkdownLine(parser: IncrementalMarkdownParserState, line: string) {
  if (parser.isInCodeFence) {
    appendLineToActiveBlock(parser, line);

    if (isFenceLine(line)) {
      finalizeActiveBlock(parser);
    }
    return;
  }

  if (parser.activeBlockKind === "table") {
    if (!line.trim()) {
      finalizeActiveBlock(parser);
      return;
    }

    if (looksLikeTableLine(line) || isTableSeparatorLine(line)) {
      appendLineToActiveBlock(parser, line);
      return;
    }

    finalizeActiveBlock(parser);
  }

  if (!line.trim()) {
    if (parser.activeBlockKind === "text") {
      finalizeActiveBlock(parser);
    }
    return;
  }

  if (isFenceLine(line)) {
    if (parser.activeBlockKind === "text") {
      finalizeActiveBlock(parser);
    }

    beginActiveBlock(parser, "code", line);
    return;
  }

  if (parser.activeBlockKind === null) {
    beginActiveBlock(parser, looksLikeTableLine(line) ? "table" : "text", line);
    return;
  }

  if (
    parser.activeBlockKind === "text" &&
    parser.activeLines.length === 1 &&
    looksLikeTableLine(parser.activeLines[0] ?? "") &&
    isTableSeparatorLine(line)
  ) {
    parser.activeBlockKind = "table";
    appendLineToActiveBlock(parser, line);
    return;
  }

  appendLineToActiveBlock(parser, line);
}

function appendMarkdownDelta(parser: IncrementalMarkdownParserState, delta: string) {
  if (!delta) {
    return;
  }

  const normalizedDelta = normalizeMarkdownContent(delta);
  let buffer = `${parser.lineBuffer}${normalizedDelta}`;
  parser.lineBuffer = "";

  while (buffer.length > 0) {
    const nextLineBreakIndex = buffer.indexOf("\n");
    if (nextLineBreakIndex < 0) {
      parser.lineBuffer = buffer;
      return;
    }

    const line = buffer.slice(0, nextLineBreakIndex);
    processMarkdownLine(parser, line);
    buffer = buffer.slice(nextLineBreakIndex + 1);
  }
}

function flushMarkdownParser(parser: IncrementalMarkdownParserState) {
  if (parser.lineBuffer) {
    processMarkdownLine(parser, parser.lineBuffer);
    parser.lineBuffer = "";
  }

  if (parser.activeBlockKind !== null) {
    finalizeActiveBlock(parser);
  }
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

function ActiveTextBlock({ content }: { content: string }) {
  if (!content) {
    return null;
  }

  return <div className="whitespace-pre-wrap break-words">{content}</div>;
}

function PendingTableBlock() {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-ink-300/35 bg-white/92">
      <div className="border-b border-ink-300/18 bg-paper-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
        正在整理表格内容
      </div>
      <div className="divide-y divide-ink-300/14 px-4 py-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="grid grid-cols-3 gap-3 py-3">
            <span className="h-3.5 rounded-full bg-paper-100/90" />
            <span className="h-3.5 rounded-full bg-paper-100/90" />
            <span className="h-3.5 rounded-full bg-paper-100/90" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingCodeBlock() {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl bg-ink-900 px-4 py-3 font-mono text-[0.82rem] text-paper-50/86">
      <div className="mb-3 text-[0.72rem] uppercase tracking-[0.12em] text-paper-50/48">
        正在生成代码块
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-3.5 rounded-full bg-white/10"
            style={{ width: `${88 - (index % 3) * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function useIncrementalMarkdown(content: string, keepActiveBlock: boolean) {
  const parserRef = useRef(createParserState());
  const previousContentRef = useRef("");
  const [segments, setSegments] = useState<MarkdownSegments>(EMPTY_SEGMENTS);

  useEffect(() => {
    const parser = parserRef.current;
    const normalizedContent = normalizeMarkdownContent(content);
    const previousContent = previousContentRef.current;
    const shouldReset = !normalizedContent.startsWith(previousContent);

    if (shouldReset) {
      parserRef.current = createParserState();
    }

    const activeParser = parserRef.current;
    const delta = shouldReset
      ? normalizedContent
      : normalizedContent.slice(previousContent.length);

    appendMarkdownDelta(activeParser, delta);

    if (!keepActiveBlock) {
      flushMarkdownParser(activeParser);
    }

    previousContentRef.current = normalizedContent;
    setSegments(snapshotParserState(activeParser));
  }, [content, keepActiveBlock]);

  return segments;
}

export function MessageMarkdown({
  content,
  animate = false,
  streaming = false
}: MessageMarkdownProps) {
  const { animatedContent, isAnimating } = useAnimatedMarkdown(content, animate);
  const keepActiveBlock = streaming || isAnimating;
  const segments = useIncrementalMarkdown(animatedContent, keepActiveBlock);

  return (
    <div className="min-w-0 text-[15px] leading-8 text-ink-800">
      {segments.completedBlocks.map((block, index) => (
        <MarkdownBlock key={`${index}:${block.slice(0, 24)}`} content={block} />
      ))}

      {segments.activeBlock ? (
        segments.activeBlockKind === "table" ? (
          <PendingTableBlock />
        ) : segments.activeBlockKind === "code" ? (
          <PendingCodeBlock />
        ) : keepActiveBlock ? (
          <ActiveTextBlock content={segments.activeBlock} />
        ) : (
          <MarkdownBlock content={segments.activeBlock} />
        )
      ) : null}
    </div>
  );
}
