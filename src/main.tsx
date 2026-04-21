import "./infrastructure/browser/tauriRuntimeDiagnostics";
import "@mui/material-pigment-css/styles.css";
import { ThemeProvider } from "@mui/material/styles";
import { createRoot } from "react-dom/client";
import "./assets/global.css";
import { App } from "./presentation/App";
import { appTheme } from "./presentation/theme";

const rootElement = document.getElementById("root");

if (rootElement instanceof HTMLDivElement) {
  createRoot(rootElement).render(
    <ThemeProvider theme={appTheme}>
      <App />
    </ThemeProvider>,
  );
}
