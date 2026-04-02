import type { ScreeningQueryDetail, ScreeningResultsPage } from "@paper-read/shared";

interface ResultsPanelProps {
  query: ScreeningQueryDetail | null;
  resultsPage: ScreeningResultsPage | null;
  isLoading: boolean;
}

function formatScore(score: number | null) {
  if (score === null) {
    return "—";
  }

  return score.toFixed(3);
}

export function ResultsPanel({
  query,
  resultsPage,
  isLoading
}: ResultsPanelProps) {
  if (!query) {
    return null;
  }

  return (
    <section className="workspace-card workspace-card--results">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Results</p>
          <h2>Ranked shortlist</h2>
        </div>
      </div>
      {resultsPage ? (
        <>
          <div className="summary-strip">
            <span className="summary-chip summary-chip--keep">Keep {resultsPage.summary.keepCount}</span>
            <span className="summary-chip summary-chip--uncertain">
              Uncertain {resultsPage.summary.uncertainCount}
            </span>
            <span className="summary-chip summary-chip--discard">
              Discard {resultsPage.summary.discardCount}
            </span>
            <span className="summary-chip summary-chip--failed">Failed {resultsPage.summary.failedCount}</span>
          </div>
          <div className="results-table-wrap">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Paper</th>
                  <th>Decision</th>
                  <th>Score</th>
                  <th>Reasoning</th>
                </tr>
              </thead>
              <tbody>
                {resultsPage.items.map((result) => (
                  <tr key={result.id}>
                    <td>
                      <strong>{result.paper.title}</strong>
                      <div className="table-meta">
                        <span>{result.paper.venue ?? "Unknown venue"}</span>
                        <span>{result.paper.year ?? "—"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-pill--${result.decision}`}>
                        {result.decision}
                      </span>
                    </td>
                    <td>{formatScore(result.score)}</td>
                    <td>{result.reasoning ?? "Reasoning disabled for this run."}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>{isLoading ? "Loading current results..." : "Results will appear once screening starts."}</p>
        </div>
      )}
    </section>
  );
}
