import type { ReactNode } from "react";
import { X } from "lucide-react";

import { ModalRoot } from "./ModalRoot";

interface ModalShellProps {
  open: boolean;
  title: string;
  description?: string;
  footer?: ReactNode;
  sizeClassName?: string;
  onClose: () => void;
  children: ReactNode;
}

export function ModalShell({
  open,
  title,
  description,
  footer,
  sizeClassName = "max-w-xl",
  onClose,
  children
}: ModalShellProps) {
  return (
    <ModalRoot
      ariaLabelledBy="modal-title"
      className={[
          "relative w-full overflow-hidden rounded-[28px] border border-white/75 bg-paper-50/96 shadow-[0_24px_80px_rgba(24,37,47,0.18)] backdrop-blur-2xl",
          sizeClassName
        ].join(" ")}
      open={open}
      onClose={onClose}
    >
        <div className="flex items-start justify-between gap-4 border-b border-ink-300/30 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink-900" id="modal-title">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-ink-500">{description}</p>
            ) : null}
          </div>

          <button
            aria-label="Close modal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-300/40 bg-white/75 text-ink-600 transition hover:border-ink-300/65 hover:bg-white hover:text-ink-900"
            type="button"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">{children}</div>

        {footer ? (
          <div className="border-t border-ink-300/30 px-5 py-4">{footer}</div>
        ) : null}
    </ModalRoot>
  );
}
