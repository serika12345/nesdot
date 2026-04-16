import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  COLLAPSE_TOGGLE_CLASS_NAME,
  SCREEN_FLOATING_DRAG_PREVIEW_CLASS_NAME,
  SCREEN_LIBRARY_PREVIEW_BUTTON_CLASS_NAME,
  SCREEN_LIBRARY_SCROLL_AREA_CLASS_NAME,
  SCREEN_LIBRARY_SECTION_CLASS_NAME,
  SCREEN_PREVIEW_LABEL_CLASS_NAME,
  SCREEN_SPRITE_LIBRARY_SCROLL_AREA_CLASS_NAME,
  SCREEN_STAGE_INTERACTION_LAYER_CLASS_NAME,
  SCREEN_STAGE_MARQUEE_CLASS_NAME,
  SCREEN_STAGE_SPRITE_INDEX_CLASS_NAME,
  SCREEN_STAGE_SPRITE_OUTLINE_CLASS_NAME,
  SCREEN_STAGE_SURFACE_CLASS_NAME,
} from "../../../../../styleClassNames";
import { CharacterModeTilePreview } from "../../../../characterMode/ui/preview/CharacterModeTilePreview";
import { ScreenCanvas } from "../../../../common/ui/canvas/ScreenCanvas";
import type { ScreenModeState } from "../../../logic/useScreenModeState";
import { ScreenModeCharacterPreview } from "../../preview/ScreenModeCharacterPreview";
import {
  CharacterLibraryGrid,
  CharacterPreviewTiles,
  LibrarySectionContent,
  PreviewCanvasWrap,
  PreviewViewport,
  SpriteLibraryGrid,
} from "../../primitives/ScreenModePrimitives";
import {
  collapseChevronStyle,
  createScaledRectStyle,
  floatingDragPreviewStyle,
  sidebarScrollStyle,
  stageSurfaceStyle,
} from "./styles";

const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";

const helperTextStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  lineHeight: 1.7,
  color: "var(--ink-soft)",
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "var(--ink-soft)",
};

const badgeBaseStyle: React.CSSProperties = {
  width: "fit-content",
  padding: "0.4375rem 0.75rem",
  borderRadius: "62.4375rem",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
};

const resolveBadgeStyle = (
  tone: "neutral" | "accent" | "danger",
): React.CSSProperties => {
  if (tone === "neutral") {
    return {
      ...badgeBaseStyle,
      color: "var(--ink-soft)",
      background: "rgba(148, 163, 184, 0.12)",
      border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
    };
  }

  if (tone === "accent") {
    return {
      ...badgeBaseStyle,
      color: "#0f766e",
      background: "rgba(15, 118, 110, 0.12)",
      border: "0.0625rem solid rgba(15, 118, 110, 0.18)",
    };
  }

  return {
    ...badgeBaseStyle,
    color: "#be123c",
    background: "rgba(190, 24, 93, 0.1)",
    border: "0.0625rem solid rgba(190, 24, 93, 0.16)",
  };
};

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

        const characterPreviewGrid = pipe(
          previewCardOption,
          O.chain((previewCard) => previewCard.previewGrid),
        );

        const characterPreviewName = pipe(
          previewCardOption,
          O.match(
            () => "Character",
            (previewCard) => previewCard.name,
          ),
        );

        return (
          <div
            className={SCREEN_FLOATING_DRAG_PREVIEW_CLASS_NAME}
            style={floatingDragPreviewStyle(
              dragState.clientX,
              dragState.clientY,
            )}
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
                <CharacterPreviewTiles>
                  <ScreenModeCharacterPreview
                    maxHeightPx={88}
                    maxWidthPx={112}
                    preferredScale={3}
                    previewGrid={characterPreviewGrid}
                  />
                </CharacterPreviewTiles>
              )}
              <span className={SCREEN_PREVIEW_LABEL_CLASS_NAME}>
                {dragState.kind === "sprite"
                  ? `Sprite ${dragState.spriteIndex}`
                  : characterPreviewName}
              </span>
            </Stack>
          </div>
        );
      },
    ),
  );

  return (
    <>
      <Box component="p" m={0} mt={0.25} style={helperTextStyle}>
        スプライト/キャラクタープレビューをドラッグして配置。右クリックで編集メニュー、Shift+クリックで複数選択、ドラッグで移動できます。
      </Box>

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
          style={sidebarScrollStyle}
          role="complementary"
          aria-label="スクリーン配置サイドバー"
        >
          <Stack
            className={SCREEN_LIBRARY_SECTION_CLASS_NAME}
            position="relative"
            flexShrink={0}
            overflow="hidden"
            p={1.5}
            spacing={1.25}
            useFlexGap
            minHeight={0}
            role="region"
            aria-label="スクリーン配置スプライトライブラリ"
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing="0.75rem"
              flexWrap="wrap"
              useFlexGap
            >
              <Stack direction="row" spacing="0.75rem" alignItems="center">
                <Box component="span" style={fieldLabelStyle}>
                  スプライトプレビュー
                </Box>
                <ButtonBase
                  type="button"
                  className={COLLAPSE_TOGGLE_CLASS_NAME}
                  data-open={toBooleanDataValue(isSpriteLibraryOpen)}
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
                </ButtonBase>
              </Stack>
            </Stack>

            <LibrarySectionContent
              id={spriteLibraryContentId}
              open={isSpriteLibraryOpen}
              aria-hidden={isSpriteLibraryOpen === false}
            >
              <div
                className={`${SCREEN_LIBRARY_SCROLL_AREA_CLASS_NAME} ${SCREEN_SPRITE_LIBRARY_SCROLL_AREA_CLASS_NAME}`}
              >
                <SpriteLibraryGrid>
                  {sprites.map((sprite, spriteIndex) => (
                    <ButtonBase
                      key={`screen-library-sprite-${spriteIndex}`}
                      className={SCREEN_LIBRARY_PREVIEW_BUTTON_CLASS_NAME}
                      type="button"
                      aria-label={`スクリーンライブラリスプライト ${spriteIndex}`}
                      data-dragging-state={toBooleanDataValue(
                        isSpriteDragState(gestureLibraryDragState, spriteIndex),
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
                        <span className={SCREEN_PREVIEW_LABEL_CLASS_NAME}>
                          {`Sprite ${spriteIndex}`}
                        </span>
                        <span style={resolveBadgeStyle("accent")}>
                          {`${sprite.width}×${sprite.height}`}
                        </span>
                      </Stack>
                    </ButtonBase>
                  ))}
                </SpriteLibraryGrid>
              </div>
            </LibrarySectionContent>
          </Stack>

          <Stack
            className={SCREEN_LIBRARY_SECTION_CLASS_NAME}
            position="relative"
            flexShrink={0}
            overflow="hidden"
            p={1.5}
            spacing={1.25}
            useFlexGap
            minHeight={0}
            role="region"
            aria-label="スクリーン配置キャラクターライブラリ"
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing="0.75rem"
              flexWrap="wrap"
              useFlexGap
            >
              <Box component="span" style={fieldLabelStyle}>
                キャラクタープレビュー
              </Box>
              <Stack direction="row" spacing="0.5rem" alignItems="center">
                <span style={resolveBadgeStyle("neutral")}>
                  {`${characterPreviewCards.length} sets`}
                </span>
                <ButtonBase
                  type="button"
                  className={COLLAPSE_TOGGLE_CLASS_NAME}
                  data-open={toBooleanDataValue(isCharacterLibraryOpen)}
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
                </ButtonBase>
              </Stack>
            </Stack>

            <LibrarySectionContent
              id={characterLibraryContentId}
              open={isCharacterLibraryOpen}
              aria-hidden={isCharacterLibraryOpen === false}
            >
              {characterPreviewCards.length > 0 ? (
                <div className={SCREEN_LIBRARY_SCROLL_AREA_CLASS_NAME}>
                  <CharacterLibraryGrid>
                    {characterPreviewCards.map((characterCard) => (
                      <ButtonBase
                        key={`screen-library-character-${characterCard.id}`}
                        className={SCREEN_LIBRARY_PREVIEW_BUTTON_CLASS_NAME}
                        type="button"
                        aria-label={`スクリーンキャラクタープレビュー ${characterCard.name}`}
                        data-dragging-state={toBooleanDataValue(
                          isCharacterDragState(
                            gestureLibraryDragState,
                            characterCard.id,
                          ),
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
                            <ScreenModeCharacterPreview
                              maxHeightPx={64}
                              maxWidthPx={96}
                              preferredScale={3}
                              previewGrid={characterCard.previewGrid}
                            />
                          </CharacterPreviewTiles>
                          <span className={SCREEN_PREVIEW_LABEL_CLASS_NAME}>
                            {characterCard.name}
                          </span>
                          <span style={resolveBadgeStyle("accent")}>
                            {`${characterCard.spriteCount} sprites`}
                          </span>
                        </Stack>
                      </ButtonBase>
                    ))}
                  </CharacterLibraryGrid>
                </div>
              ) : (
                <Box component="p" m={0} style={helperTextStyle}>
                  先にキャラクター編集モードでセットを作成すると、ここからドラッグ配置できます。
                </Box>
              )}
            </LibrarySectionContent>
          </Stack>
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
              <div
                className={SCREEN_STAGE_SURFACE_CLASS_NAME}
                ref={setStageRef}
                aria-label="スクリーン配置ステージ"
                data-dragging-state={toBooleanDataValue(isStageDragging)}
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
                style={stageSurfaceStyle(stageWidth, stageHeight)}
              >
                <ScreenCanvas
                  ariaLabel="画面プレビューキャンバス"
                  scale={screenZoomLevel}
                  showGrid={true}
                />

                <div
                  className={SCREEN_STAGE_INTERACTION_LAYER_CLASS_NAME}
                  aria-hidden="true"
                >
                  {screen.sprites.map((sprite, index) => (
                    <div
                      key={`screen-stage-sprite-outline-${index}`}
                      className={SCREEN_STAGE_SPRITE_OUTLINE_CLASS_NAME}
                      data-outline-visible-state={toBooleanDataValue(
                        isSpriteOutlineVisible,
                      )}
                      data-selected-state={toBooleanDataValue(
                        gestureSelectedSpriteIndices.has(index),
                      )}
                      data-stage-sprite-outline="true"
                      style={createScaledRectStyle(
                        sprite.x,
                        sprite.y,
                        sprite.width,
                        sprite.height,
                        screenZoomLevel,
                      )}
                    >
                      {isSpriteIndexVisible === true ? (
                        <span className={SCREEN_STAGE_SPRITE_INDEX_CLASS_NAME}>
                          {`#${index}`}
                        </span>
                      ) : (
                        <></>
                      )}
                    </div>
                  ))}

                  {pipe(
                    gestureMarqueeRect,
                    O.match(
                      () => <></>,
                      (rect) => (
                        <div
                          className={SCREEN_STAGE_MARQUEE_CLASS_NAME}
                          style={createScaledRectStyle(
                            rect.x,
                            rect.y,
                            rect.width,
                            rect.height,
                            screenZoomLevel,
                          )}
                        />
                      ),
                    ),
                  )}
                </div>

                {backgroundEditing?.overlay ?? <></>}
              </div>
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
