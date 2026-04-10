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

type StageSurfaceProps = React.ComponentProps<"div"> & {
  draggingState: boolean;
  stageHeight: number;
  stageWidth: number;
};

type StageSpriteOutlineProps = React.ComponentProps<"div"> & {
  outlineVisibleState: boolean;
  selectedState: boolean;
  spriteHeight: number;
  spriteWidth: number;
  spriteX: number;
  spriteY: number;
};

type StageMarqueeProps = React.ComponentProps<"div"> & {
  marqueeHeight: number;
  marqueeWidth: number;
  marqueeX: number;
  marqueeY: number;
};

type LibrarySectionContentProps = React.ComponentProps<"div"> & {
  openState: boolean;
};

type LibraryPreviewButtonProps = React.ComponentProps<typeof ButtonBase> & {
  draggingState?: boolean;
};

type FloatingDragPreviewProps = React.ComponentProps<"div"> & {
  previewLeft: number;
  previewTop: number;
};

const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";

const collapseChevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

const StageSurfaceRoot = styled("div")({
  position: "relative",
  touchAction: "none",
  userSelect: "none",
  "&[data-dragging-state='false']": {
    cursor: "default",
  },
  "&[data-dragging-state='true']": {
    cursor: "grabbing",
  },
});

const StageSurface = React.forwardRef<HTMLDivElement, StageSurfaceProps>(
  function StageSurface(
    { draggingState, stageHeight, stageWidth, style, ...props },
    ref,
  ) {
    return (
      <StageSurfaceRoot
        ref={ref}
        {...props}
        data-dragging-state={toBooleanDataValue(draggingState)}
        style={{ ...style, width: stageWidth, height: stageHeight }}
      />
    );
  },
);

const StageInteractionLayer = styled("div")({
  position: "absolute",
  inset: 0,
  zIndex: 3,
});

const StageSpriteOutlineRoot = styled("div")({
  position: "absolute",
  borderRadius: 0,
  pointerEvents: "none",
  "&[data-outline-visible-state='false']": {
    border: "none",
    background: "transparent",
  },
  "&[data-outline-visible-state='true'][data-selected-state='false']": {
    border: "0.0625rem solid rgba(148, 163, 184, 0.68)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  "&[data-outline-visible-state='true'][data-selected-state='true']": {
    border: "0.125rem solid rgba(20, 184, 166, 0.92)",
    background: "rgba(45, 212, 191, 0.1)",
  },
});

const StageSpriteOutline = React.forwardRef<
  HTMLDivElement,
  StageSpriteOutlineProps
>(function StageSpriteOutline(
  {
    outlineVisibleState,
    selectedState,
    spriteHeight,
    spriteWidth,
    spriteX,
    spriteY,
    style,
    ...props
  },
  ref,
) {
  return (
    <StageSpriteOutlineRoot
      ref={ref}
      {...props}
      data-outline-visible-state={toBooleanDataValue(outlineVisibleState)}
      data-selected-state={toBooleanDataValue(selectedState)}
      style={{
        ...style,
        left: spriteX,
        top: spriteY,
        width: spriteWidth,
        height: spriteHeight,
      }}
    />
  );
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

const StageMarqueeRoot = styled("div")({
  position: "absolute",
  border: "0.0625rem solid rgba(45, 212, 191, 0.9)",
  background: "rgba(45, 212, 191, 0.12)",
  borderRadius: "0.375rem",
  pointerEvents: "none",
});

const StageMarquee = React.forwardRef<HTMLDivElement, StageMarqueeProps>(
  function StageMarquee(
    { marqueeHeight, marqueeWidth, marqueeX, marqueeY, style, ...props },
    ref,
  ) {
    return (
      <StageMarqueeRoot
        ref={ref}
        {...props}
        style={{
          ...style,
          left: marqueeX,
          top: marqueeY,
          width: marqueeWidth,
          height: marqueeHeight,
        }}
      />
    );
  },
);

const StageGuide = styled(HelperText)({
  marginTop: "0.25rem",
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

const LibrarySectionContentRoot = styled("div")({
  minHeight: 0,
  "&[data-open-state='false']": {
    display: "none",
  },
  "&[data-open-state='true']": {
    display: "block",
  },
});

const LibrarySectionContent = React.forwardRef<
  HTMLDivElement,
  LibrarySectionContentProps
>(function LibrarySectionContent({ openState, ...props }, ref) {
  return (
    <LibrarySectionContentRoot
      ref={ref}
      {...props}
      data-open-state={toBooleanDataValue(openState)}
    />
  );
});

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

const LibraryPreviewButtonRoot = styled(ButtonBase)({
  appearance: "none",
  width: "100%",
  minWidth: 0,
  minHeight: "6rem",
  borderRadius: "0.875rem",
  padding: "0.5rem",
  cursor: "grab",
  touchAction: "none",
  userSelect: "none",
  transition: "transform 160ms ease, border-color 160ms ease",
  "&[data-dragging-state='false']": {
    border: "0.0625rem solid rgba(148, 163, 184, 0.2)",
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94))",
    boxShadow: "0 0.5rem 1rem rgba(15, 23, 42, 0.08)",
  },
  "&[data-dragging-state='true']": {
    border: "0.0625rem solid rgba(15, 118, 110, 0.46)",
    background: "rgba(240, 253, 250, 0.96)",
    boxShadow: "0 0.5rem 1rem rgba(15, 23, 42, 0.08)",
  },
  "&:active": {
    cursor: "grabbing",
  },
});

const LibraryPreviewButton = React.forwardRef<
  HTMLButtonElement,
  LibraryPreviewButtonProps
>(function LibraryPreviewButton({ draggingState, ...props }, ref) {
  return (
    <LibraryPreviewButtonRoot
      ref={ref}
      {...props}
      data-dragging-state={toBooleanDataValue(draggingState)}
    />
  );
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

const FloatingDragPreviewRoot = styled("div")({
  position: "fixed",
  zIndex: 9997,
  pointerEvents: "none",
  borderRadius: "0.875rem",
  border: "0.0625rem solid rgba(15, 118, 110, 0.36)",
  background: "rgba(240, 253, 250, 0.96)",
  boxShadow: "0 1rem 1.75rem rgba(15, 118, 110, 0.2)",
  padding: "0.5rem",
  minWidth: "4.25rem",
});

const FloatingDragPreview = React.forwardRef<
  HTMLDivElement,
  FloatingDragPreviewProps
>(function FloatingDragPreview(
  { previewLeft, previewTop, style, ...props },
  ref,
) {
  return (
    <FloatingDragPreviewRoot
      ref={ref}
      {...props}
      style={{ ...style, left: previewLeft, top: previewTop }}
    />
  );
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
  backgroundEditing?: {
    overlay: React.ReactNode;
    onClick: () => void;
    onPointerDown: (position: { x: number; y: number }, button: number) => void;
    onPointerMove: (
      position: { x: number; y: number },
      buttons: number,
    ) => void;
    onPointerUp: () => void;
  };
}

/**
 * スクリーン配置モードのジェスチャー中心ワークスペースを描画します。
 * ライブラリ表示、ステージ操作、コンテキストメニュー、ドラッグプレビューをまとめて扱います。
 */
export const ScreenModeGestureWorkspace: React.FC<
  ScreenModeGestureWorkspaceProps
> = ({
  screenMode,
  isSpriteOutlineVisible,
  isSpriteIndexVisible,
  backgroundEditing,
}) => {
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
    handleStageKeyDown,
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

  const resolveBackgroundStagePosition = React.useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>,
    ): O.Option<{ x: number; y: number }> => {
      const rect = event.currentTarget.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const relativeY = event.clientY - rect.top;
      const isWithinStage =
        relativeX >= 0 &&
        relativeY >= 0 &&
        relativeX < rect.width &&
        relativeY < rect.height;

      if (isWithinStage === false) {
        return O.none;
      }

      const stageX = Math.floor(relativeX / screenZoomLevel);
      const stageY = Math.floor(relativeY / screenZoomLevel);

      return O.some({
        x: Math.min(Math.floor(stageX / 8) * 8, screen.width - 8),
        y: Math.min(Math.floor(stageY / 8) * 8, screen.height - 8),
      });
    },
    [screen.height, screen.width, screenZoomLevel],
  );

  const handleStagePointerDownWithBackgroundEditing = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (typeof backgroundEditing === "undefined") {
        handleStagePointerDown(event);
        return;
      }

      if (event.button === 1) {
        return;
      }

      event.currentTarget.focus();
      event.preventDefault();

      pipe(
        resolveBackgroundStagePosition(event),
        O.map((position) => {
          backgroundEditing.onPointerDown(position, event.button);
        }),
      );
    },
    [backgroundEditing, handleStagePointerDown, resolveBackgroundStagePosition],
  );

  const handleStagePointerMoveWithBackgroundEditing = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (typeof backgroundEditing === "undefined") {
        handleStagePointerMove(event);
        return;
      }

      pipe(
        resolveBackgroundStagePosition(event),
        O.map((position) => {
          backgroundEditing.onPointerMove(position, event.buttons);
        }),
      );
    },
    [backgroundEditing, handleStagePointerMove, resolveBackgroundStagePosition],
  );

  const handleStagePointerEndWithBackgroundEditing = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (typeof backgroundEditing === "undefined") {
        handleStagePointerEnd(event);
        return;
      }

      backgroundEditing.onPointerUp();
    },
    [backgroundEditing, handleStagePointerEnd],
  );

  const handleStageContextMenuWithBackgroundEditing = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (typeof backgroundEditing === "undefined") {
        handleStageContextMenu(event);
        return;
      }

      event.preventDefault();
    },
    [backgroundEditing, handleStageContextMenu],
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
            <Stack
              useFlexGap
              alignItems="center"
              justifyContent="center"
              spacing="0.375rem"
            >
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
            </Stack>
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

      <Stack
        useFlexGap
        minHeight={0}
        minWidth={0}
        flex="1 1 0"
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
      >
        <Stack
          useFlexGap
          minHeight={0}
          minWidth={0}
          maxHeight="100%"
          spacing={1.5}
          width={{ lg: "21rem" }}
          flexShrink={{ lg: 0 }}
          style={{
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarGutter: "stable",
          }}
          role="complementary"
          aria-label="スクリーン配置サイドバー"
        >
          <LibrarySection
            role="region"
            aria-label="スクリーン配置スプライトライブラリ"
          >
            <PanelHeaderRow alignItems="center">
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
            </PanelHeaderRow>

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
                      onDragStart={(
                        event: React.DragEvent<HTMLButtonElement>,
                      ) => event.preventDefault()}
                      onPointerDown={(
                        event: React.PointerEvent<HTMLButtonElement>,
                      ) => handleLibrarySpritePointerDown(event, spriteIndex)}
                    >
                      <Stack
                        useFlexGap
                        alignItems="center"
                        justifyContent="center"
                        width="100%"
                        spacing="0.375rem"
                      >
                        <CharacterModeTilePreview
                          scale={3}
                          tileOption={O.some(sprite)}
                        />
                        <PreviewLabel>{`Sprite ${spriteIndex}`}</PreviewLabel>
                        <Badge tone="accent">{`${sprite.width}×${sprite.height}`}</Badge>
                      </Stack>
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
            <PanelHeaderRow alignItems="center">
              <FieldLabel>キャラクタープレビュー</FieldLabel>
              <Stack direction="row" spacing="0.5rem" alignItems="center">
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
              </Stack>
            </PanelHeaderRow>

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
                        onDragStart={(
                          event: React.DragEvent<HTMLButtonElement>,
                        ) => event.preventDefault()}
                        onPointerDown={(
                          event: React.PointerEvent<HTMLButtonElement>,
                        ) =>
                          handleLibraryCharacterPointerDown(
                            event,
                            characterCard.id,
                          )
                        }
                      >
                        <Stack
                          useFlexGap
                          alignItems="center"
                          justifyContent="center"
                          width="100%"
                          spacing="0.375rem"
                        >
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
                        </Stack>
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
        </Stack>

        <Stack minHeight={0} minWidth={0} flex="1 1 0">
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
                tabIndex={0}
                onContextMenu={handleStageContextMenuWithBackgroundEditing}
                onKeyDown={handleStageKeyDown}
                onPointerDown={handleStagePointerDownWithBackgroundEditing}
                onPointerMove={handleStagePointerMoveWithBackgroundEditing}
                onPointerUp={handleStagePointerEndWithBackgroundEditing}
                onPointerCancel={handleStagePointerEndWithBackgroundEditing}
                onClick={backgroundEditing?.onClick}
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

                {backgroundEditing?.overlay ?? <></>}
              </StageSurface>
            </PreviewCanvasWrap>
          </PreviewViewport>
        </Stack>
      </Stack>

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
