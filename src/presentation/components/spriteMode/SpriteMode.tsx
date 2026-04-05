import { Stack } from "@mui/material";
import { confirm as tauriConfirm } from "@tauri-apps/plugin-dialog";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useState } from "react";
import {
  ColorIndexOfPalette,
  getHexArrayForSpriteTile,
  PaletteIndex,
  ProjectSpriteSize,
  SpriteTile,
  useProjectState,
} from "../../../application/state/projectStore";
import { mergeScreenIntoNesOam } from "../../../domain/screen/oamSync";
import { makeTile } from "../../../domain/tiles/utils";
import { Tool } from "../../../infrastructure/browser/canvas/useSpriteCanvas";
import useExportImage from "../../../infrastructure/browser/useExportImage";
import useImportImage from "../../../infrastructure/browser/useImportImage";
import { getArrayItem } from "../../../shared/arrayAccess";
import {
  CanvasViewport,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  SplitLayout,
} from "../../App.styles";
import { ProjectActions } from "../common/ProjectActions";
import { SpriteCanvas } from "../common/SpriteCanvas";
import { SpriteModeEditorPanel } from "./SpriteModeEditorPanel";
import { SpriteModePaletteSlots } from "./SpriteModePaletteSlots";
import { SpriteModeToolOverlay } from "./SpriteModeToolOverlay";

function makeEmptyTile(
  height: ProjectSpriteSize,
  paletteIndex: PaletteIndex,
): SpriteTile {
  return makeTile(height, paletteIndex, 0);
}

function toPaletteIndex(index: number): PaletteIndex | false {
  if (index === 0 || index === 1 || index === 2 || index === 3) {
    return index;
  }
  return false;
}

/**
 * スプライト編集モード全体の UI を描画します。
 * 個別スプライト編集、パレット選択、書き出し、並べ替えを一つの画面にまとめるコンポーネントです。
 */
export const SpriteMode: React.FC = () => {
  const [tool, setTool] = useState<Tool>("pen");
  const [isChangeOrderMode, setIsChangeOrderMode] = useState<boolean>(false);
  const [activePalette, setActivePalette] = useState<PaletteIndex>(0);
  const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1);
  const [activeSprite, setActiveSprite] = useState<number>(0);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const projectSpriteSize = useProjectState((s) => s.spriteSize);
  const activeTile = useProjectState((s) =>
    pipe(
      getArrayItem(s.sprites, activeSprite),
      O.getOrElse(() => makeEmptyTile(projectSpriteSize, activePalette)),
    ),
  );
  const palettes = useProjectState((s) => s.nes.spritePalettes);
  const sprites = useProjectState((s) => s.sprites);
  const screen = useProjectState((s) => s.screen);

  const setTile = (t: SpriteTile, index: number) => {
    const newSprites = sprites.map((sprite, spriteIndex) =>
      spriteIndex === index ? t : sprite,
    );
    useProjectState.setState({ sprites: newSprites });

    const newScreen = {
      ...screen,
      sprites: screen.sprites.map((s) =>
        s.spriteIndex === index ? { ...s, ...t } : s,
      ),
    };
    const state = useProjectState.getState();
    useProjectState.setState({
      screen: newScreen,
      nes: mergeScreenIntoNesOam(state.nes, newScreen),
    });
  };

  const handlePaletteClick = (slot: number) => {
    if (slot !== 0 && slot !== 1 && slot !== 2 && slot !== 3) {
      return;
    }
    setActiveSlot(slot);
  };

  const handleSpriteChange = (index: string) => {
    const i = Number.parseInt(index, 10);
    if (i < 0 || i >= 64 || Number.isNaN(i)) return;
    setActiveSprite(i);
    const targetSpriteOption = getArrayItem(sprites, i);
    if (O.isNone(targetSpriteOption)) {
      return;
    }
    setActivePalette(targetSpriteOption.value.paletteIndex);
  };

  const handlePaletteChange = (index: string) => {
    const i = Number.parseInt(index, 10);
    const paletteIndex = toPaletteIndex(i);
    if (paletteIndex === false) {
      return;
    }
    setActivePalette(paletteIndex);
    const newTile: SpriteTile = { ...activeTile, paletteIndex };
    setTile(newTile, activeSprite);
  };

  const projectState = useProjectState((s) => s);
  const { exportChr, exportPng, exportSvgSimple, exportJSON } =
    useExportImage();
  const { importJSON } = useImportImage();

  const handleImport = async () => {
    try {
      await importJSON((data) => {
        const syncedNes = mergeScreenIntoNesOam(data.nes, data.screen);
        useProjectState.setState({
          ...data,
          nes: syncedNes,
        });
        const nextPalette = pipe(
          getArrayItem(data.sprites, activeSprite),
          O.match(
            (): PaletteIndex => 0,
            (sprite): PaletteIndex => sprite.paletteIndex,
          ),
        );
        setActivePalette(nextPalette);
      });
    } catch (err) {
      alert("インポートに失敗しました: " + err);
    }
  };

  const handleClearSprite = async () => {
    const message = "本当にクリアしますか？";
    const shouldClear = await tauriConfirm(message, {
      title: "スプライトをクリア",
      okLabel: "クリア",
      cancelLabel: "キャンセル",
    }).catch(() => window.confirm(message));

    if (shouldClear === true) {
      setTile(
        makeEmptyTile(activeTile.height, activeTile.paletteIndex),
        activeSprite,
      );
    }
  };

  return (
    <SplitLayout flex={1} height="100%">
      <SpriteModeEditorPanel
        activeSprite={activeSprite}
        activePalette={activePalette}
        projectSpriteSize={projectSpriteSize}
        palettes={palettes}
        onSpriteChange={handleSpriteChange}
        onPaletteChange={handlePaletteChange}
      />

      <Panel
        role="region"
        aria-label="スプライトキャンバスパネル"
        flex={1}
        minHeight={0}
      >
        <PanelHeader>
          <PanelHeaderRow>
            <PanelTitle>スプライトキャンバス</PanelTitle>
            <Stack direction="row" spacing={1} useFlexGap alignItems="center">
              <ProjectActions
                actions={[
                  {
                    label: "CHRエクスポート",
                    onSelect: () => exportChr(activeTile, activePalette),
                  },
                  {
                    label: "PNGエクスポート",
                    onSelect: () =>
                      exportPng(getHexArrayForSpriteTile(activeTile)),
                  },
                  {
                    label: "SVGエクスポート",
                    onSelect: () =>
                      exportSvgSimple(getHexArrayForSpriteTile(activeTile)),
                  },
                  { label: "保存", onSelect: () => exportJSON(projectState) },
                ]}
                onImport={handleImport}
              />
            </Stack>
          </PanelHeaderRow>
        </PanelHeader>

        <SpriteModePaletteSlots
          activePalette={activePalette}
          activeSlot={activeSlot}
          palettes={palettes}
          onPaletteClick={handlePaletteClick}
        />

        <CanvasViewport flex={1} minHeight={0}>
          <SpriteModeToolOverlay
            isToolsOpen={isToolsOpen}
            isChangeOrderMode={isChangeOrderMode}
            tool={tool}
            onToggleTools={() => setIsToolsOpen((prev) => !prev)}
            onSetTool={setTool}
            onClearSprite={handleClearSprite}
            onToggleChangeOrderMode={() =>
              setIsChangeOrderMode((prev) => !prev)
            }
          />

          <Stack
            minWidth="100%"
            minHeight="100%"
            alignItems="center"
            justifyContent="center"
          >
            <SpriteCanvas
              isChangeOrderMode={isChangeOrderMode}
              target={activeSprite}
              scale={24}
              showGrid={true}
              tool={tool}
              currentSelectPalette={activePalette}
              activeColorIndex={activeSlot}
              onChange={setTile}
            />
          </Stack>
        </CanvasViewport>
      </Panel>
    </SplitLayout>
  );
};
