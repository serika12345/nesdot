import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { MAX_SCREEN_SPRITES } from "../../../../domain/screen/constraints";
import {
  HelperText,
  MetricCard,
  MetricLabel,
  MetricValue,
} from "../../../App.styles";
import { ScreenModeSection } from "../primitives/ScreenModePrimitives";

const SummaryMetricGrid = styled(Stack)({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "0.75rem",
});

const SummaryMetricCard = styled(MetricCard)({
  flex: "1 1 8.75rem",
  background: "transparent",
  border: "none",
  boxShadow: "none",
  padding: 0,
});

interface ScreenModeSummaryPanelProps {
  spritesOnScreenCount: number;
  hasConstraintViolation: boolean;
}

/**
 * スクリーン配置の主要メトリクスを要約表示するセクションです。
 * 配置数を先頭で見せ、詳細編集に入る前に全体状態を把握しやすくします。
 */
export const ScreenModeSummaryPanel: React.FC<ScreenModeSummaryPanelProps> = ({
  spritesOnScreenCount,
  hasConstraintViolation,
}) => {
  return (
    <ScreenModeSection>
      <SummaryMetricGrid useFlexGap>
        <SummaryMetricCard>
          <MetricLabel>配置中</MetricLabel>
          <MetricValue>
            {spritesOnScreenCount}/{MAX_SCREEN_SPRITES}
          </MetricValue>
        </SummaryMetricCard>
      </SummaryMetricGrid>

      {hasConstraintViolation && (
        <HelperText>
          制約違反があります。必要なら「選択中のスプライト」を開いて調整してください。
        </HelperText>
      )}
    </ScreenModeSection>
  );
};
