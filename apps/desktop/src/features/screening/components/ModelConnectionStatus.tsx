import type { ModelProfileTestResult } from "@paper-read/shared";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";

interface ModelConnectionStatusProps {
  isTesting: boolean;
  result: ModelProfileTestResult | null;
}

export function ModelConnectionStatus({ isTesting, result }: ModelConnectionStatusProps) {
  if (isTesting) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-ink-300/35 bg-paper-50/80 px-4 py-3 text-sm text-ink-600">
        <Loader2 className="mt-0.5 h-4 w-4 animate-spin" />
        <span>正在测试模型连接...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-ink-300/35 bg-paper-50/70 px-4 py-3 text-xs leading-5 text-ink-500">
        模型调用默认优先走流式接口；如果服务端或模型不支持，agent 会自动降级重试非流式请求。
      </div>
    );
  }

  return (
    <div
      className={[
        "flex min-w-0 items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        result.ok
          ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-700"
          : "border-coral-500/20 bg-coral-500/8 text-coral-500"
      ].join(" ")}
    >
      {result.ok ? (
        <CircleCheck className="mt-0.5 h-4 w-4" />
      ) : (
        <CircleAlert className="mt-0.5 h-4 w-4" />
      )}
      <div className="min-w-0 flex-1">
        <p className="max-h-28 overflow-y-auto whitespace-pre-wrap break-words font-medium leading-6 [overflow-wrap:anywhere]">
          {result.message}
        </p>
        <p className="mt-1 truncate text-xs opacity-80">
          {result.provider} · {result.modelName} · {result.latencyMs}ms
        </p>
      </div>
    </div>
  );
}
