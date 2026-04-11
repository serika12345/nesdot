import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
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
import {
  SCREEN_CHARACTER_LIBRARY_GRID_CLASS_NAME,
  SCREEN_CHARACTER_PREVIEW_TILES_CLASS_NAME,
  SCREEN_FLOATING_DRAG_PREVIEW_CLASS_NAME,
  SCREEN_LIBRARY_PREVIEW_BUTTON_CLASS_NAME,
  SCREEN_LIBRARY_SCROLL_AREA_CLASS_NAME,
  SCREEN_LIBRARY_SECTION_CLASS_NAME,
  SCREEN_LIBRARY_SECTION_CONTENT_CLASS_NAME,
  SCREEN_PREVIEW_LABEL_CLASS_NAME,
  SCREEN_SPRITE_LIBRARY_GRID_CLASS_NAME,
  SCREEN_SPRITE_LIBRARY_SCROLL_AREA_CLASS_NAME,
  SCREEN_STAGE_INTERACTION_LAYER_CLASS_NAME,
  SCREEN_STAGE_MARQUEE_CLASS_NAME,
  SCREEN_STAGE_SPRITE_INDEX_CLASS_NAME,
  SCREEN_STAGE_SPRITE_OUTLINE_CLASS_NAME,
  SCREEN_STAGE_SURFACE_CLASS_NAME,
} from "../../../styleClassNames";
import { CharacterModeTilePreview } from "../../characterMode/preview/CharacterModeTilePreview";
import { ScreenCanvas } from "../../common/canvas/ScreenCanvas";
import type { ScreenModeState } from "../hooks/useScreenModeState";
import {
  PreviewCanvasWrap,
  PreviewViewport,
} from "../primitives/ScreenModePrimitives";

const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";

const collapseChevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
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
            () => <div className={SCREEN_CHARACTER_PREVIEW_TILES_CLASS_NAME} />,
            (previewCard) => (
              <div className={SCREEN_CHARACTER_PREVIEW_TILES_CLASS_NAME}>
                {previewCard.previewSpriteIndices.map((spriteIndex) => (
                  <CharacterModeTilePreview
                    key={`floating-character-sprite-${previewCard.id}-${spriteIndex}`}
                    scale={2}
                    tileOption={O.fromNullable(sprites[spriteIndex])}
                  />
                ))}
              </div>
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
          <div
            className={SCREEN_FLOATING_DRAG_PREVIEW_CLASS_NAME}
            style={{
              left: dragState.clientX + 18,
              top: dragState.clientY + 18,
            }}
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
      <HelperText mt={0.25}>
        スプライト/キャラクタープレビューをドラッグして配置。右クリックで編集メニュー、Shift+クリックで複数選択、ドラッグで移動できます。
      </HelperText>

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

            <div
              className={SCREEN_LIBRARY_SECTION_CONTENT_CLASS_NAME}
              id={spriteLibraryContentId}
              data-open-state={toBooleanDataValue(isSpriteLibraryOpen)}
              aria-hidden={isSpriteLibraryOpen === false}
            >
              <div
                className={`${SCREEN_LIBRARY_SCROLL_AREA_CLASS_NAME} ${SCREEN_SPRITE_LIBRARY_SCROLL_AREA_CLASS_NAME}`}
              >
                <div className={SCREEN_SPRITE_LIBRARY_GRID_CLASS_NAME}>
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
                        <Badge tone="accent">{`${sprite.width}×${sprite.height}`}</Badge>
                      </Stack>
                    </ButtonBase>
                  ))}
                </div>
              </div>
            </div>
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

            <div
              className={SCREEN_LIBRARY_SECTION_CONTENT_CLASS_NAME}
              id={characterLibraryContentId}
              data-open-state={toBooleanDataValue(isCharacterLibraryOpen)}
              aria-hidden={isCharacterLibraryOpen === false}
            >
              {characterPreviewCards.length > 0 ? (
                <div className={SCREEN_LIBRARY_SCROLL_AREA_CLASS_NAME}>
                  <div className={SCREEN_CHARACTER_LIBRARY_GRID_CLASS_NAME}>
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
                          <div
                            className={
                              SCREEN_CHARACTER_PREVIEW_TILES_CLASS_NAME
                            }
                          >
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
                          </div>
                          <span className={SCREEN_PREVIEW_LABEL_CLASS_NAME}>
                            {characterCard.name}
                          </span>
                          <Badge tone="accent">{`${characterCard.spriteCount} sprites`}</Badge>
                        </Stack>
                      </ButtonBase>
                    ))}
                  </div>
                </div>
              ) : (
                <HelperText>
                  先にキャラクター編集モードでセットを作成すると、ここからドラッグ配置できます。
                </HelperText>
              )}
            </div>
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
                style={{ width: stageWidth, height: stageHeight }}
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
                      style={{
                        left: sprite.x * screenZoomLevel,
                        top: sprite.y * screenZoomLevel,
                        width: sprite.width * screenZoomLevel,
                        height: sprite.height * screenZoomLevel,
                      }}
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
                          style={{
                            left: rect.x * screenZoomLevel,
                            top: rect.y * screenZoomLevel,
                            width: rect.width * screenZoomLevel,
                            height: rect.height * screenZoomLevel,
                          }}
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
