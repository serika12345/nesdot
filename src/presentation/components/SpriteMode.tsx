import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
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
} from "../../application/state/projectStore";
import { NES_PALETTE_HEX } from "../../domain/nes/palette";
import { mergeScreenIntoNesOam } from "../../domain/screen/oamSync";
import { makeTile } from "../../domain/tiles/utils";
import { Tool } from "../../infrastructure/browser/canvas/useSpriteCanvas";
import useExportImage from "../../infrastructure/browser/useExportImage";
import useImportImage from "../../infrastructure/browser/useImportImage";
import { getArrayItem } from "../../shared/arrayAccess";
import {
  CanvasViewport,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  ScrollArea,
  SplitLayout,
} from "../App.styles";
import { ProjectActions } from "./ProjectActions";
import { SpriteCanvas } from "./SpriteCanvas";

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

const chevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

const slotSwatchStyle = (
  transparent: boolean,
  colorHex: string,
): React.CSSProperties => {
  if (transparent === true) {
    return {
      width: "1.5rem",
      height: "1.5rem",
      borderRadius: "0.5rem",
      border: "1px solid rgba(148, 163, 184, 0.4)",
      backgroundImage:
        "repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%)",
      backgroundSize: "0.5rem 0.5rem",
    };
  }

  return {
    width: "1.5rem",
    height: "1.5rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    backgroundColor: colorHex,
  };
};

const resolvePaletteHex = (index: number): string =>
  pipe(
    getArrayItem(NES_PALETTE_HEX, index),
    O.getOrElse(() => "#000000"),
  );

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
      <Panel
        component="section"
        aria-label="スプライト編集パネル"
        minHeight={0}
      >
        <PanelHeader>
          <PanelTitle>スプライト編集</PanelTitle>
        </PanelHeader>

        <Stack component={ScrollArea} spacing={2} flex={1} minHeight={0}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            useFlexGap
            alignItems="stretch"
          >
            <FormControl fullWidth>
              <Typography variant="caption">スプライト番号</Typography>
              <OutlinedInput
                type="number"
                value={activeSprite}
                inputProps={{
                  "aria-label": "スプライト番号",
                  min: 0,
                  max: 63,
                  step: 1,
                }}
                onChange={(e) => handleSpriteChange(e.target.value)}
              />
            </FormControl>
            <FormControl fullWidth>
              <Typography variant="caption">パレット</Typography>
              <Select
                variant="outlined"
                value={activePalette}
                inputProps={{
                  "aria-label": "パレット",
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  if (typeof value !== "string" && typeof value !== "number") {
                    return;
                  }
                  handlePaletteChange(String(value));
                }}
              >
                {palettes.map((_, i) => (
                  <MenuItem key={i} value={i}>
                    パレット {i}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Chip
            color="primary"
            variant="outlined"
            label={
              projectSpriteSize === 8
                ? "Project Sprite Size 8x8"
                : "Project Sprite Size 8x16"
            }
          />
        </Stack>
      </Panel>

      <Panel
        component="section"
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

        <Paper
          variant="outlined"
          style={{ padding: "0.875rem", flexShrink: 0 }}
        >
          <Stack spacing={1}>
            <PanelHeaderRow>
              <Typography variant="body2">現在のスロット</Typography>
              <Chip
                size="small"
                color="primary"
                label={`パレット ${activePalette}`}
              />
            </PanelHeaderRow>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {palettes[activePalette].map((idx, j) => (
                <Button
                  key={j}
                  type="button"
                  variant={activeSlot === j ? "contained" : "outlined"}
                  onClick={() => handlePaletteClick(j)}
                  title={j === 0 ? "スロット 0: 透明" : `スロット ${j}`}
                  startIcon={
                    <Box
                      style={slotSwatchStyle(j === 0, resolvePaletteHex(idx))}
                    />
                  }
                >
                  スロット{j}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Paper>

        <CanvasViewport flex={1} minHeight={0}>
          <Box
            style={{
              position: "absolute",
              top: "1.125rem",
              left: "1.125rem",
              zIndex: 4,
            }}
          >
            <Button
              type="button"
              variant={isToolsOpen ? "contained" : "outlined"}
              endIcon={
                <ExpandMoreRoundedIcon style={chevronStyle(isToolsOpen)} />
              }
              onClick={() => setIsToolsOpen((prev) => !prev)}
            >
              {isToolsOpen ? "ツールを閉じる" : "ツールを開く"}
            </Button>
          </Box>

          {isToolsOpen && (
            <Box
              style={{
                position: "absolute",
                top: "4.25rem",
                left: "1.125rem",
                zIndex: 3,
                bottom: "1.125rem",
                pointerEvents: "none",
              }}
            >
              <Paper
                variant="outlined"
                style={{
                  pointerEvents: "auto",
                  padding: "0.75rem",
                  width: "8.5rem",
                }}
              >
                <Stack spacing={1}>
                  <Button
                    type="button"
                    variant={tool === "pen" ? "contained" : "outlined"}
                    disabled={isChangeOrderMode}
                    onClick={() => setTool("pen")}
                  >
                    ペン
                  </Button>
                  <Button
                    type="button"
                    variant={tool === "eraser" ? "contained" : "outlined"}
                    disabled={isChangeOrderMode}
                    onClick={() => setTool("eraser")}
                  >
                    消しゴム
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    disabled={isChangeOrderMode}
                    onClick={handleClearSprite}
                  >
                    クリア
                  </Button>
                  <Button
                    type="button"
                    variant={isChangeOrderMode ? "contained" : "outlined"}
                    color={isChangeOrderMode ? "primary" : "inherit"}
                    onClick={() => setIsChangeOrderMode((prev) => !prev)}
                  >
                    {isChangeOrderMode ? "並べ替え終了" : "並べ替え"}
                  </Button>
                </Stack>
              </Paper>
            </Box>
          )}

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
