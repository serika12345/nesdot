import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useMemo, useState } from "react";
import { useCharacterState } from "../../../../../application/state/characterStore";
import {
  useProjectState,
  type ProjectSpriteSize,
  type ProjectState,
} from "../../../../../application/state/projectStore";
import {
  buildCharacterPreviewHexGrid,
  type CharacterSet,
} from "../../../../../domain/characters/characterSet";
import useExportImage from "../../../../../infrastructure/browser/useExportImage";
import { type FileShareAction } from "../../../common/logic/state/fileMenuState";
import { isProjectSpriteSizeLocked } from "../project/projectSpriteSizeLock";
import { type CharacterEditorMode } from "../view/characterEditorMode";

const PREVIEW_TRANSPARENT_HEX = "#00000000";

type CharacterStateSnapshot = ReturnType<typeof useCharacterState.getState>;

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

export interface CharacterModeProjectStateResult {
  activeSet: O.Option<CharacterSet>;
  activeSetId: string;
  activeSetName: string;
  activeSetSpriteCount: number;
  addSprite: CharacterStateSnapshot["addSprite"];
  characterSets: CharacterStateSnapshot["characterSets"];
  createSet: CharacterStateSnapshot["createSet"];
  deleteSet: CharacterStateSnapshot["deleteSet"];
  editorMode: CharacterEditorMode;
  newName: string;
  projectActions: ReadonlyArray<FileShareAction>;
  projectSpriteSize: ProjectSpriteSize;
  projectSpriteSizeLocked: boolean;
  removeSprite: CharacterStateSnapshot["removeSprite"];
  renameSet: CharacterStateSnapshot["renameSet"];
  screen: ProjectState["screen"];
  selectedCharacterId: CharacterStateSnapshot["selectedCharacterId"];
  selectSet: CharacterStateSnapshot["selectSet"];
  setEditorMode: (mode: CharacterEditorMode) => void;
  setNewName: (value: string) => void;
  setSprite: CharacterStateSnapshot["setSprite"];
  spritePalettes: ProjectState["nes"]["spritePalettes"];
  sprites: ProjectState["sprites"];
}

export const useCharacterModeProjectState =
  (): CharacterModeProjectStateResult => {
    const [newName, setNewName] = useState("New Character");
    const [editorMode, setEditorMode] =
      useState<CharacterEditorMode>("compose");

    const characterSets = useCharacterState((state) => state.characterSets);
    const selectedCharacterId = useCharacterState(
      (state) => state.selectedCharacterId,
    );
    const createSet = useCharacterState((state) => state.createSet);
    const selectSet = useCharacterState((state) => state.selectSet);
    const renameSet = useCharacterState((state) => state.renameSet);
    const addSprite = useCharacterState((state) => state.addSprite);
    const setSprite = useCharacterState((state) => state.setSprite);
    const removeSprite = useCharacterState((state) => state.removeSprite);
    const deleteSet = useCharacterState((state) => state.deleteSet);

    const projectSpriteSize = useProjectState((state) => state.spriteSize);
    const sprites = useProjectState((state) => state.sprites);
    const screen = useProjectState((state) => state.screen);
    const spritePalettes = useProjectState((state) => state.nes.spritePalettes);
    const { exportPng, exportSvgSimple, exportCharacterJson } =
      useExportImage();

    const activeSet = useMemo(
      () =>
        pipe(
          selectedCharacterId,
          O.chain((id) =>
            O.fromNullable(
              characterSets.find((characterSet) => characterSet.id === id),
            ),
          ),
        ),
      [characterSets, selectedCharacterId],
    );

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

    const projectSpriteSizeLocked = useMemo(
      () =>
        isProjectSpriteSizeLocked(
          sprites,
          screen.sprites.length,
          characterSets,
        ),
      [characterSets, screen.sprites.length, sprites],
    );

    const activeSetId = pipe(
      activeSet,
      O.match(
        () => "",
        (characterSet) => characterSet.id,
      ),
    );

    const activeSetName = pipe(
      activeSet,
      O.match(
        () => "",
        (characterSet) => characterSet.name,
      ),
    );

    const activeSetSpriteCount = pipe(
      activeSet,
      O.match(
        () => 0,
        (characterSet) => characterSet.sprites.length,
      ),
    );

    return {
      activeSet,
      activeSetId,
      activeSetName,
      activeSetSpriteCount,
      addSprite,
      characterSets,
      createSet,
      deleteSet,
      editorMode,
      newName,
      projectActions,
      projectSpriteSize,
      projectSpriteSizeLocked,
      removeSprite,
      renameSet,
      screen,
      selectedCharacterId,
      selectSet,
      setEditorMode,
      setNewName,
      setSprite,
      spritePalettes,
      sprites,
    };
  };
