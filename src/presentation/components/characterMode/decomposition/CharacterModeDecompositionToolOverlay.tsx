import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { CharacterModeDecompositionToolCard } from "./CharacterModeDecompositionToolCard";

const OverlayRoot = styled("div")({
  position: "absolute",
  top: "1.125rem",
  left: "1.125rem",
  zIndex: 4,
  pointerEvents: "none",
});

const OverlayToggleButton = styled(Button)({
  pointerEvents: "auto",
});

const OverlayMenu = styled("div")({
  marginTop: "0.75rem",
  width: "20rem",
  pointerEvents: "auto",
});

const chevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

/**
 * 分解キャンバス上に重なるツールメニューを描画します。
 * ペン・消しゴム・切り取りとパレット操作をキャンバス近くに集約します。
 */
export const CharacterModeDecompositionToolOverlay: React.FC = () => {
  const [isToolsOpen, setIsToolsOpen] = React.useState(false);

  return (
    <OverlayRoot>
      <OverlayToggleButton
        type="button"
        variant={isToolsOpen ? "contained" : "outlined"}
        endIcon={<ExpandMoreRoundedIcon style={chevronStyle(isToolsOpen)} />}
        onClick={() => setIsToolsOpen((previous) => !previous)}
      >
        {isToolsOpen ? "分解ツールを閉じる" : "分解ツールを開く"}
      </OverlayToggleButton>

      {isToolsOpen === true ? (
        <OverlayMenu>
          <CharacterModeDecompositionToolCard />
        </OverlayMenu>
      ) : (
        <></>
      )}
    </OverlayRoot>
  );
};
