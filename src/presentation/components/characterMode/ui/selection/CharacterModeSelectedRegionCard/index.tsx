import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { INSPECTOR_PREVIEW_SCALE } from "../../../logic/characterModeConstants";
import {
  getIssueLabel,
  getRegionStatusLabel,
} from "../../../logic/decomposition/decompositionRegionRules";
import {
  useCharacterModeDecompositionOverview,
  useCharacterModeSelectedRegion,
} from "../../../logic/characterModeDecompositionState";
import { useCharacterModeSpritePalettes } from "../../../logic/characterModeShared";
import { CharacterModeEditorCard } from "../../editor/CharacterModeEditorCard";
import { CharacterModeTilePreview } from "../../preview/CharacterModeTilePreview";
import { SelectedRegionFieldGrid } from "../../primitives/CharacterModePrimitives";

/**
 * 分解モードで選択中の領域詳細を表示するカードです。
 */
export const CharacterModeSelectedRegionCard: React.FC = () => {
  const decompositionOverview = useCharacterModeDecompositionOverview();
  const selectedRegion = useCharacterModeSelectedRegion();
  const spritePalettes = useCharacterModeSpritePalettes();
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
        <Typography variant="body2">選択中の領域</Typography>

        <Paper variant="outlined" style={{ borderRadius: "1.125rem" }}>
          <Stack
            minHeight="6.75rem"
            alignItems="center"
            justifyContent="center"
          >
            <CharacterModeTilePreview
              scale={INSPECTOR_PREVIEW_SCALE}
              spritePalettes={spritePalettes}
              tileOption={pipe(
                selectedRegion.selectedRegionAnalysis,
                O.chain((regionAnalysis) => regionAnalysis.tile),
              )}
            />
          </Stack>
        </Paper>

        <Stack spacing={0.75}>
          <Paper variant="outlined">
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              padding={1.5}
              useFlexGap
            >
              <Typography variant="body2" color="text.secondary">
                領域数
              </Typography>
              <Chip
                size="small"
                color="primary"
                label={
                  decompositionOverview.decompositionAnalysis.regions.length
                }
              />
            </Stack>
          </Paper>
          <Paper variant="outlined">
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              padding={1.5}
              useFlexGap
            >
              <Typography variant="body2" color="text.secondary">
                有効 / 無効
              </Typography>
              <Chip
                size="small"
                color={
                  decompositionOverview.decompositionInvalidRegionCount > 0
                    ? "error"
                    : "default"
                }
                label={`${decompositionOverview.decompositionValidRegionCount} / ${decompositionOverview.decompositionInvalidRegionCount}`}
              />
            </Stack>
          </Paper>
          <Paper variant="outlined">
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              padding={1.5}
              useFlexGap
            >
              <Typography variant="body2" color="text.secondary">
                再利用 / 新規
              </Typography>
              <Chip
                size="small"
                label={`${decompositionOverview.decompositionAnalysis.reusableSpriteCount} / ${decompositionOverview.decompositionAnalysis.requiredNewSpriteCount}`}
              />
            </Stack>
          </Paper>
        </Stack>

        {pipe(
          selectedRegion.selectedRegionAnalysis,
          O.match(
            () => <></>,
            (regionAnalysis) => (
              <Stack spacing={1.25} useFlexGap>
                <SelectedRegionFieldGrid>
                  <Stack component="label" spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      x
                    </Typography>
                    <OutlinedInput
                      size="small"
                      type="number"
                      value={regionAnalysis.region.x}
                      readOnly
                      inputProps={{
                        "aria-label": "選択中領域X座標",
                      }}
                    />
                  </Stack>
                  <Stack component="label" spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      y
                    </Typography>
                    <OutlinedInput
                      size="small"
                      type="number"
                      value={regionAnalysis.region.y}
                      readOnly
                      inputProps={{
                        "aria-label": "選択中領域Y座標",
                      }}
                    />
                  </Stack>
                </SelectedRegionFieldGrid>

                <Stack spacing={0.75}>
                  <Paper variant="outlined">
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                      padding={1.5}
                      useFlexGap
                    >
                      <Typography variant="body2" color="text.secondary">
                        状態
                      </Typography>
                      <Chip
                        size="small"
                        color={
                          regionAnalysis.issues.length > 0 ? "error" : "primary"
                        }
                        label={getRegionStatusLabel(regionAnalysis)}
                      />
                    </Stack>
                  </Paper>
                  <Paper variant="outlined">
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                      padding={1.5}
                      useFlexGap
                    >
                      <Typography variant="body2" color="text.secondary">
                        issues
                      </Typography>
                      <Chip
                        size="small"
                        color={
                          regionAnalysis.issues.length > 0 ? "error" : "default"
                        }
                        label={
                          regionAnalysis.issues.length > 0
                            ? regionAnalysis.issues
                                .map(getIssueLabel)
                                .join(", ")
                            : "none"
                        }
                      />
                    </Stack>
                  </Paper>
                </Stack>
              </Stack>
            ),
          ),
        )}

        <Button
          type="button"
          fullWidth
          size="small"
          variant="contained"
          disabled={
            O.isNone(decompositionOverview.activeSet) ||
            decompositionOverview.decompositionAnalysis.regions.length === 0 ||
            decompositionOverview.decompositionAnalysis.canApply === false
          }
          onClick={handleApplyDecomposition}
        >
          分解して現在のセットへ反映
        </Button>
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
          <Button type="button" onClick={handleCloseApplyFeedbackDialog}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
