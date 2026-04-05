import { Stack } from "@mui/material";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { createPortal } from "react-dom";
import { type SpriteTile } from "../../../application/state/projectStore";
import { renderSpriteTileToHexArray } from "../../../domain/nes/rendering";
import {
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
} from "../../App.styles";
import { ProjectActions } from "../common/ProjectActions";
import { CharacterModeComposeWorkspace } from "./CharacterModeComposeWorkspace";
import { CharacterModeDecomposeWorkspace } from "./CharacterModeDecomposeWorkspace";
import {
  CharacterWorkspaceRoot,
  EmptyTilePreview,
  PixelPreviewCell,
  PortalOverlay,
  PositionedActionMenu,
  PositionedActionMenuButton,
} from "./CharacterModeLayoutPrimitives";
import { CharacterModeSetHeader } from "./CharacterModeSetHeader";
import {
  STAGE_CONTEXT_MENU_HEIGHT,
  STAGE_CONTEXT_MENU_WIDTH,
  useCharacterModeController,
} from "./hooks/useCharacterModeController";
import { selectCharacterEditorModeValue } from "./view/characterEditorMode";

const PREVIEW_TRANSPARENT_HEX = "#00000000";

/**
 * キャラクター編集モード全体の UI を描画します。
 * controller と共通ヘッダーを束ね、mode ごとのワークスペース選択だけを一箇所で行います。
 */
export const CharacterMode: React.FC = () => {
  const controller = useCharacterModeController();
  const {
    activeSet,
    activeSetId,
    characterSets,
    editorMode,
    handleCreateSet,
    handleDeleteSet,
    handleNewNameChange,
    handleSelectSet,
    handleWorkspacePointerDownCapture,
    handleWorkspacePointerEnd,
    handleWorkspacePointerMove,
    newName,
    projectActions,
    selectedCharacterId,
    spriteContextMenu,
    closeSpriteContextMenu,
    spritePalettes,
    focusStageElement,
    handleDeleteContextMenuSprite,
    handleShiftContextMenuSpriteLayer,
    getSpriteTile,
  } = controller;

  const renderTilePixels = (
    tileOption: O.Option<SpriteTile>,
    scale: number,
    keyPrefix: string,
  ): React.ReactElement => {
    if (O.isNone(tileOption)) {
      return (
        <EmptyTilePreview previewWidth={8 * scale} previewHeight={16 * scale} />
      );
    }

    const tile = tileOption.value;
    const hexPixels = renderSpriteTileToHexArray(tile, spritePalettes);

    return (
      <Stack
        spacing={0}
        width={tile.width * scale}
        height={tile.height * scale}
        alignItems="stretch"
      >
        {tile.pixels.map((pixelRow, rowIndex) => (
          <Stack
            key={`pixel-row-${keyPrefix}-${rowIndex}`}
            direction="row"
            spacing={0}
            alignItems="stretch"
          >
            {pixelRow.map((colorIndex, columnIndex) => {
              const hexRowOption = O.fromNullable(hexPixels[rowIndex]);
              const hexOption = pipe(
                hexRowOption,
                O.chain((row) => O.fromNullable(row[columnIndex])),
              );
              const colorHex = pipe(
                hexOption,
                O.getOrElse(() => PREVIEW_TRANSPARENT_HEX),
              );
              const isTransparent = colorIndex === 0;

              return (
                <PixelPreviewCell
                  key={`pixel-${keyPrefix}-${rowIndex}-${columnIndex}`}
                  pixelSize={scale}
                  colorHex={isTransparent ? "transparent" : colorHex}
                />
              );
            })}
          </Stack>
        ))}
      </Stack>
    );
  };

  const renderSpritePixels = (spriteIndex: number, scale: number) =>
    renderTilePixels(
      getSpriteTile(spriteIndex),
      scale,
      `sprite-${spriteIndex}`,
    );

  const spriteContextMenuPortal =
    typeof document === "undefined"
      ? O.none
      : pipe(
          spriteContextMenu,
          O.map((menuState) => {
            const viewportWidth =
              typeof window === "undefined"
                ? menuState.clientX
                : window.innerWidth;
            const viewportHeight =
              typeof window === "undefined"
                ? menuState.clientY
                : window.innerHeight;
            const left = Math.max(
              12,
              Math.min(
                menuState.clientX,
                viewportWidth - STAGE_CONTEXT_MENU_WIDTH - 12,
              ),
            );
            const top = Math.max(
              12,
              Math.min(
                menuState.clientY,
                viewportHeight - STAGE_CONTEXT_MENU_HEIGHT - 12,
              ),
            );
            const menuActions: ReadonlyArray<{
              label: string;
              onSelect: () => void;
              tone?: "default" | "danger";
            }> = [
              {
                label: "レイヤーを上げる",
                onSelect: () =>
                  handleShiftContextMenuSpriteLayer(
                    menuState.spriteEditorIndex,
                    1,
                  ),
              },
              {
                label: "レイヤーを下げる",
                onSelect: () =>
                  handleShiftContextMenuSpriteLayer(
                    menuState.spriteEditorIndex,
                    -1,
                  ),
              },
              {
                label: "削除",
                onSelect: () =>
                  handleDeleteContextMenuSprite(menuState.spriteEditorIndex),
                tone: "danger",
              },
            ];

            return createPortal(
              <PortalOverlay
                data-sprite-context-menu-root="true"
                onContextMenu={controller.handleComposeContextMenu}
                onPointerDown={closeSpriteContextMenu}
              >
                <PositionedActionMenu
                  role="menu"
                  aria-label="スプライトメニュー"
                  onPointerDown={(event) => event.stopPropagation()}
                  menuLeft={left}
                  menuTop={top}
                  menuWidth={STAGE_CONTEXT_MENU_WIDTH}
                  ready={true}
                >
                  {menuActions.map((action) => (
                    <PositionedActionMenuButton
                      key={action.label}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        action.onSelect();
                        focusStageElement();
                      }}
                      danger={action.tone === "danger"}
                    >
                      {action.label}
                    </PositionedActionMenuButton>
                  ))}
                </PositionedActionMenu>
              </PortalOverlay>,
              document.body,
            );
          }),
        );

  const renderWorkspace = selectCharacterEditorModeValue(editorMode, {
    compose: () => (
      <CharacterModeComposeWorkspace
        controller={controller}
        renderSpritePixels={renderSpritePixels}
      />
    ),
    decompose: () => (
      <CharacterModeDecomposeWorkspace
        controller={controller}
        renderSpritePixels={renderSpritePixels}
        renderTilePixels={renderTilePixels}
      />
    ),
  });

  return (
    <Panel flex={1} minHeight={0} height="100%">
      <PanelHeader>
        <PanelHeaderRow>
          <PanelTitle>キャラクター編集</PanelTitle>
          <ProjectActions actions={projectActions} />
        </PanelHeaderRow>
      </PanelHeader>

      <CharacterWorkspaceRoot
        flex={1}
        onPointerDownCapture={handleWorkspacePointerDownCapture}
        onPointerMoveCapture={handleWorkspacePointerMove}
        onPointerUpCapture={handleWorkspacePointerEnd}
        onPointerCancelCapture={handleWorkspacePointerEnd}
      >
        <CharacterModeSetHeader
          newName={newName}
          selectedCharacterId={selectedCharacterId}
          characterSets={characterSets}
          activeSetAvailable={O.isSome(activeSet)}
          activeSetId={activeSetId}
          onNewNameChange={handleNewNameChange}
          onCreateSet={handleCreateSet}
          onSelectSet={handleSelectSet}
          onDeleteSet={handleDeleteSet}
        />

        {renderWorkspace()}

        {pipe(
          spriteContextMenuPortal,
          O.match(
            () => <></>,
            (menu) => menu,
          ),
        )}
      </CharacterWorkspaceRoot>
    </Panel>
  );
};
