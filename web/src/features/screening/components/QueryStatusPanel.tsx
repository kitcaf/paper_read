import type { ScreeningQueryDetail } from "@paper-read/shared";

interface QueryStatusPanelProps {
  query: ScreeningQueryDetail | null;
  isRefreshing: boolean;
  onRefresh: () => Promise<void> | void;
}

export function QueryStatusPanel({
  query,
  isRefreshing,
  onRefresh
}: QueryStatusPanelProps) {
  if (!query) {
    return (
      <section className="workspace-card">
        <div className="empty-state">
          <p>No screening query selected.</p>
          <p>Pick a history item or submit a new question to start screening.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-card">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Current run</p>
          <h2>{query.queryTitle}</h2>
        </div>
        <button className="secondary-button" type="button" onClick={() => void onRefresh()}>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <p className="panel-description">{query.intentSummary ?? "The screening agent is preparing the query intent."}</p>
      <dl className="metric-grid">
        <div className="metric-card">
          <dt>Status</dt>
          <dd>
            <span className={`status-pill status-pill--${query.status}`}>{query.status}</span>
          </dd>
        </div>
        <div className="metric-card">
          <dt>Processed</dt>
          <dd>
            {query.processedPapers}/{query.totalPapers}
          </dd>
        </div>
        <div className="metric-card">
          <dt>Matched</dt>
          <dd>{query.matchedPapers}</dd>
        </div>
        <div className="metric-card">
          <dt>Failed</dt>
          <dd>{query.failedPapers}</dd>
        </div>
      </dl>
      {query.lastError ? <p className="error-banner">{query.lastError}</p> : null}
    </section>
  );
}
