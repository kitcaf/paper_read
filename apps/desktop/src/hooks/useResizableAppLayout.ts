import { useCallback, useEffect, useRef, useState } from "react";

type ResizeColumn = "left" | "right";

interface LayoutWidths {
  leftWidth: number;
  rightWidth: number;
  isLeftPanelCollapsed: boolean;
  isRightPanelCollapsed: boolean;
}

const STORAGE_KEY = "paper-read:workspace-layout:v3";

const HANDLE_WIDTH_PX = 10;
const DEFAULT_LEFT_WIDTH_PX = 264;
const DEFAULT_RIGHT_WIDTH_PX = 448;
const MIN_LEFT_WIDTH_PX = 232;
const MIN_RIGHT_WIDTH_PX = 360;
const MIN_CENTER_WIDTH_PX = 440;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readStoredWidths() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LayoutWidths>;
    if (
      typeof parsed.leftWidth !== "number" ||
      Number.isNaN(parsed.leftWidth) ||
      typeof parsed.rightWidth !== "number" ||
      Number.isNaN(parsed.rightWidth)
    ) {
      return null;
    }

    return {
      leftWidth: parsed.leftWidth,
      rightWidth: parsed.rightWidth,
      isLeftPanelCollapsed: Boolean(parsed.isLeftPanelCollapsed),
      isRightPanelCollapsed: Boolean(parsed.isRightPanelCollapsed)
    } satisfies LayoutWidths;
  } catch {
    return null;
  }
}

function writeStoredWidths(widths: LayoutWidths) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  } catch (error) {
    console.warn("Failed to persist workspace layout widths.", error);
  }
}

function clampLayoutWidths(containerWidth: number, widths: LayoutWidths) {
  const contentWidth = Math.max(containerWidth - HANDLE_WIDTH_PX * 2, 0);
  const minimumRequiredWidth =
    MIN_LEFT_WIDTH_PX + MIN_CENTER_WIDTH_PX + MIN_RIGHT_WIDTH_PX;

  if (contentWidth <= minimumRequiredWidth) {
    const fallbackLeftWidth = clamp(
      Math.round(contentWidth * 0.2),
      180,
      Math.max(180, contentWidth - 420)
    );
    const fallbackRightWidth = clamp(
      Math.round(contentWidth * 0.32),
      260,
      Math.max(260, contentWidth - fallbackLeftWidth - 260)
    );

    return {
      leftWidth: fallbackLeftWidth,
      rightWidth: fallbackRightWidth,
      isLeftPanelCollapsed: widths.isLeftPanelCollapsed,
      isRightPanelCollapsed: widths.isRightPanelCollapsed
    } satisfies LayoutWidths;
  }

  const leftMaxWidth = contentWidth - MIN_CENTER_WIDTH_PX - MIN_RIGHT_WIDTH_PX;
  const leftWidth = clamp(widths.leftWidth, MIN_LEFT_WIDTH_PX, leftMaxWidth);

  const rightMaxWidth = contentWidth - leftWidth - MIN_CENTER_WIDTH_PX;
  const rightWidth = clamp(widths.rightWidth, MIN_RIGHT_WIDTH_PX, rightMaxWidth);

  return {
    leftWidth,
    rightWidth,
    isLeftPanelCollapsed: widths.isLeftPanelCollapsed,
    isRightPanelCollapsed: widths.isRightPanelCollapsed
  } satisfies LayoutWidths;
}

export function useResizableAppLayout() {
  const containerRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<{
    column: ResizeColumn;
    startClientX: number;
    startWidths: LayoutWidths;
  } | null>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [layoutWidths, setLayoutWidths] = useState<LayoutWidths>(() => {
    return (
      readStoredWidths() ?? {
        leftWidth: DEFAULT_LEFT_WIDTH_PX,
        rightWidth: DEFAULT_RIGHT_WIDTH_PX,
        isLeftPanelCollapsed: false,
        isRightPanelCollapsed: false
      }
    );
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width;
      if (!nextWidth) {
        return;
      }

      setContainerWidth(nextWidth);
      setLayoutWidths((currentWidths) => clampLayoutWidths(nextWidth, currentWidths));
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    writeStoredWidths(layoutWidths);
  }, [layoutWidths]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || !containerWidth) {
        return;
      }

      setLayoutWidths(() => {
        if (dragState.column === "left") {
          const nextLeftWidth =
            dragState.startWidths.leftWidth + (event.clientX - dragState.startClientX);

          return clampLayoutWidths(containerWidth, {
            leftWidth: nextLeftWidth,
            rightWidth: dragState.startWidths.rightWidth,
            isLeftPanelCollapsed: false,
            isRightPanelCollapsed: dragState.startWidths.isRightPanelCollapsed
          });
        }

        const nextRightWidth =
          dragState.startWidths.rightWidth + (dragState.startClientX - event.clientX);

        return clampLayoutWidths(containerWidth, {
          leftWidth: dragState.startWidths.leftWidth,
          rightWidth: nextRightWidth,
          isLeftPanelCollapsed: dragState.startWidths.isLeftPanelCollapsed,
          isRightPanelCollapsed: false
        });
      });
    },
    [containerWidth]
  );

  const handlePointerUp = useCallback(() => {
    dragStateRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleStartResizing = useCallback(
    (column: ResizeColumn, clientX: number) => {
      dragStateRef.current = {
        column,
        startClientX: clientX,
        startWidths: layoutWidths
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [handlePointerMove, handlePointerUp, layoutWidths]
  );

  const handleResetWidth = useCallback(
    (column: ResizeColumn) => {
      setLayoutWidths((currentWidths) =>
        clampLayoutWidths(containerWidth, {
          leftWidth:
            column === "left" ? DEFAULT_LEFT_WIDTH_PX : currentWidths.leftWidth,
          rightWidth:
            column === "right" ? DEFAULT_RIGHT_WIDTH_PX : currentWidths.rightWidth,
          isLeftPanelCollapsed: currentWidths.isLeftPanelCollapsed,
          isRightPanelCollapsed: currentWidths.isRightPanelCollapsed
        })
      );
    },
    [containerWidth]
  );

  const handleTogglePanel = useCallback((column: ResizeColumn) => {
    setLayoutWidths((currentWidths) => {
      if (column === "left") {
        return {
          ...currentWidths,
          isLeftPanelCollapsed: !currentWidths.isLeftPanelCollapsed
        };
      }

      return {
        ...currentWidths,
        isRightPanelCollapsed: !currentWidths.isRightPanelCollapsed
      };
    });
  }, []);

  return {
    containerRef,
    leftWidth: layoutWidths.leftWidth,
    rightWidth: layoutWidths.rightWidth,
    isLeftPanelCollapsed: layoutWidths.isLeftPanelCollapsed,
    isRightPanelCollapsed: layoutWidths.isRightPanelCollapsed,
    handleStartResizing,
    handleResetWidth,
    handleTogglePanel
  };
}
