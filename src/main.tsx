import "@mui/material-pigment-css/styles.css";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import * as O from "fp-ts/Option";
import { createRoot } from "react-dom/client";
import { App } from "./presentation/App";
import { appTheme } from "./presentation/theme";

const rootElement = document.getElementById("root");
const rootElementOption = O.fromNullable(rootElement);

if (O.isSome(rootElementOption)) {
  createRoot(rootElementOption.value).render(
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>,
  );
}
