import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
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
const rootElementOption = O.fromNullable(rootElement);

if (O.isSome(rootElementOption)) {
  createRoot(rootElementOption.value).render(
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={appTheme}>
        <App />
      </ThemeProvider>
    </CacheProvider>,
  );
}
