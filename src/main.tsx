import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import "./infrastructure/browser/tauriRuntimeDiagnostics";
import "@mui/material-pigment-css/styles.css";
import { ThemeProvider } from "@mui/material/styles";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { createRoot } from "react-dom/client";
import "./assets/global.css";
import { getCspNonce } from "./infrastructure/browser/getCspNonce";
import { App } from "./presentation/App";
import { appTheme } from "./presentation/theme";

const emotionCache = createCache(
  pipe(
    getCspNonce(),
    O.fold(
      () => ({ key: "css" }),
      (nonce) => ({ key: "css", nonce }),
    ),
  ),
);

const rootElement = document.getElementById("root");

if (rootElement instanceof HTMLDivElement) {
  createRoot(rootElement).render(
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={appTheme}>
        <App />
      </ThemeProvider>
    </CacheProvider>,
  );
}
