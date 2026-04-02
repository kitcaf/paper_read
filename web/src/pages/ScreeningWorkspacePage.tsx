import { HistorySidebar } from "../features/screening/components/HistorySidebar";
import { QueryComposer } from "../features/screening/components/QueryComposer";
import { QueryStatusPanel } from "../features/screening/components/QueryStatusPanel";
import { ResultsPanel } from "../features/screening/components/ResultsPanel";
import { useScreeningWorkspace } from "../features/screening/hooks/useScreeningWorkspace";

export function ScreeningWorkspacePage() {
  const {
    sources,
    queryHistory,
    selectedQueryId,
    selectedQuery,
    resultsPage,
    errorMessage,
    isBootstrapping,
    isSubmitting,
    isRefreshing,
    isPending,
    onSubmitQuery,
    onSelectQuery,
    onRefreshCurrentQuery
  } = useScreeningWorkspace();

  return (
    <main className="workspace-layout">
      <HistorySidebar
        queries={queryHistory}
        selectedQueryId={selectedQueryId}
        onSelectQuery={onSelectQuery}
      />
      <section className="workspace-main">
        <QueryComposer
          sources={sources}
          defaultSourceKey={selectedQuery?.sourceKey ?? sources[0]?.sourceKey}
          isSubmitting={isSubmitting}
          onSubmit={onSubmitQuery}
        />
        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
        {isBootstrapping ? (
          <section className="workspace-card">
            <div className="empty-state">
              <p>Loading screening workspace...</p>
            </div>
          </section>
        ) : (
          <>
            <QueryStatusPanel
              query={selectedQuery}
              isRefreshing={isRefreshing || isPending}
              onRefresh={onRefreshCurrentQuery}
            />
            <ResultsPanel
              query={selectedQuery}
              resultsPage={resultsPage}
              isLoading={isRefreshing || isPending}
            />
          </>
        )}
      </section>
    </main>
  );
}
