import * as O from "fp-ts/Option";
import { createRoot } from "react-dom/client";
import { App } from "./presentation/App";

const rootElement = document.getElementById("root");
const rootElementOption = O.fromNullable(rootElement);

if (O.isSome(rootElementOption)) {
  createRoot(rootElementOption.value).render(<App />);
}
