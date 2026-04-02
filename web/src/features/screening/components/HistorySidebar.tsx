import type { ScreeningQuerySummary } from "@paper-read/shared";

interface HistorySidebarProps {
  queries: ScreeningQuerySummary[];
  selectedQueryId: string | null;
  onSelectQuery: (queryId: string) => void;
}

function buildHistoryMeta(query: ScreeningQuerySummary) {
  return `${query.sourceKey.toUpperCase()} · ${query.processedPapers}/${query.totalPapers}`;
}

export function HistorySidebar({
  queries,
  selectedQueryId,
  onSelectQuery
}: HistorySidebarProps) {
  return (
    <aside className="history-sidebar">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">History</p>
          <h2>Screening queries</h2>
        </div>
      </div>
      {queries.length ? (
        <ul className="history-list">
          {queries.map((query) => (
            <li key={query.id}>
              <button
                className={query.id === selectedQueryId ? "history-item is-active" : "history-item"}
                type="button"
                onClick={() => onSelectQuery(query.id)}
              >
                <span className="history-item__title">{query.queryTitle}</span>
                <span className="history-item__meta">{buildHistoryMeta(query)}</span>
                <span className={`status-pill status-pill--${query.status}`}>{query.status}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p>No screening history yet.</p>
          <p>Submit your first question to build a searchable paper shortlist.</p>
        </div>
      )}
    </aside>
  );
}
