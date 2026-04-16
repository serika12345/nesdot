import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useMemo } from "react";
import {
  useProjectState,
  type ProjectState,
} from "../../../../application/state/projectStore";
import {
  buildCharacterPreviewHexGrid,
  type CharacterSet,
} from "../../../../domain/characters/characterSet";
import useExportImage from "../../../../infrastructure/browser/useExportImage";
import { type FileShareAction } from "../../common/logic/state/fileMenuState";
import { useActiveSet } from "./characterModeShared";

const PREVIEW_TRANSPARENT_HEX = "#00000000";

interface CharacterPreviewReadyState {
  kind: "ready";
  grid: string[][];
}

type CharacterPreviewState = CharacterPreviewReadyState | { kind: "error" };

const createCharacterModeProjectActions = (params: {
  activeSet: O.Option<CharacterSet>;
  exportCharacterJson: ReturnType<typeof useExportImage>["exportCharacterJson"];
  exportPng: ReturnType<typeof useExportImage>["exportPng"];
  exportSvgSimple: ReturnType<typeof useExportImage>["exportSvgSimple"];
  spritePalettes: ProjectState["nes"]["spritePalettes"];
  sprites: ProjectState["sprites"];
}): ReadonlyArray<FileShareAction> =>
  pipe(
    params.activeSet,
    O.match(
      (): ReadonlyArray<FileShareAction> => [],
      (characterSet) => {
        const resolvePreviewState = (): CharacterPreviewState => {
          const preview = buildCharacterPreviewHexGrid(characterSet, {
            sprites: params.sprites,
            palettes: params.spritePalettes,
            transparentHex: PREVIEW_TRANSPARENT_HEX,
          });

          if (E.isLeft(preview)) {
            return { kind: "error" };
          }

          return {
            kind: "ready",
            grid: preview.right,
          };
        };

        return [
          {
            id: "share-export-png",
            label: "PNGエクスポート",
            onSelect: () => {
              const previewState = resolvePreviewState();

              if (previewState.kind !== "ready") {
                return;
              }

              void params.exportPng(
                previewState.grid,
                `${characterSet.name}.png`,
              );
            },
          },
          {
            id: "share-export-svg",
            label: "SVGエクスポート",
            onSelect: () => {
              const previewState = resolvePreviewState();

              if (previewState.kind !== "ready") {
                return;
              }

              void params.exportSvgSimple(
                previewState.grid,
                8,
                `${characterSet.name}.svg`,
              );
            },
          },
          {
            id: "share-export-character-json",
            label: "キャラクターJSON書き出し",
            onSelect: () =>
              void params.exportCharacterJson(
                {
                  characterSets: [characterSet],
                  selectedCharacterId: characterSet.id,
                },
                `${characterSet.name}.json`,
              ),
          },
        ] satisfies ReadonlyArray<FileShareAction>;
      },
    ),
  );

export const useCharacterModeProjectActions = (): Readonly<{
  projectActions: ReadonlyArray<FileShareAction>;
}> => {
  const activeSet = useActiveSet();
  const sprites = useProjectState((s) => s.sprites);
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);
  const { exportPng, exportSvgSimple, exportCharacterJson } = useExportImage();
  const projectActions = useMemo(
    () =>
      createCharacterModeProjectActions({
        activeSet,
        exportCharacterJson,
        exportPng,
        exportSvgSimple,
        spritePalettes,
        sprites,
      }),
    [
      activeSet,
      exportCharacterJson,
      exportPng,
      exportSvgSimple,
      spritePalettes,
      sprites,
    ],
  );

  return { projectActions };
};
