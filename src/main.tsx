import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense
      fallback={
        <main className="loading-screen">
          <span>字</span>
          <strong>Đang mở gần 5.000 nhánh từ…</strong>
        </main>
      }
    >
      <App />
    </Suspense>
  </StrictMode>,
);
