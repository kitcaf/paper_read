import { Outlet } from "react-router-dom";

import { useAppReady } from "../../hooks/useAppReady";

export function AppShell() {
  const { appName, backendBaseUrl } = useAppReady();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">AI Paper Reader</p>
          <h1>{appName}</h1>
        </div>
        <p className="endpoint-label">
          Backend:
          <code>{backendBaseUrl}</code>
        </p>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
