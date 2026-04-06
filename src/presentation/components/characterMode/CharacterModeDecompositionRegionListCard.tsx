import { ButtonBase, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { Badge, FieldLabel, ScrollArea } from "../../App.styles";
import { CharacterModeEditorCard } from "./CharacterModeEditorCard";
import { useCharacterModeDecompositionRegions } from "./CharacterModeStateProvider";
import {
  getIssueLabel,
  getRegionStatusLabel,
} from "./decomposition/decompositionRegionRules";

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

/**
 * 分解済み領域の一覧カードです。
 */
export const CharacterModeDecompositionRegionListCard: React.FC = () => {
  const decompositionRegions = useCharacterModeDecompositionRegions();

  return (
    <CharacterModeEditorCard
      minHeight={0}
      spacing="0.875rem"
      p="1rem"
      useFlexGap
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <FieldLabel>切り取り領域一覧</FieldLabel>
        <Badge tone="accent">
          {decompositionRegions.decompositionAnalysis.regions.length} regions
        </Badge>
      </Stack>

      <ScrollArea flex={1} minHeight={0}>
        <RegionList>
          {decompositionRegions.decompositionAnalysis.regions.map(
            (regionAnalysis, regionIndex) => {
              const isSelected = pipe(
                decompositionRegions.selectedRegionId,
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
                  onClick={() =>
                    decompositionRegions.handleSelectRegion(
                      regionAnalysis.region.id,
                    )
                  }
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
                          regionAnalysis.issues.length > 0 ? "danger" : "accent"
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
                          ? regionAnalysis.issues.map(getIssueLabel).join(", ")
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
    </CharacterModeEditorCard>
  );
};
