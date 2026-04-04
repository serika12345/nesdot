import {
  Button,
  ButtonBase,
  Grid as MaterialGrid,
  Stack,
  type GridProps,
  type GridSize,
  type StackProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";

const shouldForwardActiveProp = (prop: PropertyKey): boolean =>
  prop !== "active";

const shouldForwardOpenProp = (prop: PropertyKey): boolean => prop !== "open";

const shouldForwardSwatchProp = (prop: PropertyKey): boolean =>
  prop !== "bg" && prop !== "transparent";

const shouldForwardInteractiveColorProp = (prop: PropertyKey): boolean =>
  prop !== "active" && prop !== "bg" && prop !== "transparent";

const createStackLayout = (
  displayName: string,
  defaultProps: StackProps,
  Root: typeof Stack = Stack,
) => {
  void displayName;
  const LayoutComponent = React.forwardRef<HTMLDivElement, StackProps>(
    function LayoutComponent(props, ref) {
      return <Root ref={ref} useFlexGap {...defaultProps} {...props} />;
    },
  );

  return LayoutComponent;
};

type UniformGridLayoutProps = Omit<
  GridProps,
  "columns" | "container" | "size" | "spacing"
>;

const createUniformGridLayout = (
  displayName: string,
  columns: number,
  itemSize: GridSize,
  spacing: number,
) => {
  void displayName;
  const LayoutComponent = React.forwardRef<
    HTMLDivElement,
    UniformGridLayoutProps
  >(function LayoutComponent({ children, ...props }, ref) {
    const childrenArray = React.Children.toArray(children);

    return (
      <MaterialGrid
        ref={ref}
        container
        columns={columns}
        spacing={spacing}
        {...props}
      >
        {childrenArray.map((child, index) => (
          <MaterialGrid key={`grid-item-${index}`} size={itemSize}>
            {child}
          </MaterialGrid>
        ))}
      </MaterialGrid>
    );
  });

  return LayoutComponent;
};

const RootSurface = styled("div")({
  position: "relative",
  zIndex: 1,
});

export const Root = createStackLayout("Root", {
  component: RootSurface,
  spacing: "1.125rem",
});

export const SelectionSummary = createStackLayout("SelectionSummary", {
  direction: "row",
  alignItems: "center",
  justifyContent: "space-between",
  spacing: "1rem",
});

export const SelectionDetails = styled("div")({
  minWidth: 0,
});

export const SelectionValue = styled("div")({
  marginTop: "0.375rem",
  fontSize: "1.3125rem",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "var(--ink-strong)",
});

export const SelectionSwatch = styled("div", {
  shouldForwardProp: shouldForwardSwatchProp,
})<{ bg?: string; transparent?: boolean }>(({ bg, transparent }) => ({
  width: "3.375rem",
  height: "3.375rem",
  borderRadius: "1.125rem",
  border: "0.0625rem solid rgba(148, 163, 184, 0.2)",
  boxShadow: "0 0.75rem 1.5rem rgba(15, 23, 42, 0.08)",
  background:
    transparent === true
      ? "repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%)"
      : (bg ?? "transparent"),
  ...(transparent === true ? { backgroundSize: "0.75rem 0.75rem" } : {}),
}));

export const DisclosureRow = createStackLayout("DisclosureRow", {
  direction: "row",
  spacing: "0.625rem",
  flexWrap: "wrap",
});

export const DisclosureButton = styled(Button, {
  shouldForwardProp: shouldForwardOpenProp,
})<{ open?: boolean }>(({ open }) => ({
  alignSelf: "flex-start",
  minWidth: "auto",
  borderRadius: "62.4375rem",
  padding: "0.5625rem 0.75rem",
  border: `0.0625rem solid ${open === true ? "var(--accent-border)" : "rgba(148, 163, 184, 0.18)"}`,
  background:
    open === true ? "var(--accent-soft)" : "rgba(248, 250, 252, 0.88)",
  color: open === true ? "var(--accent-solid)" : "var(--ink-soft)",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  boxShadow: "none",
  transition:
    "transform 160ms ease, background 160ms ease, border-color 160ms ease",
  "&:hover": {
    transform: "translateY(-0.0625rem)",
    background:
      open === true ? "var(--accent-soft-strong)" : "var(--surface-quiet)",
    boxShadow: "none",
  },
  "& .MuiButton-endIcon": {
    marginLeft: "0.5rem",
  },
}));

export const PaletteList = createStackLayout("PaletteList", {
  spacing: "0.75rem",
});

export const PaletteCard = styled(Stack, {
  shouldForwardProp: shouldForwardActiveProp,
})<{ active?: boolean }>(({ active }) => ({
  padding: "1rem",
  gap: "0.875rem",
  borderRadius: "1.375rem",
  background:
    active === true
      ? "linear-gradient(180deg, rgba(240, 253, 250, 0.96), rgba(236, 253, 245, 0.86))"
      : "var(--surface-muted)",
  border: `0.0625rem solid ${active === true ? "var(--accent-border)" : "var(--line-soft)"}`,
  boxShadow: active === true ? "var(--accent-shadow)" : "none",
}));

export const PaletteHeader = createStackLayout("PaletteHeader", {
  direction: "row",
  alignItems: "center",
  justifyContent: "space-between",
  spacing: "0.75rem",
});

export const PaletteName = styled("div")({
  fontSize: "1rem",
  fontWeight: 700,
  color: "var(--ink-strong)",
});

export const PaletteStatus = styled("span", {
  shouldForwardProp: shouldForwardActiveProp,
})<{ active?: boolean }>(({ active }) => ({
  padding: "0.375rem 0.625rem",
  borderRadius: "62.4375rem",
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: active === true ? "var(--accent-solid)" : "var(--ink-soft)",
  background:
    active === true ? "var(--accent-soft-strong)" : "rgba(148, 163, 184, 0.1)",
  border: `0.0625rem solid ${active === true ? "var(--accent-border)" : "rgba(148, 163, 184, 0.14)"}`,
}));

export const SlotRow = createUniformGridLayout("SlotRow", 4, 1, 1.25);

export const SlotGroup = styled(Stack, {
  shouldForwardProp: shouldForwardActiveProp,
})<{ active?: boolean }>(({ active }) => ({
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.625rem 0.5rem",
  borderRadius: "1.125rem",
  background:
    active === true ? "var(--accent-soft)" : "rgba(255, 255, 255, 0.58)",
  border: `0.0625rem solid ${active === true ? "var(--accent-border)" : "rgba(148, 163, 184, 0.1)"}`,
}));

export const SlotLabel = styled("div")({
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "var(--ink-soft)",
});

export const SlotButton = styled(ButtonBase, {
  shouldForwardProp: shouldForwardInteractiveColorProp,
})<{ active?: boolean; transparent?: boolean; bg?: string }>(
  ({ active, bg, transparent }) => ({
    width: "2.625rem",
    height: "2.625rem",
    borderRadius: "0.875rem",
    border:
      active === true
        ? "0.1875rem solid var(--accent-solid)"
        : "0.0625rem solid rgba(148, 163, 184, 0.28)",
    boxShadow:
      active === true
        ? "0 0.75rem 1.5rem rgba(15, 118, 110, 0.16)"
        : "0 0.5rem 1rem rgba(15, 23, 42, 0.06)",
    background:
      transparent === true
        ? "repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%)"
        : (bg ?? "transparent"),
    ...(transparent === true ? { backgroundSize: "0.625rem 0.625rem" } : {}),
    transition:
      "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
    "&:hover": {
      transform: "translateY(-0.0625rem)",
    },
  }),
);

const ScrollWrapRoot = styled("div")({
  borderRadius: "1.5rem",
  background: "var(--surface-muted)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.14)",
});

export const ScrollWrap = createStackLayout("ScrollWrap", {
  component: ScrollWrapRoot,
  spacing: "0.875rem",
  p: "1rem",
});

export const LibraryHeader = createStackLayout("LibraryHeader", {
  direction: "row",
  alignItems: "center",
  justifyContent: "space-between",
  spacing: "1rem",
});

export const LibraryCaption = styled("div")({
  marginTop: "0.25rem",
  fontSize: "0.75rem",
  color: "var(--ink-soft)",
});

export const Grid = createUniformGridLayout("Grid", 8, 1, 1);

export const ColorCell = styled(ButtonBase, {
  shouldForwardProp: shouldForwardInteractiveColorProp,
})<{ bg: string; active?: boolean }>(({ active, bg }) => ({
  width: "100%",
  aspectRatio: "1",
  borderRadius: "0.75rem",
  background: bg,
  border:
    active === true
      ? "0.1875rem solid var(--ink-strong)"
      : "0.0625rem solid rgba(15, 23, 42, 0.08)",
  boxShadow:
    active === true
      ? "0 0.75rem 1.125rem rgba(15, 23, 42, 0.18)"
      : "0 0.5rem 0.875rem rgba(15, 23, 42, 0.08)",
  transition:
    "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
  "&:hover": {
    transform: "translateY(-0.0625rem)",
  },
}));

export const Note = styled("small")({
  fontSize: "0.75rem",
  lineHeight: 1.6,
  color: "var(--ink-soft)",
});
