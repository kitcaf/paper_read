import type { ReactNode } from "react";
import { PanelLeft, PanelRight } from "lucide-react";

import { ResizableDivider } from "./components/ResizableDivider";
import { useResizableAppLayout } from "./hooks/useResizableAppLayout";

interface AppLayoutProps {
  sidebar: (controls: { onToggleSidebar: () => void }) => ReactNode;
  main: ReactNode;
  contextPanel: (controls: { onToggleSidebar: () => void }) => ReactNode;
}

export function AppLayout({ sidebar, main, contextPanel }: AppLayoutProps) {
  const {
    containerRef,
    leftWidth,
    rightWidth,
    isLeftPanelCollapsed,
    isRightPanelCollapsed,
    handleStartResizing,
    handleResetWidth,
    handleTogglePanel
  } = useResizableAppLayout();

  return (
    <main
      ref={containerRef}
      className="relative grid min-h-screen min-w-[1180px] w-full bg-paper-50 text-ink-900 transition-[grid-template-columns] duration-300 ease-out"
      style={{
        gridTemplateColumns: `${isLeftPanelCollapsed ? 0 : leftWidth}px ${isLeftPanelCollapsed ? 0 : 10}px minmax(0, 1fr) ${isRightPanelCollapsed ? 0 : 10}px ${isRightPanelCollapsed ? 0 : rightWidth}px`
      }}
    >
      <div
        className={[
          "min-h-screen overflow-hidden bg-paper-50 transition-opacity duration-200",
          isLeftPanelCollapsed
            ? "pointer-events-none border-r-0 opacity-0"
            : "border-r border-ink-300/35 opacity-100"
        ].join(" ")}
      >
        {sidebar({
          onToggleSidebar: () => handleTogglePanel("left")
        })}
      </div>
      <ResizableDivider
        isHidden={isLeftPanelCollapsed}
        onPointerDown={(clientX) => handleStartResizing("left", clientX)}
        onReset={() => handleResetWidth("left")}
      />
      <div className="min-h-screen min-w-0 bg-white/45">{main}</div>
      <ResizableDivider
        isHidden={isRightPanelCollapsed}
        onPointerDown={(clientX) => handleStartResizing("right", clientX)}
        onReset={() => handleResetWidth("right")}
      />
      <div
        className={[
          "min-h-screen overflow-hidden bg-paper-50/70 transition-opacity duration-200",
          isRightPanelCollapsed
            ? "pointer-events-none border-l-0 opacity-0"
            : "border-l border-ink-300/35 opacity-100"
        ].join(" ")}
      >
        {contextPanel({
          onToggleSidebar: () => handleTogglePanel("right")
        })}
      </div>

      {isLeftPanelCollapsed ? (
        <button
          aria-label="Show history sidebar"
          className="absolute left-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-300/45 bg-white/92 text-ink-700 shadow-[0_8px_20px_rgba(24,37,47,0.08)] transition hover:bg-white hover:text-ink-900"
          type="button"
          onClick={() => handleTogglePanel("left")}
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      ) : null}

      {isRightPanelCollapsed ? (
        <button
          aria-label="Show paper sidebar"
          className="absolute right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-300/45 bg-white/92 text-ink-700 shadow-[0_8px_20px_rgba(24,37,47,0.08)] transition hover:bg-white hover:text-ink-900"
          type="button"
          onClick={() => handleTogglePanel("right")}
        >
          <PanelRight className="h-4 w-4" />
        </button>
      ) : null}
    </main>
  );
}
