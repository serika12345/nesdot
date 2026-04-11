import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
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
} from "../../../../App.styles";
import {
  CHARACTER_SELECTED_REGION_INSPECTOR_SECTION_CLASS_NAME,
  CHARACTER_SELECTED_REGION_PREVIEW_SURFACE_CLASS_NAME,
  CHARACTER_SELECTED_REGION_PREVIEW_SURFACE_ROOT_CLASS_NAME,
  CHARACTER_SELECTED_REGION_WIDE_TOOL_BUTTON_CLASS_NAME,
} from "../../../../styleClassNames";
import {
  useCharacterModeDecompositionOverview,
  useCharacterModeSelectedRegion,
} from "../../core/CharacterModeStateProvider";
import {
  getIssueLabel,
  getRegionStatusLabel,
} from "../../decomposition/decompositionRegionRules";
import { CharacterModeEditorCard } from "../../editor/CharacterModeEditorCard";
import { INSPECTOR_PREVIEW_SCALE } from "../../hooks/characterModeConstants";
import { CharacterModeTilePreview } from "../../preview/CharacterModeTilePreview";
import { SelectedRegionFieldGrid } from "../../primitives/CharacterModePrimitives";

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

        <div
          className={CHARACTER_SELECTED_REGION_PREVIEW_SURFACE_ROOT_CLASS_NAME}
        >
          <Stack
            className={CHARACTER_SELECTED_REGION_PREVIEW_SURFACE_CLASS_NAME}
            minHeight="6.75rem"
            alignItems="center"
            justifyContent="center"
          >
            <CharacterModeTilePreview
              scale={INSPECTOR_PREVIEW_SCALE}
              tileOption={pipe(
                selectedRegion.selectedRegionAnalysis,
                O.chain((regionAnalysis) => regionAnalysis.tile),
              )}
            />
          </Stack>
        </div>

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
              <Stack
                className={
                  CHARACTER_SELECTED_REGION_INSPECTOR_SECTION_CLASS_NAME
                }
                spacing={1.25}
                useFlexGap
              >
                <SelectedRegionFieldGrid>
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
                </SelectedRegionFieldGrid>

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
              </Stack>
            ),
          ),
        )}

        <ToolButton
          className={CHARACTER_SELECTED_REGION_WIDE_TOOL_BUTTON_CLASS_NAME}
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
        </ToolButton>
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
