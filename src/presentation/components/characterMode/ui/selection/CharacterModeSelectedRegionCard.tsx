import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { Badge, Button, Dialog, Flex, TextField } from "@radix-ui/themes";
import React from "react";
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
  const titleId = React.useId();

  const handleCloseApplyFeedbackDialog = () => {
    setIsApplyFeedbackDialogOpen(false);
  };

  const handleApplyDecomposition = () => {
    if (decompositionOverview.handleApplyDecomposition()) {
      setIsApplyFeedbackDialogOpen(true);
    }
  };
  const renderApplyFeedbackDialog = (): React.ReactNode => {
    if (typeof document === "undefined") {
      if (isApplyFeedbackDialogOpen === false) {
        return <></>;
      }

      return (
        <div aria-labelledby={titleId} aria-modal="true" role="dialog">
          <h2 id={titleId}>現在のセットへ反映しました</h2>
          <span>分解結果を現在のセットへ反映しました。</span>
          <div>
            <Button color="gray" variant="outline">
              閉じる
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Dialog.Root
        open={isApplyFeedbackDialogOpen}
        onOpenChange={(open) => {
          if (open === true) {
            return;
          }

          handleCloseApplyFeedbackDialog();
        }}
      >
        <Dialog.Content maxWidth="28rem">
          <Dialog.Title>現在のセットへ反映しました</Dialog.Title>
          <span>分解結果を現在のセットへ反映しました。</span>
          <Flex gap="3" justify="end" mt="4" wrap="wrap">
            <Button
              color="gray"
              variant="outline"
              onClick={handleCloseApplyFeedbackDialog}
            >
              閉じる
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
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
              <Badge color="teal" size="2" variant="surface">
                {decompositionOverview.decompositionAnalysis.regions.length}
              </Badge>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>有効 / 無効</span>
              <Badge
                color={
                  decompositionOverview.decompositionInvalidRegionCount > 0
                    ? "red"
                    : "gray"
                }
                size="2"
                variant="surface"
              >
                {`${decompositionOverview.decompositionValidRegionCount} / ${decompositionOverview.decompositionInvalidRegionCount}`}
              </Badge>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>再利用 / 新規</span>
              <Badge color="gray" size="2" variant="surface">
                {`${decompositionOverview.decompositionAnalysis.reusableSpriteCount} / ${decompositionOverview.decompositionAnalysis.requiredNewSpriteCount}`}
              </Badge>
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
                    <TextField.Root
                      type="number"
                      value={regionAnalysis.region.x}
                      readOnly
                      aria-label="選択中領域X座標"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span className={styles.fieldCaption}>y</span>
                    <TextField.Root
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
                      <Badge
                        color={
                          regionAnalysis.issues.length > 0 ? "red" : "teal"
                        }
                        size="2"
                        variant="surface"
                      >
                        {getRegionStatusLabel(regionAnalysis)}
                      </Badge>
                    </div>
                  </div>
                  <div className={styles.infoCard}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>issues</span>
                      <Badge
                        color={
                          regionAnalysis.issues.length > 0 ? "red" : "gray"
                        }
                        size="2"
                        variant="surface"
                      >
                        {regionAnalysis.issues.length > 0
                          ? regionAnalysis.issues.map(getIssueLabel).join(", ")
                          : "none"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ),
          ),
        )}

        <Button
          color="teal"
          variant="solid"
          disabled={
            O.isNone(decompositionOverview.activeSet) ||
            decompositionOverview.decompositionAnalysis.regions.length === 0 ||
            decompositionOverview.decompositionAnalysis.canApply === false
          }
          size="1"
          style={{ width: "100%" }}
          onClick={handleApplyDecomposition}
        >
          分解して現在のセットへ反映
        </Button>
      </CharacterModeEditorCard>

      {renderApplyFeedbackDialog()}
    </>
  );
};
