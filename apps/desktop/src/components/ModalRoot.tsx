import type { ReactNode } from "react";
import { useEffect } from "react";

interface ModalRootProps {
  open: boolean;
  ariaLabelledBy?: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}

export function ModalRoot({
  open,
  ariaLabelledBy,
  className,
  onClose,
  children
}: ModalRootProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-3 sm:p-5">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-ink-900/28 backdrop-blur-[3px]"
        type="button"
        onClick={onClose}
      />

      <div
        aria-labelledby={ariaLabelledBy}
        aria-modal="true"
        className={className}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
}
