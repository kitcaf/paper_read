import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_TYPING_STEP = 3;
const DEFAULT_TYPING_INTERVAL_MS = 18;

interface MessageMarkdownProps {
  content: string;
  animate?: boolean;
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

  return content.slice(0, visibleLength);
}

export function MessageMarkdown({ content, animate = false }: MessageMarkdownProps) {
  const animatedContent = useAnimatedMarkdown(content, animate);
  const markdownComponents = useMemo(
    () => ({
      p: ({ children }: { children?: ReactNode }) => (
        <p className="mb-4 last:mb-0">{children}</p>
      ),
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
    }),
    []
  );

  return (
    <div className="min-w-0 text-[15px] leading-8 text-ink-800">
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {animatedContent}
      </ReactMarkdown>
    </div>
  );
}
