import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.tsx";
import { ContentProvider } from "./content/ContentProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <ContentProvider>
        <App />
      </ContentProvider>
    </HelmetProvider>
  </StrictMode>
);
