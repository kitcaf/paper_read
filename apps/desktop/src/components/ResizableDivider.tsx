interface ResizableDividerProps {
  isHidden?: boolean;
  onPointerDown: (clientX: number) => void;
  onReset: () => void;
}

export function ResizableDivider({
  isHidden = false,
  onPointerDown,
  onReset
}: ResizableDividerProps) {
  return (
    <button
      aria-label="Resize panel"
      className={[
        "group relative flex items-stretch justify-center bg-transparent transition-all duration-300",
        isHidden ? "pointer-events-none w-0 opacity-0" : "w-[10px] cursor-col-resize opacity-100"
      ].join(" ")}
      type="button"
      onPointerDown={(event) => {
        event.preventDefault();
        onPointerDown(event.clientX);
      }}
      onDoubleClick={onReset}
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink-300/50 transition group-hover:bg-ink-500/60" />
      <span className="absolute left-1/2 top-1/2 h-12 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-300/60 transition group-hover:bg-ink-500" />
    </button>
  );
}
