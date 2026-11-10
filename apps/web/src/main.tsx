import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { bootstrapApp, type AppBootstrap } from "./bootstrap";
import "./styles.css";

function Root() {
  const [boot, setBoot] = useState<AppBootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    bootstrapApp()
      .then((b) => {
        if (!cancelled) {
          setBoot(b);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="boot-error">
        <p className="brand">Мир Квизов</p>
        <h1>Не удалось запустить</h1>
        <p>{error}</p>
        <p className="subtitle">
          Убедитесь, что bot-server HTTP API запущен на порту из VITE_API_BASE_URL.
        </p>
      </div>
    );
  }

  if (!boot) {
    return (
      <div className="boot-loading">
        <p className="brand">Мир Квизов</p>
        <p>Загрузка…</p>
      </div>
    );
  }

  return <App boot={boot} />;
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("#root missing");
}

createRoot(root).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
