import type { CSSProperties, ReactNode } from "react";

import { useResizableAppLayout } from "./hooks/useResizableAppLayout";
import { ResizableDivider } from "./ResizableDivider";

export interface AppPanelControls {
  isLeftPanelCollapsed: boolean;
  isRightPanelCollapsed: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
}

interface AppLayoutProps {
  header: (controls: AppPanelControls) => ReactNode;
  sidebar: (controls: { onToggleSidebar: () => void }) => ReactNode;
  main: ReactNode;
  contextPanel: (controls: { onToggleSidebar: () => void }) => ReactNode;
}

export function AppLayout({ header, sidebar, main, contextPanel }: AppLayoutProps) {
  const {
    containerRef,
    leftWidth,
    rightWidth,
    isLeftPanelCollapsed,
    isRightPanelCollapsed,
    isResizing,
    handleStartResizing,
    handleResetWidth,
    handleTogglePanel
  } = useResizableAppLayout();

  const handleToggleLeftPanel = () => handleTogglePanel("left");
  const handleToggleRightPanel = () => handleTogglePanel("right");
  const panelControls: AppPanelControls = {
    isLeftPanelCollapsed,
    isRightPanelCollapsed,
    onToggleLeftPanel: handleToggleLeftPanel,
    onToggleRightPanel: handleToggleRightPanel
  };
  const layoutStyle = {
    "--left-panel-width": `${leftWidth}px`,
    "--right-panel-width": `${rightWidth}px`,
    gridTemplateColumns: `${isLeftPanelCollapsed ? "0px" : "var(--left-panel-width)"} ${isLeftPanelCollapsed ? "0px" : "10px"} minmax(0, 1fr) ${isRightPanelCollapsed ? "0px" : "10px"} ${isRightPanelCollapsed ? "0px" : "var(--right-panel-width)"}`
  } as CSSProperties;

  return (
    <main
      ref={containerRef}
      className={[
        "relative grid min-h-screen min-w-[1180px] w-full bg-paper-50 text-ink-900",
        isResizing ? "" : "transition-[grid-template-columns] duration-300 ease-out"
      ].join(" ")}
      style={layoutStyle}
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
          onToggleSidebar: handleToggleLeftPanel
        })}
      </div>

      <ResizableDivider
        isHidden={isLeftPanelCollapsed}
        onPointerDown={(clientX) => handleStartResizing("left", clientX)}
        onReset={() => handleResetWidth("left")}
      />

      <div className="flex min-h-screen min-w-0 flex-col bg-white/45">
        {header(panelControls)}
        <div className="min-h-0 flex-1">{main}</div>
      </div>

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
          onToggleSidebar: handleToggleRightPanel
        })}
      </div>
    </main>
  );
}
