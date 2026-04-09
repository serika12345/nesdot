interface UseCharacterModeWorkspaceStateArgs {
  closeDecompositionRegionContextMenu: () => void;
  closeSpriteContextMenu: () => void;
  handleComposeWorkspacePointerEnd: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
  handleComposeWorkspacePointerMove: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
  handleDecompositionWorkspacePointerEnd: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
  handleDecompositionWorkspacePointerMove: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
}

export interface CharacterModeWorkspaceStateResult {
  handleWorkspacePointerDownCapture: React.PointerEventHandler<HTMLDivElement>;
  handleWorkspacePointerEnd: React.PointerEventHandler<HTMLDivElement>;
  handleWorkspacePointerMove: React.PointerEventHandler<HTMLDivElement>;
}

export const useCharacterModeWorkspaceState = ({
  closeDecompositionRegionContextMenu,
  closeSpriteContextMenu,
  handleComposeWorkspacePointerEnd,
  handleComposeWorkspacePointerMove,
  handleDecompositionWorkspacePointerEnd,
  handleDecompositionWorkspacePointerMove,
}: UseCharacterModeWorkspaceStateArgs): CharacterModeWorkspaceStateResult => {
  const handleWorkspacePointerDownCapture: React.PointerEventHandler<
    HTMLDivElement
  > = (event) => {
    if (
      typeof Element !== "undefined" &&
      event.target instanceof Element &&
      event.target.closest("[data-sprite-context-menu-root='true']") instanceof
        Element
    ) {
      return;
    }

    if (
      typeof Element !== "undefined" &&
      event.target instanceof Element &&
      event.target.closest(
        "[data-decomposition-region-context-menu-root='true']",
      ) instanceof Element
    ) {
      return;
    }

    closeSpriteContextMenu();
    closeDecompositionRegionContextMenu();
  };

  const handleWorkspacePointerMove: React.PointerEventHandler<
    HTMLDivElement
  > = (event) => {
    if (handleComposeWorkspacePointerMove(event)) {
      return;
    }

    void handleDecompositionWorkspacePointerMove(event);
  };

  const handleWorkspacePointerEnd: React.PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (handleComposeWorkspacePointerEnd(event)) {
      return;
    }

    void handleDecompositionWorkspacePointerEnd(event);
  };

  return {
    handleWorkspacePointerDownCapture,
    handleWorkspacePointerEnd,
    handleWorkspacePointerMove,
  };
};
