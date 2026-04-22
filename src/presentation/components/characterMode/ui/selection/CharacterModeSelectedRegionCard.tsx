import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  AppBadge,
  AppButton,
  AppDialog,
  AppInput,
} from "../../../common/ui/forms/AppControls";
import { INSPECTOR_PREVIEW_SCALE } from "../../logic/characterModeConstants";
import {
  getIssueLabel,
  getRegionStatusLabel,
} from "../../logic/decomposition/decompositionRegionRules";
import {
  useCharacterModeDecompositionOverview,
  useCharacterModeSelectedRegion,
} from "../../logic/characterModeDecompositionState";
import { useCharacterModeSpritePalettes } from "../../logic/characterModeShared";
import { CharacterModeEditorCard } from "../editor/CharacterModeEditorCard";
import { CharacterModeTilePreview } from "../preview/CharacterModeTilePreview";
import { SelectedRegionFieldGrid } from "../primitives/CharacterModePrimitives";
import styles from "./CharacterModeSelectedRegionCard.module.css";

/**
 * 分解モードで選択中の領域詳細を表示するカードです。
 */
export const CharacterModeSelectedRegionCard: React.FC = () => {
  const decompositionOverview = useCharacterModeDecompositionOverview();
  const selectedRegion = useCharacterModeSelectedRegion();
  const spritePalettes = useCharacterModeSpritePalettes();
  const [isApplyFeedbackDialogOpen, setIsApplyFeedbackDialogOpen] =
    React.useState(false);

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
      <CharacterModeEditorCard className={styles.root}>
        <span className={styles.title}>選択中の領域</span>

        <div className={styles.previewFrame}>
          <div className={styles.previewCenter}>
            <CharacterModeTilePreview
              scale={INSPECTOR_PREVIEW_SCALE}
              spritePalettes={spritePalettes}
              tileOption={pipe(
                selectedRegion.selectedRegionAnalysis,
                O.chain((regionAnalysis) => regionAnalysis.tile),
              )}
            />
          </div>
        </div>

        <div className={styles.infoColumn}>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>領域数</span>
              <AppBadge tone="accent">
                {decompositionOverview.decompositionAnalysis.regions.length}
              </AppBadge>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>有効 / 無効</span>
              <AppBadge
                tone={
                  decompositionOverview.decompositionInvalidRegionCount > 0
                    ? "danger"
                    : "neutral"
                }
              >
                {`${decompositionOverview.decompositionValidRegionCount} / ${decompositionOverview.decompositionInvalidRegionCount}`}
              </AppBadge>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>再利用 / 新規</span>
              <AppBadge>
                {`${decompositionOverview.decompositionAnalysis.reusableSpriteCount} / ${decompositionOverview.decompositionAnalysis.requiredNewSpriteCount}`}
              </AppBadge>
            </div>
          </div>
        </div>

        {pipe(
          selectedRegion.selectedRegionAnalysis,
          O.match(
            () => <></>,
            (regionAnalysis) => (
              <div className={styles.detailsColumn}>
                <SelectedRegionFieldGrid>
                  <label className={styles.fieldLabel}>
                    <span className={styles.fieldCaption}>x</span>
                    <AppInput
                      type="number"
                      value={regionAnalysis.region.x}
                      readOnly
                      aria-label="選択中領域X座標"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span className={styles.fieldCaption}>y</span>
                    <AppInput
                      type="number"
                      value={regionAnalysis.region.y}
                      readOnly
                      aria-label="選択中領域Y座標"
                    />
                  </label>
                </SelectedRegionFieldGrid>

                <div className={styles.infoColumn}>
                  <div className={styles.infoCard}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>状態</span>
                      <AppBadge
                        tone={
                          regionAnalysis.issues.length > 0 ? "danger" : "accent"
                        }
                      >
                        {getRegionStatusLabel(regionAnalysis)}
                      </AppBadge>
                    </div>
                  </div>
                  <div className={styles.infoCard}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>issues</span>
                      <AppBadge
                        tone={
                          regionAnalysis.issues.length > 0
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {regionAnalysis.issues.length > 0
                          ? regionAnalysis.issues.map(getIssueLabel).join(", ")
                          : "none"}
                      </AppBadge>
                    </div>
                  </div>
                </div>
              </div>
            ),
          ),
        )}

        <AppButton
          fullWidth
          size="small"
          tone="accent"
          variant="solid"
          disabled={
            O.isNone(decompositionOverview.activeSet) ||
            decompositionOverview.decompositionAnalysis.regions.length === 0 ||
            decompositionOverview.decompositionAnalysis.canApply === false
          }
          onClick={handleApplyDecomposition}
        >
          分解して現在のセットへ反映
        </AppButton>
      </CharacterModeEditorCard>

      <AppDialog
        actions={
          <AppButton variant="outline" onClick={handleCloseApplyFeedbackDialog}>
            閉じる
          </AppButton>
        }
        open={isApplyFeedbackDialogOpen}
        size="small"
        title="現在のセットへ反映しました"
        onClose={handleCloseApplyFeedbackDialog}
      >
        <span>分解結果を現在のセットへ反映しました。</span>
      </AppDialog>
    </>
  );
};
