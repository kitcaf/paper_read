import type { ScreeningQueryOptions, SourceSummary } from "@paper-read/shared";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

interface QueryComposerProps {
  sources: SourceSummary[];
  defaultSourceKey?: string;
  isSubmitting: boolean;
  onSubmit: (input: {
    sourceKey: string;
    queryText: string;
    options: ScreeningQueryOptions;
  }) => Promise<boolean> | boolean;
}

const DEFAULT_THRESHOLD = 0.58;

export function QueryComposer({
  sources,
  defaultSourceKey,
  isSubmitting,
  onSubmit
}: QueryComposerProps) {
  const [sourceKey, setSourceKey] = useState(defaultSourceKey ?? "");
  const [queryText, setQueryText] = useState("");
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [includeReasoning, setIncludeReasoning] = useState(true);

  useEffect(() => {
    if (sourceKey || !defaultSourceKey) {
      return;
    }

    setSourceKey(defaultSourceKey);
  }, [defaultSourceKey, sourceKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQueryText = queryText.trim();
    if (!sourceKey || !normalizedQueryText) {
      return;
    }

    const didSubmit = await onSubmit({
      sourceKey,
      queryText: normalizedQueryText,
      options: {
        threshold,
        includeReasoning
      }
    });

    if (didSubmit) {
      setQueryText("");
    }
  }

  return (
    <section className="workspace-card workspace-card--composer">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Query</p>
          <h1>Ask the system to shortlist papers</h1>
        </div>
        <p className="panel-description">
          Start with title-based screening. The stored data model already supports abstract-aware filtering later.
        </p>
      </div>
      <form className="composer-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Source</span>
          <select
            value={sourceKey}
            onChange={(event) => setSourceKey(event.target.value)}
            disabled={isSubmitting || !sources.length}
          >
            <option value="">Choose a source</option>
            {sources.map((source) => (
              <option key={source.sourceKey} value={source.sourceKey}>
                {source.label} ({source.paperCount})
              </option>
            ))}
          </select>
        </label>
        <label className="field field--grow">
          <span className="field__label">Question</span>
          <textarea
            rows={5}
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="Example: find papers about retrieval-augmented agents for long-horizon planning."
            disabled={isSubmitting}
          />
        </label>
        <div className="composer-options">
          <label className="field">
            <span className="field__label">Keep threshold</span>
            <select
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
              disabled={isSubmitting}
            >
              <option value={0.5}>0.50 · broad</option>
              <option value={0.58}>0.58 · balanced</option>
              <option value={0.68}>0.68 · strict</option>
            </select>
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={includeReasoning}
              onChange={(event) => setIncludeReasoning(event.target.checked)}
              disabled={isSubmitting}
            />
            <span>Include reasoning in the result list</span>
          </label>
        </div>
        <div className="composer-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting || !sources.length || !sourceKey || !queryText.trim()}
          >
            {isSubmitting ? "Screening..." : "Run screening"}
          </button>
        </div>
      </form>
    </section>
  );
}
