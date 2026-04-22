import "./infrastructure/browser/tauriRuntimeDiagnostics";
import "@radix-ui/themes/styles.css";
import "@mui/material-pigment-css/styles.css";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "@mui/material/styles";
import { createRoot } from "react-dom/client";
import "./assets/global.css";
import { App } from "./presentation/App";
import { appTheme } from "./presentation/theme";

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
      <ThemeProvider theme={appTheme}>
        <App />
      </ThemeProvider>
    </Theme>,
  );
}
