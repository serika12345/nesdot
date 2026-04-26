import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import React from "react";
import { createRoot } from "react-dom/client";
import "./assets/global.css";
import "./infrastructure/browser/tauriRuntimeDiagnostics";
import { useThemePreference } from "./infrastructure/browser/themePreference";
import { App } from "./presentation/App";

const rootElement = document.getElementById("root");

const RootThemeApp: React.FC = () => {
  const { resolvedThemeAppearance, setThemePreference, themePreference } =
    useThemePreference();

  return (
    <Theme
      accentColor="teal"
      appearance={resolvedThemeAppearance}
      grayColor="slate"
      hasBackground
      panelBackground="solid"
      radius="large"
      scaling="100%"
    >
      <App
        onThemePreferenceSelect={setThemePreference}
        themePreference={themePreference}
      />
    </Theme>
  );
};

if (rootElement instanceof HTMLDivElement) {
  createRoot(rootElement).render(<RootThemeApp />);
}
