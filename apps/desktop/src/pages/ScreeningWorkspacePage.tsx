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
    conversationHistory,
    selectedConversationId,
    selectedConversation,
    resultsPage,
    errorMessage,
    isBootstrapping,
    isSubmitting,
    isRefreshing,
    isPending,
    composerResetKey,
    onSubmitConversation,
    onSelectConversation,
    onStartNewChat,
    onRefreshCurrentConversation
  } = useScreeningWorkspace();
  const modelSettings = useModelSettings();
  const currentSourceLabel =
    selectedConversation?.mode === "screening" && selectedConversation.sourceKey
    ? formatSourceLabel(selectedConversation.sourceKey, sources)
    : null;
  const currentModelLabel =
    selectedConversation?.modelProfileName ??
    modelSettings.defaultProfile?.name ??
    "Model";

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
            title={selectedConversation?.title ?? "新对话"}
            sourceLabel={currentSourceLabel}
            modelLabel={currentModelLabel}
            isLeftPanelCollapsed={isLeftPanelCollapsed}
            isRightPanelCollapsed={isRightPanelCollapsed}
            onToggleLeftPanel={onToggleLeftPanel}
            onToggleRightPanel={onToggleRightPanel}
          />
        )}
        sidebar={({ onToggleSidebar }) => (
          <HistorySidebar
            conversations={conversationHistory}
            sources={sources}
            selectedConversationId={selectedConversationId}
            onSelectConversation={onSelectConversation}
            onCreateChat={onStartNewChat}
            onToggleSidebar={onToggleSidebar}
            onOpenSettings={modelSettings.onOpen}
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
                  conversation={selectedConversation}
                  resultsPage={resultsPage}
                  sources={sources}
                  isRefreshing={isRefreshing || isPending}
                  onRefresh={onRefreshCurrentConversation}
                />
              )}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-4 md:px-6 md:pb-6">
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-paper-50/96 via-paper-50/82 to-transparent" />
              <div className="pointer-events-auto mx-auto max-w-[980px]">
                <QueryComposer
                  sources={sources}
                  modelProfiles={modelSettings.profiles}
                  defaultSourceKey={
                    selectedConversation?.mode === "screening"
                      ? selectedConversation.sourceKey
                      : undefined
                  }
                  defaultModelProfileId={
                    selectedConversation?.modelProfileId ?? modelSettings.defaultProfile?.id
                  }
                  resetKey={composerResetKey}
                  isSubmitting={isSubmitting}
                  onSubmit={onSubmitConversation}
                />
              </div>
            </div>
          </section>
        }
        contextPanel={({ onToggleSidebar }) => (
          <ResultsPanel
            conversation={selectedConversation}
            resultsPage={resultsPage}
            sources={sources}
            isLoading={isRefreshing || isPending}
            onToggleSidebar={onToggleSidebar}
          />
        )}
      />

      <ModelSettingsDialog
        open={modelSettings.isOpen}
        profiles={modelSettings.profiles}
        isLoading={modelSettings.isLoading}
        isSaving={modelSettings.isSaving}
        isTesting={modelSettings.isTesting}
        testResult={modelSettings.testResult}
        errorMessage={modelSettings.errorMessage}
        onClose={modelSettings.onClose}
        onSaveProfile={modelSettings.onSaveProfile}
        onDeleteProfile={modelSettings.onDeleteProfile}
        onSetDefaultProfile={modelSettings.onSetDefaultProfile}
        onTestProfile={modelSettings.onTestProfile}
        onClearTestResult={modelSettings.onClearTestResult}
      />
    </>
  );
}
