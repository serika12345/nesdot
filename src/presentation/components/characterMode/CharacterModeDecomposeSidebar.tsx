import { ButtonBase, OutlinedInput, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { type SpriteTile } from "../../../application/state/projectStore";
import {
  CharacterDecompositionAnalysis,
  CharacterDecompositionIssue,
} from "../../../domain/characters/characterDecomposition";
import {
  Badge,
  DetailList,
  DetailRow,
  Field,
  FieldLabel,
  ScrollArea,
  ToolButton,
} from "../../App.styles";

const editorCardStyles = {
  position: "relative",
  zIndex: 1,
  borderRadius: "1.375rem",
  background: "rgba(248, 250, 252, 0.84)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
  boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.72)",
} satisfies React.CSSProperties;

const EditorCardRoot = styled("div")(editorCardStyles);

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

const DualActionGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "1.25rem",
});

const RegionList = styled(Stack)({
  gap: "0.625rem",
});

const RegionListButton = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== "selectedState",
})<{ selectedState?: boolean }>(({ selectedState }) => ({
  appearance: "none",
  padding: "0.75rem",
  borderRadius: "1.125rem",
  border:
    selectedState === true
      ? "0.0625rem solid rgba(15, 118, 110, 0.38)"
      : "0.0625rem solid rgba(148, 163, 184, 0.2)",
  background:
    selectedState === true
      ? "rgba(240, 253, 250, 0.96)"
      : "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.94))",
  color: "var(--ink-strong)",
  textAlign: "left",
  boxShadow:
    selectedState === true
      ? "0 1.125rem 2rem rgba(15, 118, 110, 0.12)"
      : "0 0.625rem 1.125rem rgba(15, 23, 42, 0.06)",
}));

const RegionMetaRow = styled(Stack)({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "0.5rem",
});

const WideToolButton = styled(ToolButton)({
  width: "100%",
});

interface CharacterModeDecomposeSidebarProps {
  selectedRegionId: O.Option<string>;
  selectedRegionAnalysis: O.Option<
    CharacterDecompositionAnalysis["regions"][number]
  >;
  decompositionAnalysis: CharacterDecompositionAnalysis;
  decompositionRegionsCount: number;
  decompositionValidRegionCount: number;
  decompositionInvalidRegionCount: number;
  activeSetAvailable: boolean;
  onRemoveSelectedRegion: () => void;
  onApplyDecomposition: () => void;
  onSelectRegion: (regionId: string) => void;
  renderTilePixels: (
    tileOption: O.Option<SpriteTile>,
    pixelSize: number,
    keyPrefix: string,
  ) => React.ReactElement;
  inspectorPreviewScale: number;
  getRegionStatusLabel: (
    region: CharacterDecompositionAnalysis["regions"][number],
  ) => string;
  getIssueLabel: (issue: CharacterDecompositionIssue) => string;
}

export const CharacterModeDecomposeSidebar: React.FC<
  CharacterModeDecomposeSidebarProps
> = ({
  selectedRegionId,
  selectedRegionAnalysis,
  decompositionAnalysis,
  decompositionRegionsCount,
  decompositionValidRegionCount,
  decompositionInvalidRegionCount,
  activeSetAvailable,
  onRemoveSelectedRegion,
  onApplyDecomposition,
  onSelectRegion,
  renderTilePixels,
  inspectorPreviewScale,
  getRegionStatusLabel,
  getIssueLabel,
}) => {
  return (
    <Stack
      minWidth={0}
      minHeight={0}
      spacing="1rem"
      overflow="auto"
      pr="0.25rem"
    >
      <Stack
        component={EditorCardRoot}
        minHeight={0}
        spacing="0.875rem"
        p="1rem"
        useFlexGap
      >
        <div>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <FieldLabel>選択中の領域</FieldLabel>
            <Badge tone="neutral">
              {pipe(
                selectedRegionId,
                O.match(
                  () => "none",
                  (value) => value,
                ),
              )}
            </Badge>
          </Stack>
        </div>

        <RegionPreviewSurfaceRoot>
          <RegionPreviewSurface>
            {pipe(
              selectedRegionAnalysis,
              O.match(
                () => <></>,
                (regionAnalysis) =>
                  renderTilePixels(
                    regionAnalysis.tile,
                    inspectorPreviewScale,
                    `region-${regionAnalysis.region.id}`,
                  ),
              ),
            )}
          </RegionPreviewSurface>
        </RegionPreviewSurfaceRoot>

        <DetailList>
          <DetailRow>
            <FieldLabel>領域数</FieldLabel>
            <Badge tone="accent">{decompositionAnalysis.regions.length}</Badge>
          </DetailRow>
          <DetailRow>
            <FieldLabel>有効 / 無効</FieldLabel>
            <Badge
              tone={decompositionInvalidRegionCount > 0 ? "danger" : "neutral"}
            >
              {`${decompositionValidRegionCount} / ${decompositionInvalidRegionCount}`}
            </Badge>
          </DetailRow>
          <DetailRow>
            <FieldLabel>再利用 / 新規</FieldLabel>
            <Badge tone="neutral">
              {`${decompositionAnalysis.reusableSpriteCount} / ${decompositionAnalysis.requiredNewSpriteCount}`}
            </Badge>
          </DetailRow>
        </DetailList>

        {pipe(
          selectedRegionAnalysis,
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

        <DualActionGrid>
          <WideToolButton
            type="button"
            tone="danger"
            disabled={O.isNone(selectedRegionId)}
            onClick={onRemoveSelectedRegion}
          >
            選択中領域を削除
          </WideToolButton>
          <WideToolButton
            type="button"
            tone="primary"
            disabled={
              activeSetAvailable === false ||
              decompositionRegionsCount === 0 ||
              decompositionAnalysis.canApply === false
            }
            onClick={onApplyDecomposition}
          >
            分解して現在のセットへ反映
          </WideToolButton>
        </DualActionGrid>
      </Stack>

      <Stack
        component={EditorCardRoot}
        minHeight={0}
        spacing="0.875rem"
        p="1rem"
        useFlexGap
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <FieldLabel>切り取り領域一覧</FieldLabel>
          <Badge tone="accent">
            {decompositionAnalysis.regions.length} regions
          </Badge>
        </Stack>

        <ScrollArea flex={1} minHeight={0} pr={0}>
          <RegionList>
            {decompositionAnalysis.regions.map(
              (regionAnalysis, regionIndex) => {
                const isSelected = pipe(
                  selectedRegionId,
                  O.match(
                    () => false,
                    (regionId) => regionId === regionAnalysis.region.id,
                  ),
                );

                return (
                  <RegionListButton
                    key={regionAnalysis.region.id}
                    type="button"
                    selectedState={isSelected}
                    onClick={() => onSelectRegion(regionAnalysis.region.id)}
                  >
                    <Stack spacing="0.625rem" width="100%">
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <FieldLabel>{`領域 ${regionIndex}`}</FieldLabel>
                        <Badge
                          tone={
                            regionAnalysis.issues.length > 0
                              ? "danger"
                              : "accent"
                          }
                        >
                          {getRegionStatusLabel(regionAnalysis)}
                        </Badge>
                      </Stack>
                      <RegionMetaRow>
                        <Badge tone="neutral">{`x:${regionAnalysis.region.x}`}</Badge>
                        <Badge tone="neutral">{`y:${regionAnalysis.region.y}`}</Badge>
                        <Badge
                          tone={
                            regionAnalysis.issues.length > 0
                              ? "danger"
                              : "neutral"
                          }
                        >
                          {regionAnalysis.issues.length > 0
                            ? regionAnalysis.issues
                                .map(getIssueLabel)
                                .join(", ")
                            : "valid"}
                        </Badge>
                      </RegionMetaRow>
                    </Stack>
                  </RegionListButton>
                );
              },
            )}
          </RegionList>
        </ScrollArea>
      </Stack>
    </Stack>
  );
};
