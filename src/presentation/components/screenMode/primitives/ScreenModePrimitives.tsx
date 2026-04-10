import { Stack, type StackProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import {
  CanvasViewport,
  DetailList,
  DetailRow,
  PanelHeaderRow,
  ToolButton,
} from "../../../App.styles";

const createStackLayout = (
  displayName: string,
  defaultProps: StackProps,
  Root: typeof Stack = Stack,
) => {
  void displayName;

  return React.forwardRef<HTMLDivElement, StackProps>(
    function LayoutComponent(props, ref) {
      return <Root ref={ref} useFlexGap {...defaultProps} {...props} />;
    },
  );
};

export const TwoColumnFieldGrid = createStackLayout("TwoColumnFieldGrid", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.75rem",
  alignItems: "end",
});

export const ScreenModeEditorContent = createStackLayout(
  "ScreenModeEditorContent",
  {
    component: styled("div")({
      position: "relative",
      zIndex: 1,
      "& > * + *": {
        marginTop: "1rem",
        paddingTop: "1rem",
        borderTop: "0.0625rem solid rgba(148, 163, 184, 0.16)",
      },
    }),
  },
);

export const ScreenModeSection = createStackLayout("ScreenModeSection", {
  spacing: "0.875rem",
});

export const FullWidthField = createStackLayout("FullWidthField", {
  component: "label",
  spacing: "0.5rem",
  flexBasis: "100%",
});

export const GridActionRow = createStackLayout("GridActionRow", {
  flex: "1 1 10rem",
  justifyContent: "flex-end",
});

export const FullWidthActionRow = createStackLayout("FullWidthActionRow", {
  flexBasis: "100%",
  justifyContent: "flex-end",
});

const TallToolButton = styled(ToolButton)({
  minHeight: "3rem",
});

export const WideTallToolButton = styled(TallToolButton)({
  width: "100%",
});

export const ZoomControlsRow = styled(PanelHeaderRow)({
  justifyContent: "flex-start",
});

export const collapseChevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

export const ReadOnlyDetailRow = styled(DetailRow)({
  background: "transparent",
  border: "none",
  boxShadow: "none",
  padding: 0,
  borderRadius: 0,
});

export const FlipButtonGrid = createStackLayout("FlipButtonGrid", {
  direction: "row",
  spacing: "0.75rem",
  alignItems: "end",
});

export const FlipToolButton = styled(ToolButton)({
  flex: 1,
});

export const GroupActionButton = styled(TallToolButton)({
  width: "100%",
});

const PreviewViewportRoot = styled(CanvasViewport)({
  "&[data-active='false']": {
    cursor: "default",
  },
  "&[data-active='true']": {
    cursor: "grabbing",
  },
});

type PreviewViewportProps = React.ComponentProps<typeof CanvasViewport> & {
  active?: boolean;
};

export const PreviewViewport = React.forwardRef<
  HTMLDivElement,
  PreviewViewportProps
>(function PreviewViewport({ active, ...props }, ref) {
  return (
    <PreviewViewportRoot
      ref={ref}
      data-active={active === true ? "true" : "false"}
      flex={1}
      minHeight={0}
      p="1.5rem"
      {...props}
    />
  );
});

export const PreviewCanvasWrap = styled("div")({
  display: "grid",
  placeItems: "center",
  width: "max-content",
  height: "max-content",
  minWidth: "100%",
  minHeight: "100%",
});

export const WarningList = styled(DetailList)({
  flexShrink: 0,
});
