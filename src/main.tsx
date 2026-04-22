import "./infrastructure/browser/tauriRuntimeDiagnostics";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { createRoot } from "react-dom/client";
import "./assets/global.css";
import { App } from "./presentation/App";

const rootElement = document.getElementById("root");

if (rootElement instanceof HTMLDivElement) {
  createRoot(rootElement).render(
    <Theme
      accentColor="teal"
      appearance="light"
      grayColor="slate"
      hasBackground={false}
      panelBackground="translucent"
      radius="large"
      scaling="100%"
    >
      <App />
    </Theme>,
  );
}
