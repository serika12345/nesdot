import React from "react";
import { MAX_SCREEN_SPRITES } from "../../../../domain/screen/constraints";
import {
  HelperText,
  MetricCard,
  MetricLabel,
  MetricValue,
} from "../../../App.styles";
import { SCREEN_SUMMARY_METRIC_CARD_CLASS_NAME } from "../../../styleClassNames";
import {
  ScreenModeSection,
  SummaryMetricGrid,
} from "../primitives/ScreenModePrimitives";

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
      <SummaryMetricGrid>
        <MetricCard
          className={SCREEN_SUMMARY_METRIC_CARD_CLASS_NAME}
          flex="1 1 8.75rem"
          p={0}
        >
          <MetricLabel>配置中</MetricLabel>
          <MetricValue>
            {spritesOnScreenCount}/{MAX_SCREEN_SPRITES}
          </MetricValue>
        </MetricCard>
      </SummaryMetricGrid>

      {hasConstraintViolation && (
        <HelperText>
          制約違反があります。必要なら「選択中のスプライト」を開いて調整してください。
        </HelperText>
      )}
    </ScreenModeSection>
  );
};
