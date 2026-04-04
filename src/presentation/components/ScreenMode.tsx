import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  type StackProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useRef, useState } from "react";
import { useCharacterState } from "../../application/state/characterStore";
import {
  getHexArrayForScreen,
  Screen,
  SpriteInScreen,
  SpritePriority,
  useProjectState,
} from "../../application/state/projectStore";
import { expandCharacterToScreenSprites } from "../../domain/characters/characterSet";
import {
  MAX_SCREEN_SPRITES,
  MAX_SPRITES_PER_SCANLINE,
  scanNesSpriteConstraints,
} from "../../domain/screen/constraints";
import { mergeScreenIntoNesOam } from "../../domain/screen/oamSync";
import {
  getGroupBounds,
  isValidGroupMovement,
  moveGroupByDelta,
} from "../../domain/screen/spriteGroup";
import useExportImage from "../../infrastructure/browser/useExportImage";
import useImportImage from "../../infrastructure/browser/useImportImage";
import {
  Badge,
  CanvasViewport,
  CollapseToggle,
  DetailKey,
  DetailList,
  DetailRow,
  DetailValue,
  Field,
  FieldLabel,
  HelperText,
  MetricCard,
  MetricLabel,
  MetricValue,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  ScrollColumn,
  SplitLayout,
  ToolButton,
} from "../App.styles";
import { ProjectActions } from "./ProjectActions";
import { ScreenCanvas } from "./ScreenCanvas";

const SCREEN_MIN_ZOOM_LEVEL = 1;
const SCREEN_MAX_ZOOM_LEVEL = 8;
const SCREEN_DEFAULT_ZOOM_LEVEL = 2;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const trySetPointerCapture = (target: HTMLElement, pointerId: number): void => {
  try {
    target.setPointerCapture(pointerId);
  } catch {
    // Synthetic pointer events used in tests may not have a capturable pointer.
  }
};

interface ViewportPanState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startScrollLeft: number;
  startScrollTop: number;
}

const shouldForwardActiveProp = (prop: PropertyKey): boolean =>
  prop !== "active";

const createStackLayout = (
  displayName: string,
  defaultProps: StackProps,
  Root: typeof Stack = Stack,
) => {
  void displayName;
  const LayoutComponent = React.forwardRef<HTMLDivElement, StackProps>(
    function LayoutComponent(props, ref) {
      return <Root ref={ref} useFlexGap {...defaultProps} {...props} />;
    },
  );

  return LayoutComponent;
};

const SummaryMetricGrid = createStackLayout("SummaryMetricGrid", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.75rem",
});

const SummaryMetricCard = styled(MetricCard)({
  flex: "1 1 8.75rem",
  background: "transparent",
  border: "none",
  boxShadow: "none",
  padding: 0,
});

const SummaryWideMetricCard = styled(SummaryMetricCard)({
  flexBasis: "100%",
});

const SummaryMetricValue = styled(MetricValue)({
  fontSize: "1.125rem",
  whiteSpace: "nowrap",
});

const TwoColumnFieldGrid = createStackLayout("TwoColumnFieldGrid", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.75rem",
  alignItems: "end",
});

const FullWidthField = createStackLayout("FullWidthField", {
  component: "label",
  spacing: "0.5rem",
  flexBasis: "100%",
});

const GridActionRow = createStackLayout("GridActionRow", {
  flex: "1 1 10rem",
  justifyContent: "flex-end",
});

const FullWidthActionRow = createStackLayout("FullWidthActionRow", {
  flexBasis: "100%",
  justifyContent: "flex-end",
});

const TallToolButton = styled(ToolButton)({
  minHeight: "3rem",
});

const WideTallToolButton = styled(TallToolButton)({
  width: "100%",
});

const ZoomControlsRow = styled(PanelHeaderRow)({
  justifyContent: "flex-start",
});

const ScreenNumberInput = styled(OutlinedInput)({
  width: "100%",
  borderRadius: "1rem",
  background: "var(--surface-quiet)",
  color: "var(--ink-strong)",
  boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.85)",
  "& .MuiOutlinedInput-input": {
    padding: "0.8125rem 0.875rem",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148, 163, 184, 0.22)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.28)",
  },
  "&.Mui-focused": {
    boxShadow:
      "0 0 0 0.25rem rgba(15, 118, 110, 0.1), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.85)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.4)",
  },
});

const ScreenSelectInput = styled(Select)({
  width: "100%",
  borderRadius: "1rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92))",
  color: "var(--ink-strong)",
  "& .MuiSelect-select": {
    padding: "0.8125rem 2.5rem 0.8125rem 0.875rem",
    borderRadius: "1rem",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148, 163, 184, 0.22)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.28)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.4)",
  },
  "& .MuiSelect-icon": {
    right: "0.875rem",
    color: "var(--ink-soft)",
  },
});

const CollapseChevron = styled(ExpandMoreRoundedIcon, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open: boolean }>(({ open }) => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
}));

const ReadOnlyDetailRow = styled(DetailRow)({
  background: "transparent",
  border: "none",
  boxShadow: "none",
  padding: 0,
  borderRadius: 0,
});

const FlipButtonGrid = createStackLayout("FlipButtonGrid", {
  direction: "row",
  spacing: "0.75rem",
  alignItems: "end",
});

const FlipToolButton = styled(ToolButton)({
  flex: 1,
});

const GroupActionButton = styled(TallToolButton)({
  width: "100%",
});

const PreviewViewportRoot = styled(CanvasViewport, {
  shouldForwardProp: shouldForwardActiveProp,
})<{ active?: boolean }>(({ active }) => ({
  cursor: active === true ? "grabbing" : "default",
}));

type PreviewViewportProps = React.ComponentProps<typeof CanvasViewport> & {
  active?: boolean;
};

const PreviewViewport = React.forwardRef<HTMLDivElement, PreviewViewportProps>(
  function PreviewViewport({ active, ...props }, ref) {
    return (
      <PreviewViewportRoot
        ref={ref}
        active={active === true}
        flex={1}
        minHeight={0}
        p="1.5rem"
        {...props}
      />
    );
  },
);

const PreviewCanvasWrap = styled("div")({
  display: "grid",
  placeItems: "center",
  width: "max-content",
  height: "max-content",
  minWidth: "100%",
  minHeight: "100%",
});

const WarningList = styled(DetailList)({
  flexShrink: 0,
});

export const ScreenMode: React.FC = () => {
  const [spriteNumber, setSpriteNumber] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [screenZoomLevel, setScreenZoomLevel] = useState(
    SCREEN_DEFAULT_ZOOM_LEVEL,
  );
  const [selectedSpriteIndex, setSelectedSpriteIndex] = useState<
    O.Option<number>
  >(() =>
    useProjectState.getState().screen.sprites.length > 0 ? O.some(0) : O.none,
  );
  const [viewportPanState, setViewportPanState] = useState<
    O.Option<ViewportPanState>
  >(O.none);
  const [isPlacementOpen, setIsPlacementOpen] = useState(true);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [isGroupMoveOpen, setIsGroupMoveOpen] = useState(false);
  const [selectedSpriteIndices, setSelectedSpriteIndices] = useState<
    Set<number>
  >(() => new Set());
  const [groupMoveDeltaX, setGroupMoveDeltaX] = useState(0);
  const [groupMoveDeltaY, setGroupMoveDeltaY] = useState(0);
  const viewportElementRef = useRef<O.Option<HTMLDivElement>>(O.none);
  const screen = useProjectState((s) => s.screen);
  const nes = useProjectState((s) => s.nes);
  const sprites = useProjectState((s) => s.sprites);
  const spritesOnScreen = useProjectState((s) => s.screen.sprites);
  const characterSets = useCharacterState((s) => s.characterSets);
  const selectedCharacterId = useCharacterState((s) => s.selectedCharacterId);
  const selectCharacterSet = useCharacterState((s) => s.selectSet);
  const [characterBaseX, setCharacterBaseX] = useState(0);
  const [characterBaseY, setCharacterBaseY] = useState(0);
  const projectState = useProjectState((s) => s);
  const { exportPng, exportSvgSimple, exportJSON } = useExportImage();
  const { importJSON } = useImportImage();
  const scan = (
    checkeeScreen = useProjectState.getState().screen,
    checkeeNes = useProjectState.getState().nes,
  ) =>
    scanNesSpriteConstraints(mergeScreenIntoNesOam(checkeeNes, checkeeScreen));

  const setScreenAndSyncNes = (nextScreen: Screen, nextNes = nes): void => {
    useProjectState.setState({
      screen: nextScreen,
      nes: mergeScreenIntoNesOam(nextNes, nextScreen),
    });
  };

  const addToGroupSelection = (index: number): void => {
    setSelectedSpriteIndices((prev) => new Set([...prev, index]));
  };

  const removeFromGroupSelection = (index: number): void => {
    setSelectedSpriteIndices(
      (prev) => new Set(Array.from(prev).filter((value) => value !== index)),
    );
  };

  const clearGroupSelection = (): void => {
    setSelectedSpriteIndices(new Set());
  };

  const handleMoveSelectedGroup = (): void => {
    if (selectedSpriteIndices.size === 0) {
      alert("グループを選択してください");
      return;
    }

    const isValid = isValidGroupMovement(
      spritesOnScreen,
      selectedSpriteIndices,
      groupMoveDeltaX,
      groupMoveDeltaY,
    );

    if (isValid !== true) {
      alert(
        "移動により一部のスプライトがスクリーン外に出ます。\n位置を調整してください。",
      );
      return;
    }

    const movedSprites = moveGroupByDelta(
      spritesOnScreen,
      selectedSpriteIndices,
      groupMoveDeltaX,
      groupMoveDeltaY,
    );

    const newScreen = {
      ...screen,
      sprites: movedSprites,
    };

    const report = scan(newScreen);
    if (report.ok === false) {
      alert(
        "グループの移動に失敗しました。制約違反:\n" + report.errors.join("\n"),
      );
      return;
    }

    setScreenAndSyncNes(newScreen);
    alert(
      `グループを (${groupMoveDeltaX > 0 ? "+" : ""}${groupMoveDeltaX}, ${groupMoveDeltaY > 0 ? "+" : ""}${groupMoveDeltaY}) 移動しました`,
    );
    setGroupMoveDeltaX(0);
    setGroupMoveDeltaY(0);
  };

  const handleImport = async () => {
    try {
      await importJSON((data) => {
        const syncedNes = mergeScreenIntoNesOam(data.nes, data.screen);
        useProjectState.setState({
          ...data,
          nes: syncedNes,
        });
        setSelectedSpriteIndex(
          data.screen.sprites.length > 0 ? O.some(0) : O.none,
        );

        const result = scan(data.screen, syncedNes);
        if (result.ok === false) {
          alert(
            "インポートしたデータに制約違反があります:\n" +
              result.errors.join("\n"),
          );
        }
      });
    } catch (err) {
      alert("インポートに失敗しました: " + err);
    }
  };

  const handleAddSprite = () => {
    const spriteTileOption = O.fromNullable(sprites[spriteNumber]);
    if (O.isNone(spriteTileOption)) {
      alert("指定されたスプライト番号のスプライトが存在しません");
      return;
    }
    const spriteTile = spriteTileOption.value;

    const candidate: SpriteInScreen = {
      ...spriteTile,
      x,
      y,
      spriteIndex: spriteNumber,
      priority: "front",
      flipH: false,
      flipV: false,
    };
    const newScreen = {
      ...screen,
      sprites: [...screen.sprites, candidate],
    };

    const report = scan(newScreen);
    if (report.ok === false) {
      alert(
        "スプライトの追加に失敗しました。制約違反:\n" +
          report.errors.join("\n"),
      );
      return;
    }

    setScreenAndSyncNes(newScreen);
    if (O.isNone(selectedSpriteIndex)) {
      setSelectedSpriteIndex(O.some(newScreen.sprites.length - 1));
    }
    alert(`スプライト#${spriteNumber}を(${x},${y})に追加しました`);
  };

  const activeSprite = pipe(
    selectedSpriteIndex,
    O.chain((index) => O.fromNullable(spritesOnScreen[index])),
  );
  const activeCharacter = pipe(
    selectedCharacterId,
    O.chain((id) =>
      O.fromNullable(
        characterSets.find((characterSet) => characterSet.id === id),
      ),
    ),
  );

  const handleAddCharacter = () => {
    const placement = pipe(
      activeCharacter,
      O.match(
        () => E.left("キャラクターセットを選択してください"),
        (characterSet) =>
          expandCharacterToScreenSprites(characterSet, {
            baseX: characterBaseX,
            baseY: characterBaseY,
            sprites,
          }),
      ),
    );

    if (E.isLeft(placement)) {
      alert(`キャラクター追加に失敗しました: ${placement.left}`);
      return;
    }

    const newScreen = {
      ...screen,
      sprites: [...screen.sprites, ...placement.right],
    };
    const report = scan(newScreen);
    if (report.ok === false) {
      alert(
        "キャラクターの追加に失敗しました。制約違反:\n" +
          report.errors.join("\n"),
      );
      return;
    }

    setScreenAndSyncNes(newScreen);
    if (O.isNone(selectedSpriteIndex) && placement.right.length > 0) {
      setSelectedSpriteIndex(O.some(screen.sprites.length));
    }
    alert(`キャラクターを(${characterBaseX},${characterBaseY})に追加しました`);
  };

  const selectedIndexValue = pipe(
    selectedSpriteIndex,
    O.getOrElse(() => -1),
  );
  const scanReport = scan(screen, nes);
  const updateScreenZoomLevel = (
    nextZoomLevel: number,
    anchor: O.Option<{ clientX: number; clientY: number }> = O.none,
  ): void => {
    setScreenZoomLevel((currentZoomLevel) => {
      const clampedZoomLevel = clamp(
        nextZoomLevel,
        SCREEN_MIN_ZOOM_LEVEL,
        SCREEN_MAX_ZOOM_LEVEL,
      );

      if (clampedZoomLevel === currentZoomLevel) {
        return currentZoomLevel;
      }

      if (O.isSome(anchor) && O.isSome(viewportElementRef.current)) {
        const viewport = viewportElementRef.current.value;
        const rect = viewport.getBoundingClientRect();
        const relativeX = anchor.value.clientX - rect.left;
        const relativeY = anchor.value.clientY - rect.top;
        const currentCanvasX = viewport.scrollLeft + relativeX;
        const currentCanvasY = viewport.scrollTop + relativeY;

        window.requestAnimationFrame(() => {
          viewport.scrollTo({
            left:
              (currentCanvasX / currentZoomLevel) * clampedZoomLevel -
              relativeX,
            top:
              (currentCanvasY / currentZoomLevel) * clampedZoomLevel -
              relativeY,
          });
        });
      }

      return clampedZoomLevel;
    });
  };

  const handleZoomOut = (): void => {
    updateScreenZoomLevel(screenZoomLevel - 1, O.none);
  };

  const handleZoomIn = (): void => {
    updateScreenZoomLevel(screenZoomLevel + 1, O.none);
  };

  const handleViewportWheel = (
    event: React.WheelEvent<HTMLDivElement>,
  ): void => {
    if (event.ctrlKey === false) {
      return;
    }

    event.preventDefault();
    updateScreenZoomLevel(
      event.deltaY < 0 ? screenZoomLevel + 1 : screenZoomLevel - 1,
      O.some({ clientX: event.clientX, clientY: event.clientY }),
    );
  };

  const handleViewportPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ): void => {
    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
    setViewportPanState(
      O.some({
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startScrollLeft: event.currentTarget.scrollLeft,
        startScrollTop: event.currentTarget.scrollTop,
      }),
    );
    trySetPointerCapture(event.currentTarget, event.pointerId);
  };

  const handleViewportPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ): void => {
    if (O.isNone(viewportPanState)) {
      return;
    }

    if (viewportPanState.value.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - viewportPanState.value.startClientX;
    const deltaY = event.clientY - viewportPanState.value.startClientY;

    event.currentTarget.scrollTo({
      left: viewportPanState.value.startScrollLeft - deltaX,
      top: viewportPanState.value.startScrollTop - deltaY,
    });
  };

  const handleViewportPointerEnd = (
    event: React.PointerEvent<HTMLDivElement>,
  ): void => {
    if (O.isNone(viewportPanState)) {
      return;
    }

    if (viewportPanState.value.pointerId !== event.pointerId) {
      return;
    }

    setViewportPanState(O.none);
  };

  return (
    <SplitLayout flex={1} height="100%">
      <ScrollColumn width={{ lg: "20rem", xl: "22.5rem" }} flexShrink={0}>
        <Panel>
          <PanelHeader>
            <PanelTitle>スクリーン配置</PanelTitle>
          </PanelHeader>

          <SummaryMetricGrid>
            <SummaryMetricCard>
              <MetricLabel>配置中</MetricLabel>
              <MetricValue>
                {spritesOnScreen.length}/{MAX_SCREEN_SPRITES}
              </MetricValue>
            </SummaryMetricCard>
            <SummaryMetricCard>
              <MetricLabel>画面</MetricLabel>
              <MetricValue>
                {screen.width}×{screen.height}
              </MetricValue>
            </SummaryMetricCard>
            <SummaryWideMetricCard>
              <MetricLabel>制約</MetricLabel>
              <SummaryMetricValue>
                1ライン最大 {MAX_SPRITES_PER_SCANLINE}
              </SummaryMetricValue>
            </SummaryWideMetricCard>
          </SummaryMetricGrid>

          {!scanReport.ok && (
            <HelperText>
              制約違反があります。必要なら「選択中のスプライト」を開いて調整してください。
            </HelperText>
          )}
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>キャラクター追加</PanelTitle>
          </PanelHeader>

          <TwoColumnFieldGrid>
            <FullWidthField>
              <FieldLabel>キャラクターセット</FieldLabel>
              <ScreenSelectInput
                variant="outlined"
                onChange={(e) => {
                  const value = e.target.value;
                  if (typeof value !== "string") {
                    return;
                  }
                  selectCharacterSet(value === "" ? O.none : O.some(value));
                }}
                value={pipe(
                  selectedCharacterId,
                  O.match(
                    () => "",
                    (id) => id,
                  ),
                )}
                inputProps={{
                  "aria-label": "キャラクターセット",
                }}
              >
                {characterSets.length === 0 && (
                  <MenuItem value="">キャラクターセットがありません</MenuItem>
                )}
                {characterSets.map((characterSet) => (
                  <MenuItem key={characterSet.id} value={characterSet.id}>
                    {`${characterSet.name} (${characterSet.sprites.length} sprites)`}
                  </MenuItem>
                ))}
              </ScreenSelectInput>
            </FullWidthField>

            <Field flex="1 1 11.25rem">
              <FieldLabel>X 座標</FieldLabel>
              <ScreenNumberInput
                type="number"
                value={characterBaseX}
                inputProps={{
                  min: 0,
                  max: 256,
                  "aria-label": "キャラクター X 座標",
                }}
                onChange={(e) => setCharacterBaseX(Number(e.target.value))}
              />
            </Field>
            <Field flex="1 1 11.25rem">
              <FieldLabel>Y 座標</FieldLabel>
              <ScreenNumberInput
                type="number"
                value={characterBaseY}
                inputProps={{
                  min: 0,
                  max: 240,
                  "aria-label": "キャラクター Y 座標",
                }}
                onChange={(e) => setCharacterBaseY(Number(e.target.value))}
              />
            </Field>
            <FullWidthActionRow>
              <WideTallToolButton
                type="button"
                tone="primary"
                onClick={handleAddCharacter}
              >
                キャラクターを追加
              </WideTallToolButton>
            </FullWidthActionRow>
          </TwoColumnFieldGrid>

          {pipe(
            activeCharacter,
            O.match(
              () => (
                <HelperText>
                  配置するキャラクターセットを選択してください。
                </HelperText>
              ),
              (characterSet) => (
                <HelperText>
                  {`${characterSet.sprites.length} sprites を (${characterBaseX}, ${characterBaseY}) に配置します。`}
                </HelperText>
              ),
            ),
          )}
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelHeaderRow>
              <CollapseToggle
                type="button"
                open={isPlacementOpen}
                onClick={() => setIsPlacementOpen((prev) => !prev)}
              >
                {isPlacementOpen ? "閉じる" : "開く"}
                <CollapseChevron open={isPlacementOpen} />
              </CollapseToggle>
            </PanelHeaderRow>
            <PanelTitle>スプライト追加</PanelTitle>
          </PanelHeader>

          {isPlacementOpen ? (
            <TwoColumnFieldGrid>
              <Field flex="1 1 11.25rem">
                <FieldLabel>スプライト番号</FieldLabel>
                <ScreenNumberInput
                  type="number"
                  value={spriteNumber}
                  inputProps={{
                    min: 0,
                    max: 64,
                    "aria-label": "スプライト番号",
                  }}
                  onChange={(e) => setSpriteNumber(Number(e.target.value))}
                />
              </Field>
              <Field flex="1 1 11.25rem">
                <FieldLabel>X 座標</FieldLabel>
                <ScreenNumberInput
                  type="number"
                  value={x}
                  inputProps={{
                    min: 0,
                    max: 256,
                    "aria-label": "スプライト X 座標",
                  }}
                  onChange={(e) => setX(Number(e.target.value))}
                />
              </Field>
              <Field flex="1 1 11.25rem">
                <FieldLabel>Y 座標</FieldLabel>
                <ScreenNumberInput
                  type="number"
                  value={y}
                  inputProps={{
                    min: 0,
                    max: 240,
                    "aria-label": "スプライト Y 座標",
                  }}
                  onChange={(e) => setY(Number(e.target.value))}
                />
              </Field>
              <GridActionRow>
                <WideTallToolButton
                  type="button"
                  tone="primary"
                  onClick={handleAddSprite}
                >
                  スプライトを追加
                </WideTallToolButton>
              </GridActionRow>
            </TwoColumnFieldGrid>
          ) : (
            <HelperText>
              追加候補は sprite #{spriteNumber} を ({x}, {y}) に配置します。
            </HelperText>
          )}
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelHeaderRow>
              <CollapseToggle
                type="button"
                open={isSelectionOpen}
                onClick={() => setIsSelectionOpen((prev) => !prev)}
              >
                {isSelectionOpen ? "閉じる" : "開く"}
                <CollapseChevron open={isSelectionOpen} />
              </CollapseToggle>
            </PanelHeaderRow>
            <PanelTitle>選択中のスプライト</PanelTitle>
          </PanelHeader>

          {isSelectionOpen ? (
            <>
              <Field>
                <FieldLabel>スプライト一覧</FieldLabel>
                <ScreenSelectInput
                  variant="outlined"
                  onChange={(e) => {
                    const next = e.target.value;
                    if (typeof next !== "string") {
                      return;
                    }
                    setSelectedSpriteIndex(
                      next === "" ? O.none : O.some(Number(next)),
                    );
                  }}
                  value={pipe(
                    selectedSpriteIndex,
                    O.match(
                      () => "",
                      (index) => String(index),
                    ),
                  )}
                  inputProps={{
                    "aria-label": "スプライト一覧",
                  }}
                >
                  {spritesOnScreen.length === 0 && (
                    <MenuItem value="">スプライトが配置されていません</MenuItem>
                  )}
                  {spritesOnScreen.map((sprite, index) => (
                    <MenuItem key={index} value={String(index)}>
                      {`#${index} spriteIndex:${sprite.spriteIndex} ${sprite.width}x${sprite.height} @ ${sprite.x},${sprite.y} ${sprite.priority === "behindBg" ? "behind" : "front"}`}
                    </MenuItem>
                  ))}
                </ScreenSelectInput>
              </Field>

              {pipe(
                activeSprite,
                O.match(
                  () => (
                    <HelperText>
                      スプライトを追加するか、一覧から対象を選択してください。
                    </HelperText>
                  ),
                  (selectedSprite) => (
                    <>
                      <DetailList>
                        <ReadOnlyDetailRow>
                          <DetailKey>元スプライト</DetailKey>
                          <DetailValue>
                            spriteIndex {selectedSprite.spriteIndex}
                          </DetailValue>
                        </ReadOnlyDetailRow>
                        <ReadOnlyDetailRow>
                          <DetailKey>サイズ</DetailKey>
                          <DetailValue>
                            {selectedSprite.width}×{selectedSprite.height}
                          </DetailValue>
                        </ReadOnlyDetailRow>
                        <ReadOnlyDetailRow>
                          <DetailKey>優先度</DetailKey>
                          <DetailValue>
                            {selectedSprite.priority === "behindBg"
                              ? "背景の後ろ"
                              : "背景の前"}
                          </DetailValue>
                        </ReadOnlyDetailRow>
                        <ReadOnlyDetailRow>
                          <DetailKey>反転</DetailKey>
                          <DetailValue>
                            {`${selectedSprite.flipH === true ? "H" : "-"} / ${selectedSprite.flipV === true ? "V" : "-"}`}
                          </DetailValue>
                        </ReadOnlyDetailRow>
                      </DetailList>

                      <TwoColumnFieldGrid>
                        <Field flex="1 1 11.25rem">
                          <FieldLabel>Position X</FieldLabel>
                          <ScreenNumberInput
                            type="number"
                            value={selectedSprite.x}
                            inputProps={{
                              "aria-label": "選択スプライト X 座標",
                            }}
                            onChange={(e) => {
                              const newX = Number(e.target.value);
                              const newSprites = spritesOnScreen.map((s, i) =>
                                i === selectedIndexValue
                                  ? { ...s, x: newX }
                                  : s,
                              );
                              const newScreen = {
                                ...screen,
                                sprites: newSprites,
                              };
                              const report = scan(newScreen);
                              if (report.ok === false) {
                                alert(
                                  "位置の更新に失敗しました。制約違反:\n" +
                                    report.errors.join("\n"),
                                );
                                return;
                              }
                              setScreenAndSyncNes(newScreen);
                            }}
                          />
                        </Field>
                        <Field flex="1 1 11.25rem">
                          <FieldLabel>Position Y</FieldLabel>
                          <ScreenNumberInput
                            type="number"
                            value={selectedSprite.y}
                            inputProps={{
                              "aria-label": "選択スプライト Y 座標",
                            }}
                            onChange={(e) => {
                              const newY = Number(e.target.value);
                              const newSprites = spritesOnScreen.map((s, i) =>
                                i === selectedIndexValue
                                  ? { ...s, y: newY }
                                  : s,
                              );
                              const newScreen = {
                                ...screen,
                                sprites: newSprites,
                              };
                              const report = scan(newScreen);
                              if (report.ok === false) {
                                alert(
                                  "位置の更新に失敗しました。制約違反:\n" +
                                    report.errors.join("\n"),
                                );
                                return;
                              }
                              setScreenAndSyncNes(newScreen);
                            }}
                          />
                        </Field>
                        <Field flex="1 1 11.25rem">
                          <FieldLabel>Priority</FieldLabel>
                          <ScreenSelectInput
                            variant="outlined"
                            value={selectedSprite.priority}
                            inputProps={{
                              "aria-label": "選択スプライトの優先度",
                            }}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value !== "front" && value !== "behindBg") {
                                return;
                              }
                              const nextPriority: SpritePriority = value;
                              const newSprites = spritesOnScreen.map((s, i) =>
                                i === selectedIndexValue
                                  ? { ...s, priority: nextPriority }
                                  : s,
                              );
                              const newScreen = {
                                ...screen,
                                sprites: newSprites,
                              };
                              const report = scan(newScreen);
                              if (report.ok === false) {
                                alert(
                                  "優先度の更新に失敗しました。制約違反:\n" +
                                    report.errors.join("\n"),
                                );
                                return;
                              }
                              setScreenAndSyncNes(newScreen);
                            }}
                          >
                            <MenuItem value="front">前面</MenuItem>
                            <MenuItem value="behindBg">背景の後ろ</MenuItem>
                          </ScreenSelectInput>
                        </Field>
                        <Field flex="1 1 11.25rem">
                          <FieldLabel>Flip</FieldLabel>
                          <FlipButtonGrid>
                            <FlipToolButton
                              type="button"
                              active={selectedSprite.flipH === true}
                              onClick={() => {
                                const newSprites = spritesOnScreen.map(
                                  (s, i) =>
                                    i === selectedIndexValue
                                      ? { ...s, flipH: s.flipH === false }
                                      : s,
                                );
                                const newScreen = {
                                  ...screen,
                                  sprites: newSprites,
                                };
                                setScreenAndSyncNes(newScreen);
                              }}
                            >
                              H反転
                            </FlipToolButton>
                            <FlipToolButton
                              type="button"
                              active={selectedSprite.flipV === true}
                              onClick={() => {
                                const newSprites = spritesOnScreen.map(
                                  (s, i) =>
                                    i === selectedIndexValue
                                      ? { ...s, flipV: s.flipV === false }
                                      : s,
                                );
                                const newScreen = {
                                  ...screen,
                                  sprites: newSprites,
                                };
                                setScreenAndSyncNes(newScreen);
                              }}
                            >
                              V反転
                            </FlipToolButton>
                          </FlipButtonGrid>
                        </Field>
                      </TwoColumnFieldGrid>

                      <WideTallToolButton
                        type="button"
                        tone="danger"
                        onClick={() => {
                          const newSprites = spritesOnScreen.filter(
                            (_, i) => i !== selectedIndexValue,
                          );
                          const newScreen = { ...screen, sprites: newSprites };
                          const report = scan(newScreen);
                          if (report.ok === false) {
                            alert(
                              "削除後の状態で制約違反が検出されました:\n" +
                                report.errors.join("\n"),
                            );
                          }
                          setScreenAndSyncNes(newScreen);
                          setSelectedSpriteIndex(O.none);
                        }}
                      >
                        このスプライトを削除
                      </WideTallToolButton>
                    </>
                  ),
                ),
              )}
            </>
          ) : (
            <HelperText>
              {pipe(
                selectedSpriteIndex,
                O.match(
                  () => "現在は未選択です。",
                  (index) => `現在は #${index} を選択中です。`,
                ),
              )}
            </HelperText>
          )}
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelHeaderRow>
              <CollapseToggle
                type="button"
                open={isGroupMoveOpen}
                onClick={() => setIsGroupMoveOpen((prev) => !prev)}
              >
                {isGroupMoveOpen ? "閉じる" : "開く"}
                <CollapseChevron open={isGroupMoveOpen} />
              </CollapseToggle>
            </PanelHeaderRow>
            <PanelTitle>グループ移動</PanelTitle>
          </PanelHeader>

          {isGroupMoveOpen ? (
            <>
              <Field>
                <FieldLabel>選択中のスプライト</FieldLabel>
                <ScreenSelectInput
                  variant="outlined"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (typeof value !== "string") {
                      return;
                    }
                    if (value === "") {
                      return;
                    }
                    const index = Number(value);
                    if (selectedSpriteIndices.has(index)) {
                      removeFromGroupSelection(index);
                    } else {
                      addToGroupSelection(index);
                    }
                  }}
                  value=""
                  inputProps={{
                    "aria-label": "グループ移動対象のスプライト",
                  }}
                >
                  <MenuItem value="">スプライトを追加...</MenuItem>
                  {spritesOnScreen.map((sprite, index) => (
                    <MenuItem key={index} value={String(index)}>
                      {`#${index} ${selectedSpriteIndices.has(index) ? "✓" : " "} spriteIndex:${sprite.spriteIndex} @ ${sprite.x},${sprite.y}`}
                    </MenuItem>
                  ))}
                </ScreenSelectInput>
              </Field>

              {selectedSpriteIndices.size > 0 && (
                <>
                  <DetailList>
                    <ReadOnlyDetailRow>
                      <DetailKey>選択数</DetailKey>
                      <DetailValue>{selectedSpriteIndices.size}</DetailValue>
                    </ReadOnlyDetailRow>
                    {(() => {
                      const bounds = getGroupBounds(
                        spritesOnScreen,
                        selectedSpriteIndices,
                      );
                      const isValidBounds =
                        bounds.minX !== Infinity &&
                        bounds.minY !== Infinity &&
                        bounds.maxX !== -Infinity &&
                        bounds.maxY !== -Infinity;

                      return isValidBounds ? (
                        <>
                          <ReadOnlyDetailRow>
                            <DetailKey>グループ位置</DetailKey>
                            <DetailValue>
                              {bounds.minX}, {bounds.minY}
                            </DetailValue>
                          </ReadOnlyDetailRow>
                          <ReadOnlyDetailRow>
                            <DetailKey>グループサイズ</DetailKey>
                            <DetailValue>
                              {bounds.maxX - bounds.minX}×
                              {bounds.maxY - bounds.minY}
                            </DetailValue>
                          </ReadOnlyDetailRow>
                        </>
                      ) : (
                        <></>
                      );
                    })()}
                  </DetailList>

                  <TwoColumnFieldGrid>
                    <Field flex="1 1 11.25rem">
                      <FieldLabel>移動 X</FieldLabel>
                      <ScreenNumberInput
                        type="number"
                        value={groupMoveDeltaX}
                        inputProps={{
                          "aria-label": "グループ移動 X",
                        }}
                        onChange={(e) =>
                          setGroupMoveDeltaX(Number(e.target.value))
                        }
                      />
                    </Field>
                    <Field flex="1 1 11.25rem">
                      <FieldLabel>移動 Y</FieldLabel>
                      <ScreenNumberInput
                        type="number"
                        value={groupMoveDeltaY}
                        inputProps={{
                          "aria-label": "グループ移動 Y",
                        }}
                        onChange={(e) =>
                          setGroupMoveDeltaY(Number(e.target.value))
                        }
                      />
                    </Field>
                    <GroupActionButton
                      type="button"
                      tone="primary"
                      onClick={handleMoveSelectedGroup}
                    >
                      グループを移動
                    </GroupActionButton>
                    <GroupActionButton
                      type="button"
                      tone="neutral"
                      onClick={clearGroupSelection}
                    >
                      選択をクリア
                    </GroupActionButton>
                  </TwoColumnFieldGrid>
                </>
              )}

              {selectedSpriteIndices.size === 0 && (
                <HelperText>
                  移動するスプライトを選択してください。複数選択可能です。
                </HelperText>
              )}
            </>
          ) : (
            <HelperText>
              {selectedSpriteIndices.size === 0
                ? "グループ移動を使用していません。"
                : `${selectedSpriteIndices.size}個のスプライトがグループ選択中です。`}
            </HelperText>
          )}
        </Panel>
      </ScrollColumn>

      <Panel flex={1} minHeight={0}>
        <PanelHeader>
          <PanelHeaderRow>
            <PanelTitle>画面プレビュー</PanelTitle>
            <ProjectActions
              actions={[
                {
                  label: "PNGエクスポート",
                  onSelect: () => exportPng(getHexArrayForScreen(screen)),
                },
                {
                  label: "SVGエクスポート",
                  onSelect: () => exportSvgSimple(getHexArrayForScreen(screen)),
                },
                { label: "保存", onSelect: () => exportJSON(projectState) },
              ]}
              onImport={handleImport}
            />
          </PanelHeaderRow>

          <ZoomControlsRow>
            <Badge tone="neutral">{`${screenZoomLevel}x`}</Badge>
            <ToolButton
              type="button"
              aria-label="画面ズーム縮小"
              onClick={handleZoomOut}
            >
              -
            </ToolButton>
            <ToolButton
              type="button"
              aria-label="画面ズーム拡大"
              onClick={handleZoomIn}
            >
              +
            </ToolButton>
          </ZoomControlsRow>
        </PanelHeader>

        <PreviewViewport
          ref={(element: HTMLDivElement | null) => {
            viewportElementRef.current = O.fromNullable(element);
          }}
          aria-label="画面プレビューキャンバスビュー"
          onWheel={handleViewportWheel}
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={handleViewportPointerEnd}
          onPointerCancel={handleViewportPointerEnd}
          onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
            if (event.button === 1) {
              event.preventDefault();
            }
          }}
          active={O.isSome(viewportPanState)}
        >
          <PreviewCanvasWrap>
            <ScreenCanvas
              ariaLabel="画面プレビューキャンバス"
              scale={screenZoomLevel}
              showGrid={true}
            />
          </PreviewCanvasWrap>
        </PreviewViewport>

        {scanReport.ok === false && (
          <WarningList>
            {scanReport.errors.map((error: string) => (
              <DetailRow key={error}>
                <DetailKey>警告</DetailKey>
                <DetailValue>{error}</DetailValue>
              </DetailRow>
            ))}
          </WarningList>
        )}
      </Panel>
    </SplitLayout>
  );
};
