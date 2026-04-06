import { HistorySidebar } from "../features/screening/components/HistorySidebar";
import { ModelSettingsDialog } from "../features/screening/components/ModelSettingsDialog";
import { QueryComposer } from "../features/screening/components/QueryComposer";
import { QueryStatusPanel } from "../features/screening/components/QueryStatusPanel";
import { ResultsPanel } from "../features/screening/components/ResultsPanel";
import { WorkspaceHeader } from "../features/screening/components/WorkspaceHeader";
import { useModelSettings } from "../features/screening/hooks/useModelSettings";
import { useScreeningWorkspace } from "../features/screening/hooks/useScreeningWorkspace";
import { formatSourceLabel } from "../features/screening/presentation";
import { AppLayout } from "../layout/AppLayout";

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
    composerResetKey,
    onSubmitQuery,
    onSelectQuery,
    onStartNewChat,
    onRefreshCurrentQuery
  } = useScreeningWorkspace();
  const modelSettings = useModelSettings();
  const currentSourceLabel = selectedQuery
    ? formatSourceLabel(selectedQuery.sourceKey, sources)
    : null;
  const currentModelLabel = modelSettings.settings
    ? `${modelSettings.settings.provider} · ${modelSettings.settings.modelName}`
    : "Model";

  return (
    <>
      <AppLayout
        header={({
          isLeftPanelCollapsed,
          isRightPanelCollapsed,
          onToggleLeftPanel,
          onToggleRightPanel
        }) => (
          <WorkspaceHeader
            title={selectedQuery?.queryTitle ?? "新对话"}
            sourceLabel={currentSourceLabel}
            modelLabel={currentModelLabel}
            isLeftPanelCollapsed={isLeftPanelCollapsed}
            isRightPanelCollapsed={isRightPanelCollapsed}
            onToggleLeftPanel={onToggleLeftPanel}
            onToggleRightPanel={onToggleRightPanel}
            onOpenModelSettings={modelSettings.onOpen}
          />
        )}
        sidebar={({ onToggleSidebar }) => (
          <HistorySidebar
            queries={queryHistory}
            sources={sources}
            selectedQueryId={selectedQueryId}
            onSelectQuery={onSelectQuery}
            onCreateChat={onStartNewChat}
            onToggleSidebar={onToggleSidebar}
          />
        )}
        main={
          <section className="relative flex h-full min-w-0 flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto pb-[168px] md:pb-[182px]">
              {errorMessage ? (
                <div className="border-b border-coral-500/20 bg-coral-500/8 px-6 py-3 text-sm text-coral-500">
                  {errorMessage}
                </div>
              ) : null}

              {isBootstrapping ? (
                <div className="flex h-full items-center justify-center px-6 py-8 text-sm text-ink-500">
                  Loading workspace...
                </div>
              ) : (
                <QueryStatusPanel
                  query={selectedQuery}
                  resultsPage={resultsPage}
                  sources={sources}
                  isRefreshing={isRefreshing || isPending}
                  onRefresh={onRefreshCurrentQuery}
                />
              )}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-4 md:px-6 md:pb-6">
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-paper-50/96 via-paper-50/82 to-transparent" />
              <div className="pointer-events-auto mx-auto max-w-[980px]">
                <QueryComposer
                  sources={sources}
                  defaultSourceKey={selectedQuery?.sourceKey}
                  resetKey={composerResetKey}
                  isSubmitting={isSubmitting}
                  onSubmit={onSubmitQuery}
                />
              </div>
            </div>
          </section>
        }
        contextPanel={({ onToggleSidebar }) => (
          <ResultsPanel
            query={selectedQuery}
            resultsPage={resultsPage}
            sources={sources}
            isLoading={isRefreshing || isPending}
            onToggleSidebar={onToggleSidebar}
          />
        )}
      />

      <ModelSettingsDialog
        open={modelSettings.isOpen}
        settings={modelSettings.settings}
        isSaving={modelSettings.isSaving}
        errorMessage={modelSettings.errorMessage}
        onClose={modelSettings.onClose}
        onSave={modelSettings.onSave}
      />
    </>
  );
}
