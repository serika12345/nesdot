import { alpha, createTheme } from "@mui/material/styles";

const ink = "#1e293b";
const lineBase = "#94a3b8";
const shadowBase = "#0f172a";

const appThemeBase = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f766e",
      dark: "#155e75",
      contrastText: "#f0fdfa",
    },
    secondary: {
      main: "#2dd4bf",
      dark: "#0f766e",
      contrastText: ink,
    },
    error: {
      main: "#be123c",
      dark: "#9f1239",
      contrastText: "#fff1f2",
    },
    info: {
      main: "#38bdf8",
      dark: "#0c4a6e",
      contrastText: "#f8fafc",
    },
    background: {
      default: "#0d1726",
      paper: alpha("#ffffff", 0.94),
    },
    text: {
      primary: shadowBase,
      secondary: "#64748b",
    },
    divider: alpha(lineBase, 0.22),
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily:
      '"Avenir Next", "SF Pro Display", "Segoe UI", "Helvetica Neue", sans-serif',
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
    h2: {
      fontSize: "1.5rem",
      lineHeight: 1.1,
      letterSpacing: "-0.03em",
      fontWeight: 700,
    },
  },
});

export const appTheme = createTheme(appThemeBase);
