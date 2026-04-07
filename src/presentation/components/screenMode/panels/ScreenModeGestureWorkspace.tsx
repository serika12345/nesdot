import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { ButtonBase, Menu, MenuItem, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  Badge,
  CollapseToggle,
  FieldLabel,
  HelperText,
  PanelHeaderRow,
} from "../../../App.styles";
import { CharacterModeTilePreview } from "../../characterMode/preview/CharacterModeTilePreview";
import { ScreenCanvas } from "../../common/canvas/ScreenCanvas";
import type { ScreenModeState } from "../hooks/useScreenModeState";
import {
  PreviewCanvasWrap,
  PreviewViewport,
} from "../primitives/ScreenModePrimitives";

const shouldForwardStageProp = (prop: PropertyKey): boolean =>
  prop !== "draggingState" && prop !== "stageHeight" && prop !== "stageWidth";

const shouldForwardSpriteOutlineProp = (prop: PropertyKey): boolean =>
  prop !== "outlineVisibleState" &&
  prop !== "selectedState" &&
  prop !== "spriteHeight" &&
  prop !== "spriteWidth" &&
  prop !== "spriteX" &&
  prop !== "spriteY";

const shouldForwardMarqueeProp = (prop: PropertyKey): boolean =>
  prop !== "marqueeHeight" &&
  prop !== "marqueeWidth" &&
  prop !== "marqueeX" &&
  prop !== "marqueeY";

const shouldForwardDraggingProp = (prop: PropertyKey): boolean =>
  prop !== "draggingState";

const shouldForwardFloatingPreviewProp = (prop: PropertyKey): boolean =>
  prop !== "previewLeft" && prop !== "previewTop";

const shouldForwardOpenStateProp = (prop: PropertyKey): boolean =>
  prop !== "openState";

const collapseChevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

const StageSurface = styled("div", {
  shouldForwardProp: shouldForwardStageProp,
})<{ stageWidth: number; stageHeight: number; draggingState: boolean }>(
  ({ draggingState, stageHeight, stageWidth }) => ({
    position: "relative",
    width: stageWidth,
    height: stageHeight,
    cursor: draggingState === true ? "grabbing" : "default",
    touchAction: "none",
    userSelect: "none",
  }),
);

const StageInteractionLayer = styled("div")({
  position: "absolute",
  inset: 0,
  zIndex: 3,
});

const StageSpriteOutline = styled("div", {
  shouldForwardProp: shouldForwardSpriteOutlineProp,
})<{
  spriteX: number;
  spriteY: number;
  spriteWidth: number;
  spriteHeight: number;
  selectedState: boolean;
  outlineVisibleState: boolean;
}>(({
  outlineVisibleState,
  selectedState,
  spriteHeight,
  spriteWidth,
  spriteX,
  spriteY,
}) => {
  if (outlineVisibleState === false) {
    return {
      position: "absolute",
      left: spriteX,
      top: spriteY,
      width: spriteWidth,
      height: spriteHeight,
      border: "none",
      borderRadius: 0,
      background: "transparent",
      pointerEvents: "none",
    };
  }

  return {
    position: "absolute",
    left: spriteX,
    top: spriteY,
    width: spriteWidth,
    height: spriteHeight,
    border:
      selectedState === true
        ? "0.125rem solid rgba(20, 184, 166, 0.92)"
        : "0.0625rem solid rgba(148, 163, 184, 0.68)",
    borderRadius: 0,
    background:
      selectedState === true
        ? "rgba(45, 212, 191, 0.1)"
        : "rgba(255, 255, 255, 0.02)",
    pointerEvents: "none",
  };
});

const StageSpriteIndex = styled("span")({
  position: "absolute",
  left: "0.1875rem",
  top: "0.1875rem",
  borderRadius: "999px",
  padding: "0.125rem 0.375rem",
  fontSize: "0.625rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  color: "#f8fafc",
  background: "rgba(15, 23, 42, 0.66)",
  lineHeight: 1.2,
});

const StageMarquee = styled("div", {
  shouldForwardProp: shouldForwardMarqueeProp,
})<{
  marqueeX: number;
  marqueeY: number;
  marqueeWidth: number;
  marqueeHeight: number;
}>(({ marqueeHeight, marqueeWidth, marqueeX, marqueeY }) => ({
  position: "absolute",
  left: marqueeX,
  top: marqueeY,
  width: marqueeWidth,
  height: marqueeHeight,
  border: "0.0625rem solid rgba(45, 212, 191, 0.9)",
  background: "rgba(45, 212, 191, 0.12)",
  borderRadius: "0.375rem",
  pointerEvents: "none",
}));

const StageGuide = styled(HelperText)({
  marginTop: "0.25rem",
});

const WorkspaceColumns = styled(Stack)(({ theme }) => ({
  minHeight: 0,
  minWidth: 0,
  flex: "1 1 0",
  gap: theme.spacing(2),
  flexDirection: "column",
  [theme.breakpoints.up("lg")]: {
    flexDirection: "row",
  },
}));

const LibrarySidebar = styled(Stack)(({ theme }) => ({
  minHeight: 0,
  minWidth: 0,
  maxHeight: "100%",
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarGutter: "stable",
  gap: theme.spacing(1.5),
  [theme.breakpoints.up("lg")]: {
    width: "21rem",
    flexShrink: 0,
  },
}));

const StageWorkspace = styled(Stack)({
  minHeight: 0,
  minWidth: 0,
  flex: "1 1 0",
});

const LibrarySection = styled(Stack)({
  position: "relative",
  flexShrink: 0,
  overflow: "hidden",
  borderRadius: "1rem",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92))",
  padding: "0.75rem",
  gap: "0.625rem",
  minHeight: 0,
});

const LibraryHeader = styled(PanelHeaderRow)({
  alignItems: "center",
});

const LibraryHeaderActions = styled(Stack)({
  flexDirection: "row",
  alignItems: "center",
  gap: "0.5rem",
});

const LibrarySectionContent = styled("div", {
  shouldForwardProp: shouldForwardOpenStateProp,
})<{ openState: boolean }>(({ openState }) => ({
  display: openState === true ? "block" : "none",
  minHeight: 0,
}));

const LibraryScrollArea = styled("div")({
  maxHeight: "15.5rem",
  overflowY: "auto",
  overflowX: "hidden",
  paddingRight: "0.25rem",
  scrollbarGutter: "stable",
});

const SpriteLibraryScrollArea = styled(LibraryScrollArea)({
  maxHeight: "13.5rem",
});

const SpriteLibraryGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0.625rem",
});

const CharacterLibraryGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "0.625rem",
});

const LibraryPreviewButton = styled(ButtonBase, {
  shouldForwardProp: shouldForwardDraggingProp,
})<{ draggingState?: boolean }>(({ draggingState }) => ({
  appearance: "none",
  width: "100%",
  minWidth: 0,
  minHeight: "6rem",
  borderRadius: "0.875rem",
  border:
    draggingState === true
      ? "0.0625rem solid rgba(15, 118, 110, 0.46)"
      : "0.0625rem solid rgba(148, 163, 184, 0.2)",
  background:
    draggingState === true
      ? "rgba(240, 253, 250, 0.96)"
      : "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94))",
  padding: "0.5rem",
  cursor: "grab",
  touchAction: "none",
  userSelect: "none",
  transition: "transform 160ms ease, border-color 160ms ease",
  boxShadow: "0 0.5rem 1rem rgba(15, 23, 42, 0.08)",
  "&:active": {
    cursor: "grabbing",
  },
}));

const LibraryButtonLayout = styled(Stack)({
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  gap: "0.375rem",
});

const PreviewLabel = styled("span")({
  fontSize: "0.625rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "var(--ink-soft)",
});

const CharacterPreviewTiles = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.25rem",
  minHeight: "1.5rem",
});

const FloatingDragPreview = styled("div", {
  shouldForwardProp: shouldForwardFloatingPreviewProp,
})<{ previewLeft: number; previewTop: number }>(
  ({ previewLeft, previewTop }) => ({
    position: "fixed",
    left: previewLeft,
    top: previewTop,
    zIndex: 9997,
    pointerEvents: "none",
    borderRadius: "0.875rem",
    border: "0.0625rem solid rgba(15, 118, 110, 0.36)",
    background: "rgba(240, 253, 250, 0.96)",
    boxShadow: "0 1rem 1.75rem rgba(15, 118, 110, 0.2)",
    padding: "0.5rem",
    minWidth: "4.25rem",
  }),
);

const FloatingPreviewBody = styled(Stack)({
  alignItems: "center",
  justifyContent: "center",
  gap: "0.375rem",
});

const resolveMenuPosition = (
  menuClientX: number,
  menuClientY: number,
): {
  left: number;
  top: number;
} => {
  const viewportWidth =
    typeof window === "undefined" ? menuClientX : window.innerWidth;
  const viewportHeight =
    typeof window === "undefined" ? menuClientY : window.innerHeight;

  return {
    left: Math.max(12, Math.min(menuClientX, viewportWidth - 232)),
    top: Math.max(12, Math.min(menuClientY, viewportHeight - 272)),
  };
};

const isSpriteDragState = (
  dragState: ScreenModeState["gestureLibraryDragState"],
  spriteIndex: number,
): boolean =>
  pipe(
    dragState,
    O.match(
      () => false,
      (drag) => drag.kind === "sprite" && drag.spriteIndex === spriteIndex,
    ),
  );

const isCharacterDragState = (
  dragState: ScreenModeState["gestureLibraryDragState"],
  characterId: string,
): boolean =>
  pipe(
    dragState,
    O.match(
      () => false,
      (drag) => drag.kind === "character" && drag.characterId === characterId,
    ),
  );

interface ScreenModeGestureWorkspaceProps {
  screenMode: ScreenModeState;
  isSpriteOutlineVisible: boolean;
  isSpriteIndexVisible: boolean;
}

/**
 * スクリーン配置モードのジェスチャー中心ワークスペースを描画します。
 * ライブラリ表示、ステージ操作、コンテキストメニュー、ドラッグプレビューをまとめて扱います。
 */
export const ScreenModeGestureWorkspace: React.FC<
  ScreenModeGestureWorkspaceProps
> = ({ screenMode, isSpriteOutlineVisible, isSpriteIndexVisible }) => {
  const spriteLibraryContentId = React.useId();
  const characterLibraryContentId = React.useId();
  const [isSpriteLibraryOpen, setIsSpriteLibraryOpen] = React.useState(true);
  const [isCharacterLibraryOpen, setIsCharacterLibraryOpen] =
    React.useState(true);

  const {
    screen,
    sprites,
    characterPreviewCards,
    screenZoomLevel,
    viewportPanState,
    gestureContextMenu,
    gestureLibraryDragState,
    gestureMarqueeRect,
    gestureSelectedSpriteCount,
    gestureSelectedSpriteIndices,
    gestureStageSpriteLayout,
    isStageDragging,
    closeGestureContextMenu,
    handleDeleteGestureContextMenuSprites,
    handleLibraryCharacterPointerDown,
    handleLibrarySpritePointerDown,
    handleLowerGestureContextMenuLayer,
    handleRaiseGestureContextMenuLayer,
    handleSetGesturePriorityBehind,
    handleSetGesturePriorityFront,
    handleStageContextMenu,
    handleStagePointerDown,
    handleStagePointerMove,
    handleStagePointerEnd,
    handleToggleGestureFlipH,
    handleToggleGestureFlipV,
    setStageRef,
    setViewportRef,
    handleViewportWheel,
    handleViewportPointerDown,
    handleViewportPointerMove,
    handleViewportPointerEnd,
  } = screenMode;

  const stageWidth = screen.width * screenZoomLevel;
  const stageHeight = screen.height * screenZoomLevel;

  const contextMenuPosition = pipe(
    gestureContextMenu,
    O.map((menu) => resolveMenuPosition(menu.clientX, menu.clientY)),
  );

  const floatingPreview = pipe(
    gestureLibraryDragState,
    O.match(
      () => <></>,
      (dragState) => {
        const previewCardOption =
          dragState.kind === "character"
            ? O.fromNullable(
                characterPreviewCards.find(
                  (card) => card.id === dragState.characterId,
                ),
              )
            : O.none;

        const characterPreviewContent = pipe(
          previewCardOption,
          O.match(
            () => <CharacterPreviewTiles />,
            (previewCard) => (
              <CharacterPreviewTiles>
                {previewCard.previewSpriteIndices.map((spriteIndex) => (
                  <CharacterModeTilePreview
                    key={`floating-character-sprite-${previewCard.id}-${spriteIndex}`}
                    scale={2}
                    tileOption={O.fromNullable(sprites[spriteIndex])}
                  />
                ))}
              </CharacterPreviewTiles>
            ),
          ),
        );

        const characterPreviewName = pipe(
          previewCardOption,
          O.match(
            () => "Character",
            (previewCard) => previewCard.name,
          ),
        );

        return (
          <FloatingDragPreview
            previewLeft={dragState.clientX + 18}
            previewTop={dragState.clientY + 18}
          >
            <FloatingPreviewBody>
              {dragState.kind === "sprite" ? (
                <CharacterModeTilePreview
                  scale={3}
                  tileOption={O.fromNullable(sprites[dragState.spriteIndex])}
                />
              ) : (
                characterPreviewContent
              )}
              <PreviewLabel>
                {dragState.kind === "sprite"
                  ? `Sprite ${dragState.spriteIndex}`
                  : characterPreviewName}
              </PreviewLabel>
            </FloatingPreviewBody>
          </FloatingDragPreview>
        );
      },
    ),
  );

  return (
    <>
      <StageGuide>
        スプライト/キャラクタープレビューをドラッグして配置。右クリックで編集メニュー、Shift+クリックで複数選択、ドラッグで移動できます。
      </StageGuide>

      <WorkspaceColumns>
        <LibrarySidebar
          role="complementary"
          aria-label="スクリーン配置サイドバー"
        >
          <LibrarySection
            role="region"
            aria-label="スクリーン配置スプライトライブラリ"
          >
            <LibraryHeader>
              <Stack direction="row" spacing="0.75rem" alignItems="center">
                <FieldLabel>スプライトプレビュー</FieldLabel>
                <CollapseToggle
                  type="button"
                  open={isSpriteLibraryOpen}
                  aria-expanded={isSpriteLibraryOpen}
                  aria-controls={spriteLibraryContentId}
                  aria-label={
                    isSpriteLibraryOpen
                      ? "スプライトプレビューを閉じる"
                      : "スプライトプレビューを開く"
                  }
                  onClick={() =>
                    setIsSpriteLibraryOpen((previous) => previous === false)
                  }
                >
                  {isSpriteLibraryOpen ? "閉じる" : "開く"}
                  <ExpandMoreRoundedIcon
                    style={collapseChevronStyle(isSpriteLibraryOpen)}
                  />
                </CollapseToggle>
              </Stack>
            </LibraryHeader>

            <LibrarySectionContent
              id={spriteLibraryContentId}
              openState={isSpriteLibraryOpen}
              aria-hidden={isSpriteLibraryOpen === false}
            >
              <SpriteLibraryScrollArea>
                <SpriteLibraryGrid>
                  {sprites.map((sprite, spriteIndex) => (
                    <LibraryPreviewButton
                      key={`screen-library-sprite-${spriteIndex}`}
                      type="button"
                      aria-label={`スクリーンライブラリスプライト ${spriteIndex}`}
                      draggingState={isSpriteDragState(
                        gestureLibraryDragState,
                        spriteIndex,
                      )}
                      draggable={false}
                      onDragStart={(event) => event.preventDefault()}
                      onPointerDown={(event) =>
                        handleLibrarySpritePointerDown(event, spriteIndex)
                      }
                    >
                      <LibraryButtonLayout>
                        <CharacterModeTilePreview
                          scale={3}
                          tileOption={O.some(sprite)}
                        />
                        <PreviewLabel>{`Sprite ${spriteIndex}`}</PreviewLabel>
                        <Badge tone="accent">{`${sprite.width}×${sprite.height}`}</Badge>
                      </LibraryButtonLayout>
                    </LibraryPreviewButton>
                  ))}
                </SpriteLibraryGrid>
              </SpriteLibraryScrollArea>
            </LibrarySectionContent>
          </LibrarySection>

          <LibrarySection
            role="region"
            aria-label="スクリーン配置キャラクターライブラリ"
          >
            <LibraryHeader>
              <FieldLabel>キャラクタープレビュー</FieldLabel>
              <LibraryHeaderActions>
                <Badge tone="neutral">{`${characterPreviewCards.length} sets`}</Badge>
                <CollapseToggle
                  type="button"
                  open={isCharacterLibraryOpen}
                  aria-expanded={isCharacterLibraryOpen}
                  aria-controls={characterLibraryContentId}
                  aria-label={
                    isCharacterLibraryOpen
                      ? "キャラクタープレビューを閉じる"
                      : "キャラクタープレビューを開く"
                  }
                  onClick={() =>
                    setIsCharacterLibraryOpen((previous) => previous === false)
                  }
                >
                  {isCharacterLibraryOpen ? "閉じる" : "開く"}
                  <ExpandMoreRoundedIcon
                    style={collapseChevronStyle(isCharacterLibraryOpen)}
                  />
                </CollapseToggle>
              </LibraryHeaderActions>
            </LibraryHeader>

            <LibrarySectionContent
              id={characterLibraryContentId}
              openState={isCharacterLibraryOpen}
              aria-hidden={isCharacterLibraryOpen === false}
            >
              {characterPreviewCards.length > 0 ? (
                <LibraryScrollArea>
                  <CharacterLibraryGrid>
                    {characterPreviewCards.map((characterCard) => (
                      <LibraryPreviewButton
                        key={`screen-library-character-${characterCard.id}`}
                        type="button"
                        aria-label={`スクリーンキャラクタープレビュー ${characterCard.name}`}
                        draggingState={isCharacterDragState(
                          gestureLibraryDragState,
                          characterCard.id,
                        )}
                        draggable={false}
                        onDragStart={(event) => event.preventDefault()}
                        onPointerDown={(event) =>
                          handleLibraryCharacterPointerDown(
                            event,
                            characterCard.id,
                          )
                        }
                      >
                        <LibraryButtonLayout>
                          <CharacterPreviewTiles>
                            {characterCard.previewSpriteIndices.map(
                              (spriteIndex) => (
                                <CharacterModeTilePreview
                                  key={`screen-library-character-sprite-${characterCard.id}-${spriteIndex}`}
                                  scale={2}
                                  tileOption={O.fromNullable(
                                    sprites[spriteIndex],
                                  )}
                                />
                              ),
                            )}
                          </CharacterPreviewTiles>
                          <PreviewLabel>{characterCard.name}</PreviewLabel>
                          <Badge tone="accent">{`${characterCard.spriteCount} sprites`}</Badge>
                        </LibraryButtonLayout>
                      </LibraryPreviewButton>
                    ))}
                  </CharacterLibraryGrid>
                </LibraryScrollArea>
              ) : (
                <HelperText>
                  先にキャラクター編集モードでセットを作成すると、ここからドラッグ配置できます。
                </HelperText>
              )}
            </LibrarySectionContent>
          </LibrarySection>
        </LibrarySidebar>

        <StageWorkspace>
          <PreviewViewport
            ref={setViewportRef}
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
              <StageSurface
                ref={setStageRef}
                aria-label="スクリーン配置ステージ"
                stageWidth={stageWidth}
                stageHeight={stageHeight}
                draggingState={isStageDragging}
                onContextMenu={handleStageContextMenu}
                onPointerDown={handleStagePointerDown}
                onPointerMove={handleStagePointerMove}
                onPointerUp={handleStagePointerEnd}
                onPointerCancel={handleStagePointerEnd}
                data-stage-sprite-count={screen.sprites.length}
                data-selected-sprite-count={gestureSelectedSpriteCount}
                data-stage-sprite-layout={gestureStageSpriteLayout}
              >
                <ScreenCanvas
                  ariaLabel="画面プレビューキャンバス"
                  scale={screenZoomLevel}
                  showGrid={true}
                />

                <StageInteractionLayer aria-hidden="true">
                  {screen.sprites.map((sprite, index) => (
                    <StageSpriteOutline
                      key={`screen-stage-sprite-outline-${index}`}
                      spriteX={sprite.x * screenZoomLevel}
                      spriteY={sprite.y * screenZoomLevel}
                      spriteWidth={sprite.width * screenZoomLevel}
                      spriteHeight={sprite.height * screenZoomLevel}
                      selectedState={gestureSelectedSpriteIndices.has(index)}
                      outlineVisibleState={isSpriteOutlineVisible}
                      data-stage-sprite-outline="true"
                    >
                      {isSpriteIndexVisible === true ? (
                        <StageSpriteIndex>{`#${index}`}</StageSpriteIndex>
                      ) : (
                        <></>
                      )}
                    </StageSpriteOutline>
                  ))}

                  {pipe(
                    gestureMarqueeRect,
                    O.match(
                      () => <></>,
                      (rect) => (
                        <StageMarquee
                          marqueeX={rect.x * screenZoomLevel}
                          marqueeY={rect.y * screenZoomLevel}
                          marqueeWidth={rect.width * screenZoomLevel}
                          marqueeHeight={rect.height * screenZoomLevel}
                        />
                      ),
                    ),
                  )}
                </StageInteractionLayer>
              </StageSurface>
            </PreviewCanvasWrap>
          </PreviewViewport>
        </StageWorkspace>
      </WorkspaceColumns>

      <Menu
        open={O.isSome(contextMenuPosition)}
        onClose={closeGestureContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={pipe(
          contextMenuPosition,
          O.getOrElse(() => ({ left: 0, top: 0 })),
        )}
        MenuListProps={{
          "aria-label": "スクリーン配置コンテキストメニュー",
        }}
      >
        <MenuItem onClick={handleRaiseGestureContextMenuLayer}>
          レイヤーを上げる
        </MenuItem>
        <MenuItem onClick={handleLowerGestureContextMenuLayer}>
          レイヤーを下げる
        </MenuItem>
        <MenuItem onClick={handleSetGesturePriorityFront}>
          優先度: 背景の前
        </MenuItem>
        <MenuItem onClick={handleSetGesturePriorityBehind}>
          優先度: 背景の後ろ
        </MenuItem>
        <MenuItem onClick={handleToggleGestureFlipH}>H反転</MenuItem>
        <MenuItem onClick={handleToggleGestureFlipV}>V反転</MenuItem>
        <MenuItem onClick={handleDeleteGestureContextMenuSprites}>
          削除
        </MenuItem>
      </Menu>

      {floatingPreview}
    </>
  );
};
