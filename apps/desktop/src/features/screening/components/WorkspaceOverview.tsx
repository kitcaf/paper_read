import type { ScreeningQueryDetail, ScreeningResultsPage, SourceSummary } from "@paper-read/shared";

import { formatSourceLabel } from "../presentation";

interface WorkspaceOverviewProps {
  sources: SourceSummary[];
  selectedQuery: ScreeningQueryDetail | null;
  resultsPage: ScreeningResultsPage | null;
}

const workflowSteps = [
  "Select one curated source corpus",
  "Describe the research intent in plain language",
  "The assistant analyzes intent before screening titles",
  "The shortlist is ranked and reasoned back to you"
] as const;

export function WorkspaceOverview({
  sources,
  selectedQuery,
  resultsPage
}: WorkspaceOverviewProps) {
  return (
    <aside className="space-y-4">
      <section className="surface-panel px-5 py-5">
        <p className="soft-label">Mode</p>
        <h2 className="mt-3 font-display text-3xl leading-tight text-ink-900">
          Chat-first source screening
        </h2>
        <p className="mt-3 text-sm leading-7 text-ink-700">
          The UI behaves like a focused research conversation, but every prompt is executed as a
          constrained screening task against one selected paper source.
        </p>
        <ul className="mt-5 space-y-3">
          {workflowSteps.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-[20px] border border-ink-300/50 bg-paper-50/85 px-4 py-3"
            >
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-paper-50">
                {index + 1}
              </span>
              <span className="text-sm leading-6 text-ink-700">{step}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-panel px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="soft-label">Sources</p>
            <h2 className="mt-2 font-display text-3xl text-ink-900">Available corpora</h2>
          </div>
          <span className="rounded-full border border-ink-300/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
            {sources.length}
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          {sources.length ? (
            sources.map((source) => (
              <article
                key={source.sourceKey}
                className="rounded-[22px] border border-ink-300/50 bg-white/80 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-ink-900">{source.label}</h3>
                  <span className="text-sm font-semibold text-ink-500">{source.paperCount}</span>
                </div>
                <p className="mt-2 text-sm text-ink-600">
                  {source.hasAbstractCount} papers already carry abstracts for the next workflow
                  stage.
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-[22px] border border-dashed border-ink-300/70 px-4 py-5 text-sm text-ink-600">
              No sources are available yet. Once papers are imported, they will appear here as
              selectable corpora.
            </p>
          )}
        </div>
      </section>

      <section className="surface-panel px-5 py-5">
        <p className="soft-label">Active context</p>
        <h2 className="mt-2 font-display text-3xl text-ink-900">What the assistant sees</h2>
        {selectedQuery ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-[22px] bg-ink-900 px-4 py-4 text-paper-50">
              <p className="text-[0.72rem] uppercase tracking-[0.16em] text-paper-100/55">Source</p>
              <p className="mt-2 text-lg font-semibold">
                {formatSourceLabel(selectedQuery.sourceKey, sources)}
              </p>
              <p className="mt-3 text-sm leading-6 text-paper-100/80">{selectedQuery.queryText}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-ink-300/50 bg-paper-50/85 px-4 py-4">
                <p className="text-[0.72rem] uppercase tracking-[0.14em] text-ink-500">Matched</p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">{selectedQuery.matchedPapers}</p>
              </div>
              <div className="rounded-[20px] border border-ink-300/50 bg-paper-50/85 px-4 py-4">
                <p className="text-[0.72rem] uppercase tracking-[0.14em] text-ink-500">Processed</p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">
                  {selectedQuery.processedPapers}/{selectedQuery.totalPapers}
                </p>
              </div>
            </div>
            {resultsPage ? (
              <p className="text-sm leading-7 text-ink-700">
                The current shortlist contains {resultsPage.summary.keepCount} keep decisions,{" "}
                {resultsPage.summary.uncertainCount} uncertain decisions, and{" "}
                {resultsPage.summary.discardCount} discards.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 rounded-[22px] border border-dashed border-ink-300/70 px-4 py-5 text-sm leading-7 text-ink-600">
            Once you run or select a screening query, the assistant’s current intent, source, and
            shortlist metrics will be summarized here.
          </p>
        )}
      </section>
    </aside>
  );
}
