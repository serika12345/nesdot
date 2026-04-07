import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  OutlinedInput,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  Badge,
  DetailList,
  DetailRow,
  Field,
  FieldLabel,
  ToolButton,
} from "../../../App.styles";
import { CharacterModeEditorCard } from "../editor/CharacterModeEditorCard";
import {
  useCharacterModeDecompositionOverview,
  useCharacterModeSelectedRegion,
} from "../core/CharacterModeStateProvider";
import { CharacterModeTilePreview } from "../preview/CharacterModeTilePreview";
import {
  getIssueLabel,
  getRegionStatusLabel,
} from "../decomposition/decompositionRegionRules";
import { INSPECTOR_PREVIEW_SCALE } from "../hooks/useCharacterModeState";

const RegionPreviewSurfaceRoot = styled("div")({
  borderRadius: "1.125rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.92))",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
});

const RegionPreviewSurface = styled(Stack)({
  minHeight: "6.75rem",
  alignItems: "center",
  justifyContent: "center",
});

const InspectorSection = styled(Stack)({
  gap: "0.625rem",
});

const InspectorFieldGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "1.5rem",
});

const WideToolButton = styled(ToolButton)({
  width: "100%",
});

/**
 * 分解モードで選択中の領域詳細を表示するカードです。
 */
export const CharacterModeSelectedRegionCard: React.FC = () => {
  const decompositionOverview = useCharacterModeDecompositionOverview();
  const selectedRegion = useCharacterModeSelectedRegion();
  const [isApplyFeedbackDialogOpen, setIsApplyFeedbackDialogOpen] =
    React.useState(false);
  const applyFeedbackDialogTitleId = React.useId();

  const handleCloseApplyFeedbackDialog = () => {
    setIsApplyFeedbackDialogOpen(false);
  };

  const handleApplyDecomposition = () => {
    if (decompositionOverview.handleApplyDecomposition()) {
      setIsApplyFeedbackDialogOpen(true);
    }
  };

  return (
    <>
      <CharacterModeEditorCard
        minHeight={0}
        spacing="0.875rem"
        p="1rem"
        useFlexGap
      >
        <div>
          <FieldLabel>選択中の領域</FieldLabel>
        </div>

        <RegionPreviewSurfaceRoot>
          <RegionPreviewSurface>
            <CharacterModeTilePreview
              scale={INSPECTOR_PREVIEW_SCALE}
              tileOption={pipe(
                selectedRegion.selectedRegionAnalysis,
                O.chain((regionAnalysis) => regionAnalysis.tile),
              )}
            />
          </RegionPreviewSurface>
        </RegionPreviewSurfaceRoot>

        <DetailList>
          <DetailRow>
            <FieldLabel>領域数</FieldLabel>
            <Badge tone="accent">
              {decompositionOverview.decompositionAnalysis.regions.length}
            </Badge>
          </DetailRow>
          <DetailRow>
            <FieldLabel>有効 / 無効</FieldLabel>
            <Badge
              tone={
                decompositionOverview.decompositionInvalidRegionCount > 0
                  ? "danger"
                  : "neutral"
              }
            >
              {`${decompositionOverview.decompositionValidRegionCount} / ${decompositionOverview.decompositionInvalidRegionCount}`}
            </Badge>
          </DetailRow>
          <DetailRow>
            <FieldLabel>再利用 / 新規</FieldLabel>
            <Badge tone="neutral">
              {`${decompositionOverview.decompositionAnalysis.reusableSpriteCount} / ${decompositionOverview.decompositionAnalysis.requiredNewSpriteCount}`}
            </Badge>
          </DetailRow>
        </DetailList>

        {pipe(
          selectedRegion.selectedRegionAnalysis,
          O.match(
            () => <></>,
            (regionAnalysis) => (
              <InspectorSection>
                <InspectorFieldGrid>
                  <Field>
                    <FieldLabel>x</FieldLabel>
                    <OutlinedInput
                      type="number"
                      value={regionAnalysis.region.x}
                      readOnly
                      inputProps={{
                        "aria-label": "選択中領域X座標",
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>y</FieldLabel>
                    <OutlinedInput
                      type="number"
                      value={regionAnalysis.region.y}
                      readOnly
                      inputProps={{
                        "aria-label": "選択中領域Y座標",
                      }}
                    />
                  </Field>
                </InspectorFieldGrid>

                <DetailList>
                  <DetailRow>
                    <FieldLabel>状態</FieldLabel>
                    <Badge
                      tone={
                        regionAnalysis.issues.length > 0 ? "danger" : "accent"
                      }
                    >
                      {getRegionStatusLabel(regionAnalysis)}
                    </Badge>
                  </DetailRow>
                  <DetailRow>
                    <FieldLabel>issues</FieldLabel>
                    <Badge
                      tone={
                        regionAnalysis.issues.length > 0 ? "danger" : "neutral"
                      }
                    >
                      {regionAnalysis.issues.length > 0
                        ? regionAnalysis.issues.map(getIssueLabel).join(", ")
                        : "none"}
                    </Badge>
                  </DetailRow>
                </DetailList>
              </InspectorSection>
            ),
          ),
        )}

        <WideToolButton
          type="button"
          tone="primary"
          disabled={
            O.isNone(decompositionOverview.activeSet) ||
            decompositionOverview.decompositionAnalysis.regions.length === 0 ||
            decompositionOverview.decompositionAnalysis.canApply === false
          }
          onClick={handleApplyDecomposition}
        >
          分解して現在のセットへ反映
        </WideToolButton>
      </CharacterModeEditorCard>

      <Dialog
        open={isApplyFeedbackDialogOpen}
        onClose={handleCloseApplyFeedbackDialog}
        aria-labelledby={applyFeedbackDialogTitleId}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id={applyFeedbackDialogTitleId}>
          現在のセットへ反映しました
        </DialogTitle>
        <DialogContent>分解結果を現在のセットへ反映しました。</DialogContent>
        <DialogActions>
          <ToolButton type="button" onClick={handleCloseApplyFeedbackDialog}>
            閉じる
          </ToolButton>
        </DialogActions>
      </Dialog>
    </>
  );
};
