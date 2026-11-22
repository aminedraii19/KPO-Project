import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import "@fontsource-variable/figtree";
import "@fontsource-variable/plus-jakarta-sans";
import "./index.css";
import App from "./App";
import { TRPCProvider } from "./providers/trpc";
import { AuthProvider } from "./providers/auth";
import "./lib/logger";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <AuthProvider>
          <App />
          <Toaster theme="dark" position="bottom-right" closeButton />
        </AuthProvider>
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>,
);
