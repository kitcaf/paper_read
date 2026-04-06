import { PanelLeft, PanelRight, SlidersHorizontal } from "lucide-react";

interface WorkspaceHeaderProps {
  title: string;
  sourceLabel?: string | null;
  modelLabel?: string | null;
  isLeftPanelCollapsed: boolean;
  isRightPanelCollapsed: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onOpenModelSettings: () => void;
}

function getPanelControlClassName(isCollapsed: boolean) {
  return [
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition",
    isCollapsed
      ? "border-ink-300/55 bg-white text-ink-900 shadow-[0_8px_20px_rgba(24,37,47,0.08)]"
      : "border-transparent text-ink-500 hover:border-ink-300/45 hover:bg-white/80 hover:text-ink-900"
  ].join(" ");
}

export function WorkspaceHeader({
  title,
  sourceLabel,
  modelLabel,
  isLeftPanelCollapsed,
  isRightPanelCollapsed,
  onToggleLeftPanel,
  onToggleRightPanel,
  onOpenModelSettings
}: WorkspaceHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-ink-300/35 bg-paper-50/55 px-3 md:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label={isLeftPanelCollapsed ? "Show history sidebar" : "Hide history sidebar"}
          className={getPanelControlClassName(isLeftPanelCollapsed)}
          type="button"
          onClick={onToggleLeftPanel}
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium text-ink-900">{title}</h1>
          {sourceLabel ? (
            <p className="mt-0.5 truncate text-xs text-ink-500">{sourceLabel}</p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {modelLabel ? (
          <span className="hidden rounded-full border border-ink-300/55 px-3 py-1 text-xs text-ink-500 2xl:inline-flex">
            {modelLabel}
          </span>
        ) : null}
        {sourceLabel ? (
          <span className="hidden rounded-full border border-ink-300/55 px-3 py-1 text-xs text-ink-500 xl:inline-flex">
            {sourceLabel}
          </span>
        ) : null}
        <button
          aria-label="Open model settings"
          className={getPanelControlClassName(false)}
          type="button"
          onClick={onOpenModelSettings}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        <button
          aria-label={isRightPanelCollapsed ? "Show paper sidebar" : "Hide paper sidebar"}
          className={getPanelControlClassName(isRightPanelCollapsed)}
          type="button"
          onClick={onToggleRightPanel}
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
